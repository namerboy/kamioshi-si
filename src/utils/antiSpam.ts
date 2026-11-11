import { EmaPlaque } from '../types';
import { Language } from '../i18n/translations';
import { evaluateWithBottledMonitor, getHiddenPlaqueIds } from './aiGuardian';

const RATE_LIMIT_STORAGE_KEY = 'kamioshi_rate_limit_v2';
const RUNG_BELLS_STORAGE_KEY = 'kamioshi_rung_bells_v2';

// Rate-limiting constants
export const PLAQUE_COOLDOWN_MS = 30_000; // 30 seconds between plaque dedications
export const PLAQUE_WINDOW_MS = 10 * 60 * 1000; // 10-minute rolling window
export const MAX_PLAQUES_PER_WINDOW = 5; // Max 5 plaques per 10 minutes
export const MIN_MODAL_DWELL_MS = 1_500; // Minimum 1.5s human dwell time before submit
export const BELL_THROTTLE_MS = 600; // Minimum 600ms between bell rings across cards

// Spam & solicitation keyword patterns (case-insensitive)
const SPAM_PATTERNS: RegExp[] = [
  /\b(?:crypto|bitcoin|btc|ethereum|eth|solana|airdrop|presale|token\s*sale|nft\s*mint|free\s*money|make\s*money\s*fast)\b/i,
  /\b(?:casino|slot\s*machine|betting|sportsbook|1xbet|stake\.com|poker\s*bonus|jackpot)\b/i,
  /\b(?:whatsapp|telegram\s*me|dm\s*for\s*promo|buy\s*followers|cheap\s*views|seo\s*service|backlinks)\b/i,
  /\b(?:viagra|cialis|onlyfans|adult\s*dating|camgirl|xxx\s*video)\b/i,
  /\b(?:click\s*here|visit\s*my\s*site|check\s*out\s*my\s*link|earn\s*\$\d+)\b/i
];

// URL & obfuscated link patterns
const URL_AND_DOMAIN_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/gi,
  /www\.\S+/gi,
  /\b(?:t\.me|discord\.gg|bit\.ly|tinyurl\.com|wa\.me|rb\.gy|cutt\.ly|is\.gd)\/\S*/gi,
  /\b[a-z0-9-]+\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\[\.\]|🎯)\s*(?:com|net|org|io|xyz|top|click|info|ru|cn|tk|ml|ga|cf|gq)\b/gi,
  /\b[a-z0-9-]+\.(?:xyz|top|click|loan|work|gq|tk|ml|cf|ga|bet|casino|poker|porn|sex|adult)\b/gi
];

/**
 * Strips HTML tags, URLs, obfuscated domains, zero-width control chars, and Zalgo diacritics.
 */
export function sanitizePlaqueText(input: string, maxLength = 140): string {
  if (!input || typeof input !== 'string') return '';

  let cleaned = input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove invisible / zero-width / bidirectional override characters
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u2060-\u206F]/g, '')
    // Strip excessive Zalgo combining marks (keep up to 2 normal accents/dakuten)
    .replace(/([\u0300-\u036F\u3099\u309A]{2})[\u0300-\u036F\u3099\u309A]+/g, '$1');

  for (const pattern of URL_AND_DOMAIN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned
    // Collapse 5+ repeated punctuation marks to 3
    .replace(/([!?.~！？。、])\1{3,}/g, '$1$1$1')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Detects repetitive character flooding, keyboard mashing, or spam keywords.
 */
export function detectSpamOrGibberish(text: string): { isSpam: boolean; reason?: 'spam_content' | 'repetitive' } {
  const trimmed = text.trim();
  if (!trimmed) return { isSpam: false };

  // 1. Check commercial/scam spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isSpam: true, reason: 'spam_content' };
    }
  }

  // 2. Check 6+ consecutive identical characters (e.g. "aaaaaaaa", "11111111")
  if (/(.)\1{5,}/u.test(trimmed)) {
    return { isSpam: true, reason: 'repetitive' };
  }

  // 3. Check repeated 2-3 char sequences 4+ times (e.g. "asdasdasdasd", "hahahahahaha")
  if (/(.{2,3})\1{3,}/i.test(trimmed)) {
    return { isSpam: true, reason: 'repetitive' };
  }

  // 4. Low character diversity on longer strings (e.g., 16+ chars with <= 2 unique chars)
  const chars = Array.from(trimmed.replace(/\s+/g, '').toLowerCase());
  if (chars.length >= 14) {
    const uniqueCount = new Set(chars).size;
    if (uniqueCount <= 2) {
      return { isSpam: true, reason: 'repetitive' };
    }
  }

  // 5. Pure symbol / punctuation / number mash with zero letters or CJK characters
  if (trimmed.length >= 4 && !/[\p{L}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(trimmed)) {
    return { isSpam: true, reason: 'repetitive' };
  }

  return { isSpam: false };
}

