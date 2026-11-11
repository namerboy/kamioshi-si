// Shared Cloudflare D1 types, moderation, tokenization, and query helpers for Kamioshi.si

export interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface Env {
  DB: D1Database;
}

export interface PagesContext<Params extends Record<string, string> = Record<string, string>> {
  request: Request;
  env: Env;
  params: Params;
  waitUntil: (promise: Promise<unknown>) => void;
}

export interface DbPlaqueRow {
  coordinate: number;
  id: string;
  kamioshi_name: string;
  category: string;
  message: string;
  author_name: string;
  location: string;
  country_code: string;
  wood_type: string;
  cord_color: string;
  stamp: string;
  bow_count: number;
  created_at: string;
  language: string;
  author_token_hash: string | null;
  report_count: number;
  is_hidden: number;
}

export const VALID_CATEGORIES = new Set([
  'vtuber',
  'kpop',
  'anime',
  'esports',
  'music',
  'creator',
  'athlete',
  'place',
  'pet',
  'tech',
  'icon',
  'other'
]);

export const VALID_WOOD_TYPES = new Set([
  'hinoki',
  'cedar',
  'vermilion',
  'obsidian',
  'sandalwood',
  'kinpaku'
]);

export const VALID_CORD_COLORS = new Set(['crimson', 'gold', 'violet', 'jade']);

export const VALID_STAMPS = new Set(['神', '推', '祈', '愛', '勝', '光', '寿', '絆']);

export const JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

export function normalizeText(raw: string): string {
  return katakanaToHiragana(
    raw
      .normalize('NFKC')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
      .toLowerCase()
      .trim()
  );
}

/**
 * Normalizes a Kamioshi / tag name for the 100k+ shrine_tags index.
 */
export function normalizeTagKey(name: string): string {
  return normalizeText(name)
    .replace(/\s+/g, ' ')
    .slice(0, 44);
}

/**
 * Extracts up to 16 normalized search tokens for the WITHOUT ROWID `plaque_tokens` B-tree.
 * Supports both Latin word prefixes and CJK/Japanese/Korean bigrams so 100k+ plaques
 * can be searched in O(log N) without scanning the table.
 */
export function extractSearchTokens(fields: string[]): string[] {
  const tokens = new Set<string>();

  for (const field of fields) {
    if (!field) continue;
    const norm = normalizeText(field);
    if (!norm) continue;

    // 1. Add full normalized phrase if concise (great for exact Kamioshi tag match)
    const compactPhrase = norm.replace(/\s+/g, ' ').slice(0, 32);
    if (compactPhrase.length >= 2 && tokens.size < 16) {
      tokens.add(compactPhrase);
    }

    // 2. Extract Latin / alphanumeric words (2+ chars)
    const latinWords = norm.match(/[a-z0-9]{2,24}/g) || [];
    for (const w of latinWords) {
      if (tokens.size >= 16) break;
      tokens.add(w);
    }

    // 3. Extract CJK / Japanese / Korean contiguous sequences + 2-char bigrams
    const cjkRuns =
      norm.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]{1,16}/gu) || [];
    for (const run of cjkRuns) {
      if (tokens.size >= 16) break;
      const chars = Array.from(run);
      if (chars.length === 1) {
        tokens.add(chars[0]);
      } else {
        tokens.add(chars.slice(0, 10).join(''));
        for (let i = 0; i < chars.length - 1 && tokens.size < 16; i++) {
          tokens.add(chars[i] + chars[i + 1]);
        }
      }
    }
  }

  return Array.from(tokens).slice(0, 16);
}

/**
 * Computes the exclusive upper bound for a B-tree prefix scan: `token >= prefix AND token < nextPrefix`
 */
export function nextLexicographicalPrefix(prefix: string): string {
  const chars = Array.from(prefix);
  if (chars.length === 0) return '\uffff';
  const lastCode = chars[chars.length - 1].codePointAt(0) || 0;
  chars[chars.length - 1] = String.fromCodePoint(lastCode + 1);
  return chars.join('');
}

// Server-side sanitization & Bottled AI Guardian patterns
const URL_AND_DOMAIN_PATTERNS: RegExp[] = [
  /https?:\/\/\S+/gi,
  /www\.\S+/gi,
  /\b(?:t\.me|discord\.gg|bit\.ly|tinyurl\.com|wa\.me|rb\.gy|cutt\.ly|is\.gd)\/\S*/gi,
  /\b[a-z0-9-]+\s*(?:\[\s*dot\s*\]|\(\s*dot\s*\)|\[\.\]|🎯)\s*(?:com|net|org|io|xyz|top|click|info|ru|cn|tk|ml|ga|cf|gq)\b/gi,
  /\b[a-z0-9-]+\.(?:xyz|top|click|loan|work|gq|tk|ml|cf|ga|bet|casino|poker|porn|sex|adult)\b/gi
];

const SPAM_PATTERNS: RegExp[] = [
  /\b(?:crypto|bitcoin|btc|ethereum|eth|solana|airdrop|presale|token\s*sale|nft\s*mint|free\s*money|make\s*money\s*fast)\b/i,
  /\b(?:casino|slot\s*machine|betting|sportsbook|1xbet|stake\.com|poker\s*bonus|jackpot)\b/i,
  /\b(?:whatsapp|telegram\s*me|dm\s*for\s*promo|buy\s*followers|cheap\s*views|seo\s*service|backlinks)\b/i,
  /\b(?:viagra|cialis|onlyfans|adult\s*dating|camgirl|xxx\s*video)\b/i,
  /\b(?:click\s*here|visit\s*my\s*site|check\s*out\s*my\s*link|earn\s*\$\d+)\b/i
];

