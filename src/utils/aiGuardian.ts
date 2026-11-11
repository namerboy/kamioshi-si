import { EmaPlaque, GuardianVerdict, HarmCategory } from '../types';

/**
 * Type declarations for the browser Built-in AI Prompt API (Gemini Nano).
 * Follows the W3C / Chrome Built-in AI specification (`LanguageModel` in self).
 */
interface LanguageModelSession {
  prompt(
    input: string,
    options?: {
      responseConstraint?: Record<string, unknown>;
      signal?: AbortSignal;
    }
  ): Promise<string>;
  clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
  destroy(): void;
}

interface LanguageModelFactory {
  availability(): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
  create(options?: {
    initialPrompts?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    monitor?: (m: EventTarget) => void;
  }): Promise<LanguageModelSession>;
}

const GUARDIAN_CACHE_KEY = 'kamioshi_guardian_cache_v2';
const HIDDEN_PLAQUES_KEY = 'kamioshi_hidden_plaques_v2';
const REPORT_LOG_KEY = 'kamioshi_reported_plaques_v2';

/**
 * Convert Japanese Katakana to Hiragana so evasion via script-switching
 * (e.g., writing シネ instead of しね / 死ね) is caught uniformly.
 */
function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

/**
 * Normalize text for evasion-resistant inspection:
 * - NFKC normalization (converts full-width ASCII ＡＢＣ -> ABC, circled chars, etc.)
 * - Strips zero-width & invisible formatting characters
 * - Converts katakana to hiragana
 * - Collapses spaced-out single-character evasion ("k i l l" -> "kill", "し ね" -> "しね")
 * - Maps common leetspeak substitutions (1->i, 3->e, 4->a, 0->o, $->s, @->a, !->i)
 */