interface RateLimitRecord {
  timestamps: number[];
}

function getRateLimitRecord(): RateLimitRecord {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.timestamps)) {
        const now = Date.now();
        return {
          timestamps: parsed.timestamps.filter(
            (ts: unknown) => typeof ts === 'number' && now - ts < PLAQUE_WINDOW_MS
          )
        };
      }
    }
  } catch {
    // ignore storage read error
  }
  return { timestamps: [] };
}

function saveRateLimitTimestamp(timestamp: number): void {
  try {
    const record = getRateLimitRecord();
    record.timestamps.push(timestamp);
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore storage write error
  }
}

export function getPlaqueCooldownStatus(): {
  canSubmit: boolean;
  waitSeconds: number;
  windowExceeded: boolean;
} {
  const now = Date.now();
  const { timestamps } = getRateLimitRecord();

  if (timestamps.length === 0) {
    return { canSubmit: true, waitSeconds: 0, windowExceeded: false };
  }

  const lastTs = Math.max(...timestamps);
  const elapsed = now - lastTs;
  if (elapsed < PLAQUE_COOLDOWN_MS) {
    return {
      canSubmit: false,
      waitSeconds: Math.ceil((PLAQUE_COOLDOWN_MS - elapsed) / 1000),
      windowExceeded: false
    };
  }

  if (timestamps.length >= MAX_PLAQUES_PER_WINDOW) {
    const oldestInWindow = Math.min(...timestamps);
    const waitMs = Math.max(1000, PLAQUE_WINDOW_MS - (now - oldestInWindow));
    return {
      canSubmit: false,
      waitSeconds: Math.ceil(waitMs / 1000),
      windowExceeded: true
    };
  }

  return { canSubmit: true, waitSeconds: 0, windowExceeded: false };
}

export interface PlaqueValidationResult {
  valid: boolean;
  silentDrop?: boolean;
  errorMessage?: string;
}

