import {
  PagesContext,
  VALID_CATEGORIES,
  jsonResponse,
  nextLexicographicalPrefix,
  normalizeTagKey
} from '../_shared/shrineDb';

interface DbTagRow {
  tag_norm: string;
  display_name: string;
  category: string;
  plaque_count: number;
  bow_total: number;
  updated_at: string;
}

export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  try {
    const db = ctx.env.DB;
    const url = new URL(ctx.request.url);
    const rawQuery = (url.searchParams.get('q') || '').trim();
    const category = (url.searchParams.get('category') || 'all').toLowerCase();
    const rawLimit = parseInt(url.searchParams.get('limit') || '16', 10);
    const limit = Math.max(1, Math.min(50, isNaN(rawLimit) ? 16 : rawLimit));

    const hasCat = category !== 'all' && VALID_CATEGORIES.has(category);
    let rows: DbTagRow[] = [];

    if (rawQuery) {
      const prefix = normalizeTagKey(rawQuery);
      const upper = nextLexicographicalPrefix(prefix);
      if (hasCat) {
        const res = await db
          .prepare(
            `SELECT * FROM shrine_tags
             WHERE tag_norm >= ?1 AND tag_norm < ?2
               AND category = ?3 AND plaque_count > 0
             ORDER BY plaque_count DESC, bow_total DESC
             LIMIT ?4`
          )
          .bind(prefix, upper, category, limit)
          .all<DbTagRow>();
        rows = res.results || [];
      } else {
        const res = await db
          .prepare(
            `SELECT * FROM shrine_tags
             WHERE tag_norm >= ?1 AND tag_norm < ?2
               AND plaque_count > 0
             ORDER BY plaque_count DESC, bow_total DESC
             LIMIT ?3`
          )
          .bind(prefix, upper, limit)
          .all<DbTagRow>();
        rows = res.results || [];
      }
    } else {
      if (hasCat) {
        const res = await db
          .prepare(
            `SELECT * FROM shrine_tags
             WHERE category = ?1 AND plaque_count > 0
             ORDER BY plaque_count DESC, bow_total DESC
             LIMIT ?2`
          )
          .bind(category, limit)
          .all<DbTagRow>();
        rows = res.results || [];
      } else {
        const res = await db
          .prepare(
            `SELECT * FROM shrine_tags
             WHERE plaque_count > 0
             ORDER BY plaque_count DESC, bow_total DESC
             LIMIT ?1`
          )
          .bind(limit)
          .all<DbTagRow>();
        rows = res.results || [];
      }
    }

    return jsonResponse({
      tags: rows.map((r) => ({
        tagNorm: r.tag_norm,
        displayName: r.display_name,
        category: r.category,
        plaqueCount: Number(r.plaque_count),
        bowTotal: Number(r.bow_total)
      }))
    });
  } catch (err) {
    return jsonResponse({ error: 'Failed to load tags.', details: String(err) }, 500);
  }
};