export function normalizeForModeration(raw: string): {
  normalized: string;
  collapsed: string;
  deLeeted: string;
} {
  const nfkc = raw
    .normalize('NFKC')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .toLowerCase();

  const hira = katakanaToHiragana(nfkc);

  // Collapse deliberate spacing/dots between letters (e.g. "k.i.l.l" or "死 ね")
  const collapsed = hira.replace(/[\s._\-*+|~`'"^]+/g, '');

  // De-leet version for English evasion checks
  const deLeeted = collapsed
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/!/g, 'i');

  return {
    normalized: hira,
    collapsed,
    deLeeted
  };
}

/**
 * 1. SELF-HARM, SUICIDE & VIOLENT THREATS (EN + JA)
 */
const SELF_HARM_AND_VIOLENCE_PATTERNS: RegExp[] = [
  /\b(kys|kill\s*your\s*self|kill\s*urself|go\s*die|hope\s*you\s*die|i\s*will\s*kill|murder\s*you|shoot\s*you|stab\s*you|bomb\s*threat|commit\s*suicide|hang\s*yourself|slit\s*your)\b/i,
  /(死ね|しね|氏ね|タヒね|たひね|殺す|ころす|殺害|自殺しろ|消えろ|きえろ|くたばれ|生きている価値|地獄に落ちろ|ぶっ殺す|刺す|爆破予告)/u
];

/**
 * 2. HATE SPEECH, EXTREMISM & SEVERE SLURS (EN + JA)
 */
const HATE_SPEECH_PATTERNS: RegExp[] = [
  /\b(nigger|nigga|faggot|fag|tranny|retard|retarded|kike|spic|chink|gook|wetback|neonazi|hitler\s*was\s*right|white\s*power|heil\s*hitler|kkk)\b/i,
  /(n[1i!]gg[e3a4]|f[a4@]gg[o0]t|tr[a4@]nny|r[e3]t[a4@]rd)/i,
  /(チョン|シナ人|支那人|土人|ガイジ|がいじ|池沼|ちしょう|部落|穢多)/u
];

/**
 * 3. HARASSMENT, CYBERBULLYING & JAPANESE DEFAMATION (誹謗中傷 / Anti-Fan Slander)
 */
const HARASSMENT_DEFAMATION_PATTERNS: RegExp[] = [
  /\b(whore|slut|prostitute|pedo|pedophile|groomer|rapist|stalker|scumbag|piece\s*of\s*shit|worthless\s*trash|kill\s*all|ugly\s*bitch|dumb\s*bitch|cunt|fuck\s*you|fuck\s*off|piss\s*off)\b/i,
  /(引退しろ|いんたいしろ|卒業しろ|炎上しろ|ブス|ぶす|ババア|ばばあ|キモい|きもい|ゴミ人間|人間のクズ|カス|詐欺師|枕営業|まくら営業|売春|援交|パパ活|パクリ野郎|整形モンスター|メンヘラビッチ|ヤリマン|犯罪者|気持ち悪いから消えろ|アンチ)/u
];

/**
 * 4. DOXXING, PII LEAKAGE & CREATOR/VTUBER REAL-IDENTITY EXPOSURE (中の人・前世・個人情報晒し)
 */
const DOXXING_PII_PATTERNS: RegExp[] = [
  // Email address
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  // Phone numbers (US/International & Japanese 090/080/070-XXXX-XXXX)
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]\d{3,4}[\s.-]\d{4}\b/,
  /\b0[789]0\d{8}\b/,
  // IPv4 address
  /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
  // SSN / Credit card-like sequences (13-16 digits)
  /\b(?:\d[ -]*?){13,16}\b/,
  // Doxxing terminology (EN + JA VTuber/Creator identity exposure)
  /\b(doxx|doxxed|real\s*address|home\s*address|leaked\s*address|social\s*security\s*number|private\s*phone)\b/i,
  /(中の人|なかのひと|前世バレ|顔バレ|本名晒し|本名は|住所特定|自宅住所|電話番号は|個人情報晒し)/u
];

/**
 * 5. NSFW / EXPLICIT ADULT CONTENT (EN + JA)
 */
const NSFW_PATTERNS: RegExp[] = [
  /\b(porn|pornhub|xvideos|onlyfans|nsfw|hentai|blowjob|handjob|cumshot|gangbang|incest|loli|shota|deepfake\s*porn|nude\s*leaks)\b/i,
  /(無修正|アダルト動画|エロ動画|セフレ募集|裏垢女子|ハメ撮り|児童ポルノ|淫行|中出し|フェラ|オナニー)/u
];

/**
 * Deterministic "Bottled AI" Content Safety Classifier.
 * Runs instantaneously (<1ms) on the client with zero network dependency.
 */
export function evaluateWithBottledMonitor(
  kamioshiName: string,
  message: string,
  authorName: string = '',
  location: string = ''
): GuardianVerdict {
  const combinedRaw = `${kamioshiName} | ${message} | ${authorName} | ${location}`;
  const { normalized, collapsed, deLeeted } = normalizeForModeration(combinedRaw);

  // 1. Check Self-Harm & Violent Threats
  for (const pattern of SELF_HARM_AND_VIOLENCE_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(collapsed)) {
      return {
        allowed: false,
        category: 'self_harm_violence',
        engine: 'bottled-heuristic',
        confidence: 0.99,
        reasonEn: 'Please write a supportive wish. Threats or harmful words cannot be hung on the wall.',
        reasonJa: '温かい願いを刻んでください。危害や脅迫を促す内容は奉納できません。'
      };
    }
  }

  // 2. Check Hate Speech & Severe Slurs
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(collapsed) || pattern.test(deLeeted)) {
      return {
        allowed: false,
        category: 'hate_speech',
        engine: 'bottled-heuristic',
        confidence: 0.98,
        reasonEn: 'Please keep messages welcoming. Discriminatory or hateful language is not allowed.',
        reasonJa: '敬意を持った言葉を刻んでください。差別的な用語や攻撃的な表現は奉納できません。'
      };
    }
  }

  // 3. Check Doxxing, PII & Creator Identity Exposure
  for (const pattern of DOXXING_PII_PATTERNS) {
    if (pattern.test(combinedRaw) || pattern.test(normalized)) {
      return {
        allowed: false,
        category: 'doxxing_pii',
        engine: 'bottled-heuristic',
        confidence: 0.97,
        reasonEn: 'Please do not include private personal info (phone numbers, addresses) or creator identities.',
        reasonJa: '個人情報（電話番号・住所等）やプライバシーに関わる内容は記入できません。'
      };
    }
  }

  // 4. Check Harassment & Defamation (誹謗中傷)
  for (const pattern of HARASSMENT_DEFAMATION_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(collapsed)) {
      return {
        allowed: false,
        category: 'harassment_defamation',
        engine: 'bottled-heuristic',
        confidence: 0.96,
        reasonEn: 'Please keep dedications positive. Slander, insults, or harassment cannot be hung on the wall.',
        reasonJa: '温かい応援の言葉を刻んでください。誹謗中傷や侮辱的な内容は奉納できません。'
      };
    }
  }

  // 5. Check NSFW / Explicit Content
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(normalized) || pattern.test(collapsed)) {
      return {
        allowed: false,
        category: 'nsfw_explicit',
        engine: 'bottled-heuristic',
        confidence: 0.97,
        reasonEn: 'Explicit adult content cannot be hung on the shrine wall.',
        reasonJa: '成人向け・わいせつな内容は絵馬掛けに奉納できません。'
      };
    }
  }

  return {
    allowed: true,
    category: 'safe',
    engine: 'bottled-heuristic',
    confidence: 0.95
  };
}

/**
 * Built-in Browser AI (`LanguageModel` / Gemini Nano) Session Manager.
 * Follows modern-web-guidance `language-model`:
 * - Pre-warms a base session with `initialPrompts` when the user opens the modal.
 * - Clones the base session for individual classification checks and calls `destroy()` on clones.
 * - Uses `responseConstraint` with a plain JSON Schema object.
 * - Caches results in `sessionStorage` keyed by normalized text.
 */
let baseGuardianSessionPromise: Promise<LanguageModelSession | null> | null = null;

function getLanguageModelFactory(): LanguageModelFactory | null {
  if (typeof self !== 'undefined' && 'LanguageModel' in self) {
    return (self as unknown as { LanguageModel: LanguageModelFactory }).LanguageModel;
  }
  return null;
}

const GUARDIAN_SYSTEM_PROMPT =
  'You are a safety moderation classifier for a Japanese shrine appreciation board (ema wall). ' +
  'Determine if a user inscription is safe, appreciative fan support, or if it contains harmful content ' +
  '(harassment, defamation, hate speech, doxxing/PII, self-harm/violence, NSFW, or spam).';

const GUARDIAN_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    is_safe: { type: 'boolean' },
    category: {
      type: 'string',
      enum: [
        'safe',
        'harassment_defamation',
        'hate_speech',
        'self_harm_violence',
        'doxxing_pii',
        'nsfw_explicit',
        'spam_solicitation'
      ]
    }
  },
  required: ['is_safe', 'category']
};

/**
 * Pre-warm the base LanguageModel session when the user opens the Hang Plaque modal
 * so cold-start latency is eliminated before submission.
 */
export async function prewarmGuardianSession(): Promise<boolean> {
  const factory = getLanguageModelFactory();
  if (!factory) return false;

  if (baseGuardianSessionPromise) {
    const existing = await baseGuardianSessionPromise;
    return existing !== null;
  }

  baseGuardianSessionPromise = (async () => {
    try {
      const availability = await factory.availability();
      if (availability === 'unavailable') {
        return null;
      }
      const session = await factory.create({
        initialPrompts: [{ role: 'system', content: GUARDIAN_SYSTEM_PROMPT }]
      });
      return session;
    } catch {
      return null;
    }
  })();

  const readySession = await baseGuardianSessionPromise;
  return readySession !== null;
}

function getCachedVerdict(cacheKey: string): GuardianVerdict | null {
  try {
    const raw = sessionStorage.getItem(GUARDIAN_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, GuardianVerdict>;
    return map[cacheKey] || null;
  } catch {
    return null;
  }
}

function setCachedVerdict(cacheKey: string, verdict: GuardianVerdict): void {
  try {
    const raw = sessionStorage.getItem(GUARDIAN_CACHE_KEY);
    const map: Record<string, GuardianVerdict> = raw ? JSON.parse(raw) : {};
    // Keep cache bounded to 50 recent evaluations
    const keys = Object.keys(map);
    if (keys.length >= 50) {
      delete map[keys[0]];
    }
    map[cacheKey] = verdict;
    sessionStorage.setItem(GUARDIAN_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Full hybrid evaluation:
 * 1. Instant Bottled Heuristic & Semantic Monitor (<1ms)
 * 2. Cached result lookup in `sessionStorage`
 * 3. On-device Browser Built-in AI (`LanguageModel` Prompt API) with cloned session & JSON Schema constraint
 */
export async function evaluatePlaqueSafetyAsync(
  kamioshiName: string,
  message: string,
  authorName: string = '',
  location: string = '',
  signal?: AbortSignal
): Promise<GuardianVerdict> {
  // Step 1: Fast deterministic Bottled AI Monitor check
  const heuristicVerdict = evaluateWithBottledMonitor(kamioshiName, message, authorName, location);
  if (!heuristicVerdict.allowed) {
    return heuristicVerdict;
  }

  // Normalize key for sessionStorage cache
  const cacheKey = `${kamioshiName}|${message}|${authorName}|${location}`
    .trim()
    .toLowerCase();

  const cached = getCachedVerdict(cacheKey);
  if (cached) {
    return cached;
  }

  // Step 2: Check if browser Built-in AI (`LanguageModel` in self) is available
  const factory = getLanguageModelFactory();
  if (!factory) {
    setCachedVerdict(cacheKey, heuristicVerdict);
    return heuristicVerdict;
  }

  let clonedSession: LanguageModelSession | null = null;
  try {
    const availability = await factory.availability();
    if (availability === 'unavailable') {
      setCachedVerdict(cacheKey, heuristicVerdict);
      return heuristicVerdict;
    }

    if (!baseGuardianSessionPromise) {
      await prewarmGuardianSession();
    }
    const baseSession = await baseGuardianSessionPromise;
    if (!baseSession) {
      setCachedVerdict(cacheKey, heuristicVerdict);
      return heuristicVerdict;
    }

    // Clone the baseline session per `language-model` guidance and destroy the clone after use
    clonedSession = await baseSession.clone({ signal });

    const conciseInput = `Target: ${kamioshiName.trim().slice(0, 80)}\nMessage: ${message.trim().slice(0, 200)}\nAuthor: ${authorName.trim().slice(0, 40)}`;
    const rawJson = await clonedSession.prompt(conciseInput, {
      responseConstraint: GUARDIAN_RESPONSE_SCHEMA,
      signal
    });

    const parsed = JSON.parse(rawJson) as {
      is_safe?: boolean;
      category?: HarmCategory;
    };

    if (parsed && parsed.is_safe === false) {
      const cat: HarmCategory = parsed.category && parsed.category !== 'safe'
        ? parsed.category
        : 'harassment_defamation';

      const aiVerdict: GuardianVerdict = {
        allowed: false,
        category: cat,
        engine: 'built-in-ai',
        confidence: 0.94,
        reasonEn: 'Please write a respectful dedication without insults or inappropriate language.',
        reasonJa: '温かい応援の言葉を刻んでください。不適切な表現は奉納できません。'
      };
      setCachedVerdict(cacheKey, aiVerdict);
      return aiVerdict;
    }

    const safeAiVerdict: GuardianVerdict = {
      allowed: true,
      category: 'safe',
      engine: 'built-in-ai',
      confidence: 0.99
    };
    setCachedVerdict(cacheKey, safeAiVerdict);
    return safeAiVerdict;
  } catch {
    // Graceful fallback to Bottled Heuristic Monitor if Prompt API aborts or isn't supported
    return heuristicVerdict;
  } finally {
    if (clonedSession) {
      try {
        clonedSession.destroy();
      } catch {
        // ignore cleanup error
      }
    }
  }
}

/**
 * Filter a list of plaques through the Bottled AI Guardian and local hidden list
 * so tampered storage or external URL payloads can never render harmful text.
 */
export function filterSafePlaques(plaques: EmaPlaque[]): EmaPlaque[] {
  const hiddenIds = getHiddenPlaqueIds();
  return plaques.filter((p) => {
    if (hiddenIds.has(p.id)) return false;
    const verdict = evaluateWithBottledMonitor(
      p.kamioshiName,
      p.message,
      p.authorName,
      p.location
    );
    return verdict.allowed;
  });
}

/**
 * Community Moderation & Local Quarantine Controls (Hide / Report Plaques)
 */
export function getHiddenPlaqueIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_PLAQUES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((x) => typeof x === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

export function reportAndHidePlaque(plaqueId: string, reason: string): void {
  try {
    const current = getHiddenPlaqueIds();
    current.add(plaqueId);
    localStorage.setItem(HIDDEN_PLAQUES_KEY, JSON.stringify(Array.from(current).slice(-500)));

    const rawReports = localStorage.getItem(REPORT_LOG_KEY);
    const reports: Array<{ id: string; reason: string; timestamp: string }> = rawReports
      ? JSON.parse(rawReports)
      : [];
    reports.push({
      id: plaqueId,
      reason,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(REPORT_LOG_KEY, JSON.stringify(reports.slice(-200)));
  } catch {
    // ignore storage errors
  }
}

export function clearHiddenPlaques(): void {
  try {
    localStorage.removeItem(HIDDEN_PLAQUES_KEY);
    localStorage.removeItem(REPORT_LOG_KEY);
  } catch {
    // ignore
  }
}