export function validatePlaqueSubmission(params: {
  kamioshiName: string;
  message: string;
  authorName: string;
  location: string;
  honeypot: string;
  openedAt: number;
  interactionCount: number;
  isTrustedEvent: boolean;
  existingPlaques: EmaPlaque[];
  language: Language;
}): PlaqueValidationResult {
  const {
    kamioshiName,
    message,
    authorName,
    location,
    honeypot,
    openedAt,
    interactionCount,
    isTrustedEvent,
    existingPlaques,
    language
  } = params;

  // 1. Honeypot check: silently drop automated bot submissions
  if (honeypot && honeypot.trim().length > 0) {
    return { valid: false, silentDrop: true };
  }

  // 2. Untrusted synthetic event or instant zero-dwell bot submission
  const dwellMs = Date.now() - openedAt;
  if (!isTrustedEvent || dwellMs < MIN_MODAL_DWELL_MS || interactionCount < 1) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? '送信が早すぎます。少し時間をおいてから奉納してください。'
          : 'Submission was too fast. Please take a moment to carve your plaque.'
    };
  }

  // 3. Rate limit & cooldown check
  const cooldown = getPlaqueCooldownStatus();
  if (!cooldown.canSubmit) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? `連続奉納の制限中です。あと ${cooldown.waitSeconds} 秒お待ちください。`
          : `Please wait ${cooldown.waitSeconds}s before hanging another plaque.`
    };
  }

  // 4. Clean and validate Oshi Name
  const cleanName = sanitizePlaqueText(kamioshiName, 44);
  if (!cleanName || cleanName.length < 1) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? '推しの名前を入力してください（URLや無効な記号は使用できません）。'
          : 'Please enter a valid Oshi name (links and invalid symbols are not allowed).'
    };
  }

  const nameSpam = detectSpamOrGibberish(cleanName);
  if (nameSpam.isSpam) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? 'スパムまたは不自然な文字列が検出されました。正しい名前を入力してください。'
          : 'Spam or repetitive characters detected in the Oshi name.'
    };
  }

  // 5. Clean and validate Message, Author, Location
  const cleanMessage = sanitizePlaqueText(message, 140);
  if (cleanMessage) {
    const msgSpam = detectSpamOrGibberish(cleanMessage);
    if (msgSpam.isSpam) {
      return {
        valid: false,
        errorMessage:
          language === 'ja'
            ? 'メッセージにスパムまたは不自然な連続文字が含まれています。'
            : 'Please write a genuine message without spam or repetitive character floods.'
      };
    }
  }

  const cleanAuthor = sanitizePlaqueText(authorName, 30);
  if (cleanAuthor && detectSpamOrGibberish(cleanAuthor).isSpam) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? 'お名前欄に不自然な文字列が含まれています。'
          : 'Please enter a valid name or handle.'
    };
  }

  const cleanLocation = sanitizePlaqueText(location, 30);
  if (cleanLocation && detectSpamOrGibberish(cleanLocation).isSpam) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? '地域欄に不自然な文字列が含まれています。'
          : 'Please enter a valid city or location.'
    };
  }

  // 5b. Automated Bottled AI Monitor check for harmful, defamatory, or PII content
  const safetyVerdict = evaluateWithBottledMonitor(
    cleanName,
    cleanMessage,
    cleanAuthor,
    cleanLocation
  );
  if (!safetyVerdict.allowed) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? safetyVerdict.reasonJa || '不適切な表現が検出されたため奉納できません。'
          : safetyVerdict.reasonEn || 'Harmful or inappropriate content was blocked by the Shrine Guardian.'
    };
  }

  // 6. Duplicate plaque detection against existing wall plaques
  const normName = cleanName.toLowerCase();
  const normMsg = cleanMessage.toLowerCase();
  const isDuplicate = existingPlaques.some((p) => {
    const sameName = p.kamioshiName.trim().toLowerCase() === normName;
    const sameMsg = normMsg.length > 0 && p.message.trim().toLowerCase() === normMsg;
    // Block if exact same Oshi + message, or if user just hung a plaque for the exact same Oshi within the last 5 minutes
    const recentSameOshi =
      sameName &&
      p.isOwn &&
      Date.now() - new Date(p.createdAt).getTime() < 5 * 60 * 1000;
    return (sameName && sameMsg) || recentSameOshi;
  });

  if (isDuplicate) {
    return {
      valid: false,
      errorMessage:
        language === 'ja'
          ? '同じ内容の絵馬がすでに奉納されています。'
          : 'A plaque with this exact dedication has already been hung recently.'
    };
  }

  return { valid: true };
}

export function recordPlaqueSubmission(): void {
  saveRateLimitTimestamp(Date.now());
}

/**
 * Lightweight SHA-256 Proof-of-Work challenge solver to deter automated script floods.
 */
export async function computePlaqueProofOfWork(seed: string): Promise<{ nonce: number; hash: string }> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return { nonce: 1, hash: 'fallback' };
  }
  const encoder = new TextEncoder();
  for (let nonce = 0; nonce < 5000; nonce++) {
    const data = encoder.encode(`${seed}:${nonce}`);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    // Require leading 12 bits of zeros (1 in 4096 average, ~2-10ms in browser)
    if (bytes[0] === 0 && (bytes[1] & 0xf0) === 0) {
      const hashHex = Array.from(bytes.slice(0, 6))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return { nonce, hash: hashHex };
    }
  }
  return { nonce: 5000, hash: '000' };
}

