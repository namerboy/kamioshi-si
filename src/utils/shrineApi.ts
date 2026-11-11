import { EmaPlaque, ReportReason, ShrineStats, ShrineTag } from '../types';
import { sanitizeStoredPlaques } from './antiSpam';
import { filterSafePlaques } from './aiGuardian';

const PILGRIM_TOKEN_KEY = 'kamioshi_pilgrim_token_v1';
const OWN_IDS_KEY = 'kamioshi_own_ids_v1';
const LOCAL_CACHE_KEY = 'kamioshi_fresh_v5';

export const PAGE_SIZE = 24;

export function getOrCreatePilgrimToken(): string {
  try {
    const existing = localStorage.getItem(PILGRIM_TOKEN_KEY);
    if (existing && existing.length >= 16) return existing;
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(PILGRIM_TOKEN_KEY, token);
    return token;
  } catch {
    return 'ephemeral_pilgrim_token';
  }
}

export function getOwnPlaqueIds(): Set<string> {
  try {
    const raw = localStorage.getItem(OWN_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((x): x is string => typeof x === 'string'));
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

export function recordOwnPlaqueId(id: string): void {
  try {
    const ids = getOwnPlaqueIds();
    ids.add(id);
    localStorage.setItem(OWN_IDS_KEY, JSON.stringify(Array.from(ids).slice(-500)));
  } catch {
    // ignore
  }
}

export function computeLocalStats(plaques: EmaPlaque[]): ShrineStats {
  const categoryCounts: Record<string, number> = { all: plaques.length };
  const locations = new Set<string>();
  let totalBells = 0;
  let maxCoordinate = 0;

  for (let i = 0; i < plaques.length; i++) {
    const p = plaques[i];
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    if (p.location) {
      const loc = p.location.trim().toLowerCase();
      if (loc) locations.add(loc);
    }
    totalBells += p.bowCount || 0;
    if (p.coordinate > maxCoordinate) {
      maxCoordinate = p.coordinate;
    }
  }

  return {
    totalPlaques: plaques.length,
    totalBells,
    uniqueLocations: locations.size,
    maxCoordinate,
    categoryCounts
  };
}

export function computeLocalPopularTags(plaques: EmaPlaque[]): ShrineTag[] {
  const map = new Map<string, ShrineTag>();
  for (let i = 0; i < plaques.length; i++) {
    const p = plaques[i];
    const key = p.kamioshiName.trim().toLowerCase();
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.plaqueCount += 1;
      existing.bowTotal += p.bowCount || 1;
    } else {
      map.set(key, {
        tagNorm: key,
        displayName: p.kamioshiName,
        category: p.category,
        plaqueCount: 1,
        bowTotal: p.bowCount || 1
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.plaqueCount - a.plaqueCount || b.bowTotal - a.bowTotal)
    .slice(0, 12);
}

function readLocalCachePlaques(): EmaPlaque[] {
  try {
    const saved = localStorage.getItem(LOCAL_CACHE_KEY);
    if (saved) {
      const sanitized = sanitizeStoredPlaques(JSON.parse(saved));
      if (sanitized) {
        const ownIds = getOwnPlaqueIds();
        return sanitized.map((p) => ({
          ...p,
          isOwn: p.isOwn || ownIds.has(p.id)
        }));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function writeLocalCachePlaques(plaques: EmaPlaque[]): void {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(plaques.slice(0, 120)));
  } catch {
    // ignore quota errors
  }
}

export interface FetchPageParams {
  category: string;
  sort: 'newest' | 'oldest' | 'bows';
  q: string;
  cursor?: string | null;
  limit?: number;
}

export interface FetchPageResult {
  plaques: EmaPlaque[];
  nextCursor: string | null;
  hasMore: boolean;
  stats?: ShrineStats;
  topRevered?: EmaPlaque[];
  popularTags?: ShrineTag[];
  source: 'd1' | 'local';
}

export async function fetchShrinePage(params: FetchPageParams): Promise<FetchPageResult> {
  const token = getOrCreatePilgrimToken();
  const ownIds = getOwnPlaqueIds();
  const limit = params.limit || PAGE_SIZE;

  const qs = new URLSearchParams();
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.sort) qs.set('sort', params.sort);
  if (params.q.trim()) qs.set('q', params.q.trim());
  if (params.cursor) qs.set('cursor', params.cursor);
  qs.set('limit', String(limit));

  try {
    const res = await fetch(`/api/plaques?${qs.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Pilgrim-Token': token
      }
    });

    if (res.ok) {
      const data = await res.json();
      const rawPlaques: EmaPlaque[] = Array.isArray(data.plaques) ? data.plaques : [];
      const enriched = filterSafePlaques(
        rawPlaques.map((p) => ({
          ...p,
          isOwn: Boolean(p.isOwn || ownIds.has(p.id))
        }))
      );

      // Update local cache on unfiltered page 1 for instant offline resilience
      if (!params.cursor && (!params.category || params.category === 'all') && !params.q.trim()) {
        writeLocalCachePlaques(enriched);
      }

      return {
        plaques: enriched,
        nextCursor: data.nextCursor || null,
        hasMore: Boolean(data.hasMore),
        stats: data.stats,
        topRevered: Array.isArray(data.topRevered) ? filterSafePlaques(data.topRevered) : undefined,
        popularTags: Array.isArray(data.popularTags) ? data.popularTags : undefined,
        source: 'd1'
      };
    }
  } catch {
    // Fallback to local cache when offline or running isolated dev server
  }

  const allLocal = filterSafePlaques(readLocalCachePlaques());
  const stats = computeLocalStats(allLocal);
  const topRevered = [...allLocal].sort((a, b) => b.bowCount - a.bowCount).slice(0, 3);
  const popularTags = computeLocalPopularTags(allLocal);

  const filtered = allLocal
    .filter((p) => {
      if (params.category !== 'all' && p.category !== params.category) return false;
      if (params.q.trim()) {
        const q = params.q.toLowerCase().trim();
        return (
          p.kamioshiName.toLowerCase().includes(q) ||
          p.message.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          String(p.coordinate) === q.replace('#', '')
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (params.sort === 'bows') return b.bowCount - a.bowCount || b.coordinate - a.coordinate;
      if (params.sort === 'oldest') return a.coordinate - b.coordinate;
      return b.coordinate - a.coordinate;
    });

  const offset = params.cursor ? parseInt(params.cursor, 10) || 0 : 0;
  const slice = filtered.slice(offset, offset + limit);
  const hasMore = offset + limit < filtered.length;

  return {
    plaques: slice,
    nextCursor: hasMore ? String(offset + limit) : null,
    hasMore,
    stats,
    topRevered,
    popularTags,
    source: 'local'
  };
}

export async function fetchPlaqueByCoordinate(coord: number): Promise<EmaPlaque | null> {
  const token = getOrCreatePilgrimToken();
  const ownIds = getOwnPlaqueIds();
  try {
    const res = await fetch(`/api/plaques?coord=${encodeURIComponent(String(coord))}`, {
      headers: {
        Accept: 'application/json',
        'X-Pilgrim-Token': token
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.plaque) {
        const safe = filterSafePlaques([
          {
            ...data.plaque,
            isOwn: Boolean(data.plaque.isOwn || ownIds.has(data.plaque.id))
          }
        ]);
        return safe[0] || null;
      }
    }
  } catch {
    // ignore network failure
  }
  const local = readLocalCachePlaques().find((p) => p.coordinate === coord);
  return local || null;
}

export async function createShrinePlaque(
  newPlaqueData: Omit<EmaPlaque, 'id' | 'coordinate' | 'createdAt' | 'bowCount'>
): Promise<{ plaque: EmaPlaque; stats?: ShrineStats }> {
  const token = getOrCreatePilgrimToken();

  try {
    const res = await fetch('/api/plaques', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pilgrim-Token': token
      },
      body: JSON.stringify({
        ...newPlaqueData,
        clientToken: token
      })
    });

    if (res.ok) {
      const data = await res.json();
      const created: EmaPlaque = {
        ...data.plaque,
        isOwn: true
      };
      recordOwnPlaqueId(created.id);
      const currentLocal = readLocalCachePlaques();
      writeLocalCachePlaques([created, ...currentLocal.filter((p) => p.id !== created.id)]);
      return {
        plaque: created,
        stats: data.stats
      };
    }
  } catch {
    // fallback below
  }

  // Offline / local fallback
  const currentLocal = readLocalCachePlaques();
  let maxCoord = 0;
  for (let i = 0; i < currentLocal.length; i++) {
    if (currentLocal[i].coordinate > maxCoord) maxCoord = currentLocal[i].coordinate;
  }

  const fallbackPlaque: EmaPlaque = {
    ...newPlaqueData,
    id: `ema_${Date.now()}`,
    coordinate: maxCoord + 1,
    bowCount: 1,
    createdAt: new Date().toISOString(),
    isOwn: true
  };
  recordOwnPlaqueId(fallbackPlaque.id);
  const updated = [fallbackPlaque, ...currentLocal];
  writeLocalCachePlaques(updated);

  return {
    plaque: fallbackPlaque,
    stats: computeLocalStats(updated)
  };
}

export async function ringShrinePlaqueBell(id: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/plaques/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bow' })
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.bowCount === 'number' ? data.bowCount : null;
    }
  } catch {
    // ignore offline error
  }
  return null;
}

export async function deleteOwnShrinePlaque(id: string): Promise<{ ok: boolean; stats?: ShrineStats }> {
  const token = getOrCreatePilgrimToken();
  const currentLocal = readLocalCachePlaques().filter((p) => p.id !== id);
  writeLocalCachePlaques(currentLocal);

  try {
    const res = await fetch(`/api/plaques/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Pilgrim-Token': token
      },
      body: JSON.stringify({ action: 'delete', clientToken: token })
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, stats: data.stats };
    }
  } catch {
    // ignore offline error
  }
  return { ok: true, stats: computeLocalStats(currentLocal) };
}

export async function reportShrinePlaqueApi(id: string, reason: ReportReason): Promise<void> {
  try {
    await fetch(`/api/plaques/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'report', reason })
    });
  } catch {
    // ignore offline error
  }
}

export async function searchShrineTags(q: string, category = 'all'): Promise<ShrineTag[]> {
  try {
    const qs = new URLSearchParams();
    if (q.trim()) qs.set('q', q.trim());
    if (category && category !== 'all') qs.set('category', category);
    qs.set('limit', '12');

    const res = await fetch(`/api/tags?${qs.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tags)) return data.tags;
    }
  } catch {
    // fallback
  }
  return [];
}