const MODERATION_PATTERNS: RegExp[] = [
  /\b(kys|kill\s*your\s*self|kill\s*urself|go\s*die|hope\s*you\s*die|i\s*will\s*kill|murder\s*you|shoot\s*you|stab\s*you|bomb\s*threat|commit\s*suicide|hang\s*yourself|slit\s*your)\b/i,
  /(死ね|しね|氏ね|タヒね|たひね|殺す|ころす|殺害|自殺しろ|消えろ|きえろ|くたばれ|生きている価値|地獄に落ちろ|ぶっ殺す|刺す|爆破予告)/u,
  /\b(nigger|nigga|faggot|fag|tranny|retard|retarded|kike|spic|chink|gook|wetback|neonazi|hitler\s*was\s*right|white\s*power|heil\s*hitler|kkk)\b/i,
  /(n[1i!]gg[e3a4]|f[a4@]gg[o0]t|tr[a4@]nny|r[e3]t[a4@]rd)/i,
  /(チョン|シナ人|支那人|土人|ガイジ|がいじ|池沼|ちしょう|部落|穢多)/u,
  /\b(whore|slut|prostitute|pedo|pedophile|groomer|rapist|stalker|scumbag|piece\s*of\s*shit|worthless\s*trash|kill\s*all|ugly\s*bitch|dumb\s*bitch|cunt|fuck\s*you|fuck\s*off|piss\s*off)\b/i,
  /(引退しろ|いんたいしろ|卒業しろ|炎上しろ|ブス|ぶす|ババア|ばばあ|キモい|きもい|ゴミ人間|人間のクズ|カス|詐欺師|枕営業|まくら営業|売春|援交|パパ活|パクリ野郎|整形モンスター|メンヘラビッチ|ヤリマン|犯罪者|気持ち悪いから消えろ|アンチ)/u,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(doxx|doxxed|real\s*address|home\s*address|leaked\s*address|social\s*security\s*number|private\s*phone)\b/i,
  /(中の人|なかのひと|前世バレ|顔バレ|本名晒し|本名は|住所特定|自宅住所|電話番号は|個人情報晒し)/u,
  /\b(porn|pornhub|xvideos|onlyfans|nsfw|hentai|blowjob|handjob|cumshot|gangbang|incest|loli|shota|deepfake\s*porn|nude\s*leaks)\b/i,
  /(無修正|アダルト動画|エロ動画|セフレ募集|裏垢女子|ハメ撮り|児童ポルノ|淫行|中出し|フェラ|オナニー)/u
];

export function sanitizeText(input: unknown, maxLength = 140): string {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E\u2060-\u206F]/g, '')
    .replace(/([\u0300-\u036F\u3099\u309A]{2})[\u0300-\u036F\u3099\u309A]+/g, '$1');

  for (const pattern of URL_AND_DOMAIN_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned
    .replace(/([!?.~！？。、])\1{3,}/g, '$1$1$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function isSafeAndNotSpam(
  kamioshiName: string,
  message: string,
  authorName: string,
  location: string
): { ok: boolean; error?: string } {
  const checkSpam = (txt: string): boolean => {
    if (!txt) return false;
    for (const p of SPAM_PATTERNS) {
      if (p.test(txt)) return true;
    }
    if (/(.)\1{5,}/u.test(txt)) return true;
    if (/(.{2,3})\1{3,}/i.test(txt)) return true;
    return false;
  };

  if (checkSpam(kamioshiName) || checkSpam(message)) {
    return { ok: false, error: 'Spam or repetitive pattern detected.' };
  }

  const combined = normalizeText(`${kamioshiName} | ${message} | ${authorName} | ${location}`);
  const collapsed = combined.replace(/[\s._\-*+|~`'"^]+/g, '');

  for (const pattern of MODERATION_PATTERNS) {
    if (pattern.test(combined) || pattern.test(collapsed)) {
      return { ok: false, error: 'Content did not pass Shrine Guardian safety check.' };
    }
  }

  return { ok: true };
}

export function mapRowToPlaque(row: DbPlaqueRow, callerTokenHash?: string | null) {
  return {
    id: row.id,
    coordinate: Number(row.coordinate),
    kamioshiName: row.kamioshi_name,
    category: row.category,
    message: row.message,
    authorName: row.author_name,
    location: row.location,
    countryCode: row.country_code,
    woodType: row.wood_type,
    cordColor: row.cord_color || 'crimson',
    stamp: row.stamp,
    bowCount: Number(row.bow_count),
    createdAt: row.created_at,
    language: row.language,
    isOwn: Boolean(callerTokenHash && row.author_token_hash && callerTokenHash === row.author_token_hash)
  };
}

export async function readShrineStats(db: D1Database) {
  const res = await db.prepare('SELECT stat_key, stat_value FROM shrine_stats').all<{
    stat_key: string;
    stat_value: number;
  }>();

  const map: Record<string, number> = {};
  for (const r of res.results || []) {
    map[r.stat_key] = Math.max(0, Number(r.stat_value) || 0);
  }

  const totalPlaques = map.total_plaques || 0;
  const categoryCounts: Record<string, number> = {
    all: totalPlaques,
    vtuber: map.cat_vtuber || 0,
    kpop: map.cat_kpop || 0,
    anime: map.cat_anime || 0,
    esports: map.cat_esports || 0,
    music: map.cat_music || 0,
    creator: map.cat_creator || 0,
    athlete: map.cat_athlete || 0,
    place: map.cat_place || 0,
    pet: map.cat_pet || 0,
    tech: map.cat_tech || 0,
    icon: map.cat_icon || 0,
    other: map.cat_other || 0
  };

  return {
    totalPlaques,
    totalBells: map.total_bells || 0,
    uniqueLocations: map.unique_locations || 0,
    maxCoordinate: map.max_coordinate || 0,
    categoryCounts
  };
}