/**
 * Per-Plaque Bell Ringing Anti-Bot & Anti-Auto-Clicker Guard
 */
let lastBellRingTimestamp = 0;

export function getRungPlaqueIds(): Set<string> {
  try {
    const raw = localStorage.getItem(RUNG_BELLS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((id): id is string => typeof id === 'string'));
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function hasRungBellForPlaque(plaqueId: string): boolean {
  return getRungPlaqueIds().has(plaqueId);
}

export function tryRecordBellRing(plaqueId: string, isTrusted = true): boolean {
  if (!isTrusted) return false;

  const now = Date.now();
  if (now - lastBellRingTimestamp < BELL_THROTTLE_MS) {
    return false;
  }

  const rungIds = getRungPlaqueIds();
  if (rungIds.has(plaqueId)) {
    lastBellRingTimestamp = now;
    return false;
  }

  rungIds.add(plaqueId);
  lastBellRingTimestamp = now;

  try {
    localStorage.setItem(RUNG_BELLS_STORAGE_KEY, JSON.stringify(Array.from(rungIds).slice(-500)));
  } catch {
    // ignore
  }
  return true;
}

/**
 * Validates and sanitizes plaques loaded from localStorage so tampered storage cannot inject scripts, spam, or harmful content.
 */
export function sanitizeStoredPlaques(raw: unknown): EmaPlaque[] | null {
  if (!Array.isArray(raw)) return null;

  const validPlaques: EmaPlaque[] = [];
  const seenIds = new Set<string>();
  const hiddenIds = getHiddenPlaqueIds();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    if (typeof p.id !== 'string' || seenIds.has(p.id) || hiddenIds.has(p.id)) continue;

    const cleanName = sanitizePlaqueText(String(p.kamioshiName || ''), 44);
    if (!cleanName || detectSpamOrGibberish(cleanName).isSpam) continue;

    const cleanMessage = sanitizePlaqueText(String(p.message || ''), 140);
    if (cleanMessage && detectSpamOrGibberish(cleanMessage).isSpam) continue;

    const cleanAuthor = sanitizePlaqueText(String(p.authorName || 'Fan'), 30) || 'Fan';
    const cleanLocation = sanitizePlaqueText(String(p.location || 'Everywhere'), 30) || 'Everywhere';

    // Run Bottled AI Monitor check on stored plaques
    const safety = evaluateWithBottledMonitor(cleanName, cleanMessage, cleanAuthor, cleanLocation);
    if (!safety.allowed) continue;

    seenIds.add(p.id);
    validPlaques.push({
      id: p.id,
      coordinate: Math.max(1, Math.min(999_999, Math.floor(Number(p.coordinate) || 1))),
      kamioshiName: cleanName,
      category: (typeof p.category === 'string' ? p.category : 'other') as EmaPlaque['category'],
      message: cleanMessage || `Always cheering for ${cleanName}!`,
      authorName: cleanAuthor,
      location: cleanLocation,
      countryCode: String(p.countryCode || 'EARTH').slice(0, 10),
      language: String(p.language || 'Universal').slice(0, 20),
      stamp: (typeof p.stamp === 'string' ? p.stamp : '推') as EmaPlaque['stamp'],
      woodType: (typeof p.woodType === 'string' ? p.woodType : 'hinoki') as EmaPlaque['woodType'],
      cordColor: (typeof p.cordColor === 'string' ? p.cordColor : 'crimson') as EmaPlaque['cordColor'],
      bowCount: Math.max(0, Math.min(100_000, Math.floor(Number(p.bowCount) || 0))),
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
      isOwn: Boolean(p.isOwn)
    });

    if (validPlaques.length >= 200) break;
  }

  return validPlaques;
}

/**
 * Encodes a plaque into a self-contained shareable hash URL so recipients can view
 * a friend's custom plaque without requiring centralized server storage.
 */
export function encodePlaqueShareUrl(plaque: EmaPlaque): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kamioshi.si';
  // For built-in showcase plaques (coordinate <= 12 and id starting with ema_init_), short hash suffices
  if (plaque.id.startsWith('ema_init_')) {
    return `${origin}/#ema=${plaque.coordinate}`;
  }
  try {
    const compactPayload = {
      c: plaque.coordinate,
      n: plaque.kamioshiName.slice(0, 44),
      k: plaque.category,
      m: plaque.message.slice(0, 140),
      a: plaque.authorName.slice(0, 30),
      l: plaque.location.slice(0, 30),
      w: plaque.woodType,
      r: plaque.cordColor || 'crimson',
      s: plaque.stamp,
      b: plaque.bowCount,
      d: plaque.createdAt
    };
    const encoded = encodeURIComponent(JSON.stringify(compactPayload));
    return `${origin}/#ema=${plaque.coordinate}&p=${encoded}`;
  } catch {
    return `${origin}/#ema=${plaque.coordinate}`;
  }
}

/**
 * Decodes a shared URL hash and runs full sanitization + Bottled AI Guardian safety checks
 * before allowing a shared plaque to be displayed.
 */
export function decodeSafePlaqueFromHash(
  hash: string,
  existingPlaques: EmaPlaque[]
): EmaPlaque | null {
  if (!hash || !hash.startsWith('#ema=')) return null;
  const rawQuery = hash.slice(1); // remove '#'
  const params = new URLSearchParams(rawQuery);
  const coordStr = params.get('ema');
  const coord = coordStr ? parseInt(coordStr, 10) : NaN;

  // 1. Check if plaque exists in local wall first
  if (!isNaN(coord)) {
    const localMatch = existingPlaques.find((p) => p.coordinate === coord);
    if (localMatch && !getHiddenPlaqueIds().has(localMatch.id)) {
      return localMatch;
    }
  }

  // 2. If shared via compact URL payload `&p=...`, sanitize & inspect with Bottled AI Guardian
  const payloadParam = params.get('p');
  if (!payloadParam) return null;

  try {
    const decoded = JSON.parse(decodeURIComponent(payloadParam)) as Record<string, unknown>;
    const cleanName = sanitizePlaqueText(String(decoded.n || ''), 44);
    const cleanMessage = sanitizePlaqueText(String(decoded.m || ''), 140);
    const cleanAuthor = sanitizePlaqueText(String(decoded.a || 'Fan'), 30) || 'Fan';
    const cleanLocation = sanitizePlaqueText(String(decoded.l || 'Everywhere'), 30) || 'Everywhere';

    if (!cleanName || detectSpamOrGibberish(cleanName).isSpam) return null;
    if (cleanMessage && detectSpamOrGibberish(cleanMessage).isSpam) return null;

    const verdict = evaluateWithBottledMonitor(cleanName, cleanMessage, cleanAuthor, cleanLocation);
    if (!verdict.allowed) return null;

    const safeCoord = Math.max(1, Math.min(999_999, Math.floor(Number(decoded.c) || coord || 1)));
    const sharedId = `shared_${safeCoord}_${cleanName.toLowerCase().replace(/\s+/g, '_')}`;
    if (getHiddenPlaqueIds().has(sharedId)) return null;

    return {
      id: sharedId,
      coordinate: safeCoord,
      kamioshiName: cleanName,
      category: (typeof decoded.k === 'string' ? decoded.k : 'other') as EmaPlaque['category'],
      message: cleanMessage || `Always cheering for ${cleanName}!`,
      authorName: cleanAuthor,
      location: cleanLocation,
      countryCode: 'EARTH',
      language: 'Universal',
      woodType: (typeof decoded.w === 'string' ? decoded.w : 'hinoki') as EmaPlaque['woodType'],
      cordColor: (typeof decoded.r === 'string' ? decoded.r : 'crimson') as EmaPlaque['cordColor'],
      stamp: (typeof decoded.s === 'string' ? decoded.s : '推') as EmaPlaque['stamp'],
      bowCount: Math.max(1, Math.min(100_000, Math.floor(Number(decoded.b) || 1))),
      createdAt: typeof decoded.d === 'string' ? decoded.d : new Date().toISOString(),
      isOwn: false
    };
  } catch {
    return null;
  }
}
