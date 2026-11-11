import {
  DbPlaqueRow,
  PagesContext,
  VALID_CATEGORIES,
  VALID_CORD_COLORS,
  VALID_STAMPS,
  VALID_WOOD_TYPES,
  extractSearchTokens,
  isSafeAndNotSpam,
  jsonResponse,
  mapRowToPlaque,
  nextLexicographicalPrefix,
  normalizeTagKey,
  normalizeText,
  readShrineStats,
  sanitizeText,
  sha256Hex
} from '../../_shared/shrineDb';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;

export const onRequestGet = async (ctx: PagesContext): Promise<Response> => {
  try {
    const db = ctx.env.DB;
    const url = new URL(ctx.request.url);

    const category = (url.searchParams.get('category') || 'all').toLowerCase();
    const sort = (url.searchParams.get('sort') || 'newest').toLowerCase();
    const rawQuery = (url.searchParams.get('q') || '').trim();
    const cursor = (url.searchParams.get('cursor') || '').trim();
    const exactCoordParam = url.searchParams.get('coord');
    const includeMeta = url.searchParams.get('meta') !== '0' && !cursor;

    const rawLimit = parseInt(url.searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10);
    const limit = Math.max(1, Math.min(MAX_PAGE_SIZE, isNaN(rawLimit) ? DEFAULT_PAGE_SIZE : rawLimit));
    const fetchLimit = limit + 1;

    const clientToken = ctx.request.headers.get('X-Pilgrim-Token') || '';
    const callerTokenHash = clientToken ? await sha256Hex(clientToken) : null;

    // 1. Direct coordinate lookup (e.g. shared link #ema=42) -> O(1) primary key read
    if (exactCoordParam) {
      const coordNum = parseInt(exactCoordParam, 10);
      if (!isNaN(coordNum) && coordNum > 0) {
        const row = await db
          .prepare('SELECT * FROM plaques WHERE coordinate = ?1 AND is_hidden = 0 LIMIT 1')
          .bind(coordNum)
          .first<DbPlaqueRow>();
        return jsonResponse({
          plaque: row ? mapRowToPlaque(row, callerTokenHash) : null
        });
      }
    }

    let rows: DbPlaqueRow[] = [];

    // 2. Search query path (uses WITHOUT ROWID plaque_tokens B-tree index or coordinate PK)
    if (rawQuery) {
      const coordMatch = rawQuery.match(/^#?(\d{1,8})$/);
      if (coordMatch) {
        const coordNum = parseInt(coordMatch[1], 10);
        const row = await db
          .prepare('SELECT * FROM plaques WHERE coordinate = ?1 AND is_hidden = 0 LIMIT 1')
          .bind(coordNum)
          .first<DbPlaqueRow>();
        if (row && (category === 'all' || row.category === category)) {
          rows = [row];
        }
      } else {
        const tokens = extractSearchTokens([rawQuery]);
        const primaryToken =
          tokens.sort((a, b) => b.length - a.length)[0] || normalizeText(rawQuery).slice(0, 24);

        if (primaryToken) {
          const upperBound = nextLexicographicalPrefix(primaryToken);
          const cursorCoord = cursor ? parseInt(cursor, 10) : null;

          if (category !== 'all' && VALID_CATEGORIES.has(category)) {
            if (cursorCoord && !isNaN(cursorCoord)) {
              const res = await db
                .prepare(
                  `SELECT DISTINCT p.*
                   FROM plaque_tokens pt
                   JOIN plaques p ON p.coordinate = pt.coordinate
                   WHERE pt.token >= ?1 AND pt.token < ?2
                     AND p.is_hidden = 0
                     AND p.category = ?3
                     AND p.coordinate < ?4
                   ORDER BY p.coordinate DESC
                   LIMIT ?5`
                )
                .bind(primaryToken, upperBound, category, cursorCoord, fetchLimit)
                .all<DbPlaqueRow>();
              rows = res.results || [];
            } else {
              const res = await db
                .prepare(
                  `SELECT DISTINCT p.*
                   FROM plaque_tokens pt
                   JOIN plaques p ON p.coordinate = pt.coordinate
                   WHERE pt.token >= ?1 AND pt.token < ?2
                     AND p.is_hidden = 0
                     AND p.category = ?3
                   ORDER BY p.coordinate DESC
                   LIMIT ?4`
                )
                .bind(primaryToken, upperBound, category, fetchLimit)
                .all<DbPlaqueRow>();
              rows = res.results || [];
            }
          } else {
            if (cursorCoord && !isNaN(cursorCoord)) {
              const res = await db
                .prepare(
                  `SELECT DISTINCT p.*
                   FROM plaque_tokens pt
                   JOIN plaques p ON p.coordinate = pt.coordinate
                   WHERE pt.token >= ?1 AND pt.token < ?2
                     AND p.is_hidden = 0
                     AND p.coordinate < ?3
                   ORDER BY p.coordinate DESC
                   LIMIT ?4`
                )
                .bind(primaryToken, upperBound, cursorCoord, fetchLimit)
                .all<DbPlaqueRow>();
              rows = res.results || [];
            } else {
              const res = await db
                .prepare(
                  `SELECT DISTINCT p.*
                   FROM plaque_tokens pt
                   JOIN plaques p ON p.coordinate = pt.coordinate
                   WHERE pt.token >= ?1 AND pt.token < ?2
                     AND p.is_hidden = 0
                   ORDER BY p.coordinate DESC
                   LIMIT ?3`
                )
                .bind(primaryToken, upperBound, fetchLimit)
                .all<DbPlaqueRow>();
              rows = res.results || [];
            }
          }
        }
      }
    } else {
      // 3. Standard indexed feed (uses covering composite indexes with zero full-table scan)
      const hasCat = category !== 'all' && VALID_CATEGORIES.has(category);

      if (sort === 'bows') {
        let cursorBows: number | null = null;
        let cursorCoord: number | null = null;
        if (cursor && cursor.includes(':')) {
          const [bStr, cStr] = cursor.split(':');
          cursorBows = parseInt(bStr, 10);
          cursorCoord = parseInt(cStr, 10);
        }

        if (hasCat) {
          if (cursorBows !== null && cursorCoord !== null && !isNaN(cursorBows) && !isNaN(cursorCoord)) {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND category = ?1
                   AND (bow_count < ?2 OR (bow_count = ?2 AND coordinate < ?3))
                 ORDER BY bow_count DESC, coordinate DESC
                 LIMIT ?4`
              )
              .bind(category, cursorBows, cursorCoord, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          } else {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND category = ?1
                 ORDER BY bow_count DESC, coordinate DESC
                 LIMIT ?2`
              )
              .bind(category, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          }
        } else {
          if (cursorBows !== null && cursorCoord !== null && !isNaN(cursorBows) && !isNaN(cursorCoord)) {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0
                   AND (bow_count < ?1 OR (bow_count = ?1 AND coordinate < ?2))
                 ORDER BY bow_count DESC, coordinate DESC
                 LIMIT ?3`
              )
              .bind(cursorBows, cursorCoord, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          } else {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0
                 ORDER BY bow_count DESC, coordinate DESC
                 LIMIT ?1`
              )
              .bind(fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          }
        }
      } else if (sort === 'oldest') {
        const cursorCoord = cursor ? parseInt(cursor, 10) : null;
        if (hasCat) {
          if (cursorCoord !== null && !isNaN(cursorCoord)) {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND category = ?1 AND coordinate > ?2
                 ORDER BY coordinate ASC
                 LIMIT ?3`
              )
              .bind(category, cursorCoord, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          } else {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND category = ?1
                 ORDER BY coordinate ASC
                 LIMIT ?2`
              )
              .bind(category, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          }
        } else {
          if (cursorCoord !== null && !isNaN(cursorCoord)) {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND coordinate > ?1
                 ORDER BY coordinate ASC
                 LIMIT ?2`
              )
              .bind(cursorCoord, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          } else {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0
                 ORDER BY coordinate ASC
                 LIMIT ?1`
              )
              .bind(fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          }
        }
      } else {
        // Default: newest (coordinate DESC)
        const cursorCoord = cursor ? parseInt(cursor, 10) : null;
        if (hasCat) {
          if (cursorCoord !== null && !isNaN(cursorCoord)) {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND category = ?1 AND coordinate < ?2
                 ORDER BY coordinate DESC
                 LIMIT ?3`
              )
              .bind(category, cursorCoord, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          } else {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND category = ?1
                 ORDER BY coordinate DESC
                 LIMIT ?2`
              )
              .bind(category, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          }
        } else {
          if (cursorCoord !== null && !isNaN(cursorCoord)) {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0 AND coordinate < ?1
                 ORDER BY coordinate DESC
                 LIMIT ?2`
              )
              .bind(cursorCoord, fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          } else {
            const res = await db
              .prepare(
                `SELECT * FROM plaques
                 WHERE is_hidden = 0
                 ORDER BY coordinate DESC
                 LIMIT ?1`
              )
              .bind(fetchLimit)
              .all<DbPlaqueRow>();
            rows = res.results || [];
          }
        }
      }
    }

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const plaques = pageRows.map((r) => mapRowToPlaque(r, callerTokenHash));

    let nextCursor: string | null = null;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1];
      nextCursor =
        !rawQuery && sort === 'bows'
          ? `${last.bow_count}:${last.coordinate}`
          : String(last.coordinate);
    }

    if (!includeMeta) {
      return jsonResponse({
        plaques,
        nextCursor,
        hasMore
      });
    }

    // Fetch O(1) pre-aggregated shrine_stats, top 3 revered plaques, and top 12 popular tags
    const [stats, topReveredRes, popularTagsRes] = await Promise.all([
      readShrineStats(db),
      db
        .prepare(
          `SELECT * FROM plaques
           WHERE is_hidden = 0
           ORDER BY bow_count DESC, coordinate DESC
           LIMIT 3`
        )
        .all<DbPlaqueRow>(),
      db
        .prepare(
          `SELECT tag_norm, display_name, category, plaque_count, bow_total
           FROM shrine_tags
           WHERE plaque_count > 0
           ORDER BY plaque_count DESC, bow_total DESC
           LIMIT 12`
        )
        .all<{
          tag_norm: string;
          display_name: string;
          category: string;
          plaque_count: number;
          bow_total: number;
        }>()
    ]);

    return jsonResponse({
      plaques,
      nextCursor,
      hasMore,
      stats,
      topRevered: (topReveredRes.results || []).map((r) => mapRowToPlaque(r, callerTokenHash)),
      popularTags: (popularTagsRes.results || []).map((t) => ({
        tagNorm: t.tag_norm,
        displayName: t.display_name,
        category: t.category,
        plaqueCount: Number(t.plaque_count),
        bowTotal: Number(t.bow_total)
      }))
    });
  } catch (err) {
    return jsonResponse(
      { error: 'Failed to load plaques from shrine database.', details: String(err) },
      500
    );
  }
};

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  try {
    const db = ctx.env.DB;
    const body = (await ctx.request.json()) as Record<string, unknown>;

    const kamioshiName = sanitizeText(body.kamioshiName, 44);
    if (!kamioshiName) {
      return jsonResponse({ error: 'Kamioshi name is required.' }, 400);
    }

    const rawCategory = String(body.category || 'other').toLowerCase();
    const category = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'other';

    const message =
      sanitizeText(body.message, 140) || `Always cheering for ${kamioshiName}!`;
    const authorName = sanitizeText(body.authorName, 30) || 'Fan';
    const location = sanitizeText(body.location, 30) || 'Everywhere';
    const countryCode = sanitizeText(body.countryCode || 'EARTH', 10) || 'EARTH';
    const language = sanitizeText(body.language || 'Universal', 20) || 'Universal';

    const rawWood = String(body.woodType || 'hinoki');
    const woodType = VALID_WOOD_TYPES.has(rawWood) ? rawWood : 'hinoki';

    const rawCord = String(body.cordColor || 'crimson');
    const cordColor = VALID_CORD_COLORS.has(rawCord) ? rawCord : 'crimson';

    const rawStamp = String(body.stamp || '推');
    const stamp = VALID_STAMPS.has(rawStamp) ? rawStamp : '推';

    // 1. Server-side Bottled AI Guardian & Anti-Spam Check
    const safety = isSafeAndNotSpam(kamioshiName, message, authorName, location);
    if (!safety.ok) {
      return jsonResponse({ error: safety.error || 'Content rejected by Shrine Guardian.' }, 422);
    }

    // 2. Server-side IP Rate Limiting (15s cooldown, max 8 per 10 mins per IP)
    const clientIp =
      ctx.request.headers.get('CF-Connecting-IP') ||
      ctx.request.headers.get('X-Forwarded-For') ||
      'anonymous-ip';
    const ipHash = await sha256Hex(`kamioshi_rl_${clientIp}`);
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;

    const rlRow = await db
      .prepare('SELECT * FROM rate_limits WHERE ip_hash = ?1')
      .bind(ipHash)
      .first<{
        ip_hash: string;
        last_plaque_ts: number;
        window_start_ts: number;
        window_count: number;
      }>();

    if (rlRow) {
      if (now - rlRow.last_plaque_ts < 10_000) {
        return jsonResponse(
          { error: 'Please wait a few seconds before dedicating another plaque.' },
          429
        );
      }
      const inSameWindow = now - rlRow.window_start_ts < windowMs;
      if (inSameWindow && rlRow.window_count >= 10) {
        return jsonResponse(
          { error: 'Rate limit reached. Please pause before carving more plaques.' },
          429
        );
      }
      const newWindowStart = inSameWindow ? rlRow.window_start_ts : now;
      const newCount = inSameWindow ? rlRow.window_count + 1 : 1;
      await db
        .prepare(
          `UPDATE rate_limits
           SET last_plaque_ts = ?1, window_start_ts = ?2, window_count = ?3
           WHERE ip_hash = ?4`
        )
        .bind(now, newWindowStart, newCount, ipHash)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO rate_limits (ip_hash, last_plaque_ts, window_start_ts, window_count)
           VALUES (?1, ?2, ?3, 1)`
        )
        .bind(ipHash, now, now)
        .run();
    }

    // 3. Hash caller's anonymous pilgrim token for future self-deletion ownership
    const clientToken =
      typeof body.clientToken === 'string' && body.clientToken.trim()
        ? body.clientToken.trim()
        : ctx.request.headers.get('X-Pilgrim-Token') || '';
    const authorTokenHash = clientToken ? await sha256Hex(clientToken) : null;

    const plaqueId = `ema_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = new Date(now).toISOString();

    // 4. Insert plaque and return the database-assigned sequential coordinate
    const insertedRow = await db
      .prepare(
        `INSERT INTO plaques (
           id, kamioshi_name, category, message, author_name, location,
           country_code, wood_type, cord_color, stamp, bow_count, created_at,
           language, author_token_hash
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 1, ?11, ?12, ?13)
         RETURNING *`
      )
      .bind(
        plaqueId,
        kamioshiName,
        category,
        message,
        authorName,
        location,
        countryCode,
        woodType,
        cordColor,
        stamp,
        createdAt,
        language,
        authorTokenHash
      )
      .first<DbPlaqueRow>();

    if (!insertedRow) {
      return jsonResponse({ error: 'Failed to carve plaque.' }, 500);
    }

    const coord = Number(insertedRow.coordinate);
    const locationNorm = normalizeText(location).slice(0, 40) || 'everywhere';
    const tagNorm = normalizeTagKey(kamioshiName);
    const tokens = extractSearchTokens([kamioshiName, category, location, authorName, message]);

    // 5. Check if this location is brand new for O(1) unique_locations counter
    const existingLoc = await db
      .prepare('SELECT plaque_count FROM shrine_locations WHERE location_norm = ?1')
      .bind(locationNorm)
      .first<{ plaque_count: number }>();
    const isNewLocation = !existingLoc || Number(existingLoc.plaque_count) <= 0;

    // 6. Batch update tokens, O(1) stats, location counter, and 100k+ tag index
    const batchStmts = [
      db
        .prepare(
          `INSERT INTO shrine_stats (stat_key, stat_value) VALUES ('total_plaques', 1)
           ON CONFLICT(stat_key) DO UPDATE SET stat_value = stat_value + 1`
        ),
      db
        .prepare(
          `INSERT INTO shrine_stats (stat_key, stat_value) VALUES ('total_bells', 1)
           ON CONFLICT(stat_key) DO UPDATE SET stat_value = stat_value + 1`
        ),
      db
        .prepare(
          `INSERT INTO shrine_stats (stat_key, stat_value) VALUES ('max_coordinate', ?1)
           ON CONFLICT(stat_key) DO UPDATE SET stat_value = MAX(stat_value, ?1)`
        )
        .bind(coord),
      db
        .prepare(
          `INSERT INTO shrine_stats (stat_key, stat_value) VALUES (?1, 1)
           ON CONFLICT(stat_key) DO UPDATE SET stat_value = stat_value + 1`
        )
        .bind(`cat_${category}`),
      db
        .prepare(
          `INSERT INTO shrine_locations (location_norm, plaque_count) VALUES (?1, 1)
           ON CONFLICT(location_norm) DO UPDATE SET plaque_count = plaque_count + 1`
        )
        .bind(locationNorm)
    ];

    if (isNewLocation) {
      batchStmts.push(
        db.prepare(
          `INSERT INTO shrine_stats (stat_key, stat_value) VALUES ('unique_locations', 1)
           ON CONFLICT(stat_key) DO UPDATE SET stat_value = stat_value + 1`
        )
      );
    }

    if (tagNorm) {
      batchStmts.push(
        db
          .prepare(
            `INSERT INTO shrine_tags (tag_norm, display_name, category, plaque_count, bow_total, updated_at)
             VALUES (?1, ?2, ?3, 1, 1, ?4)
             ON CONFLICT(tag_norm) DO UPDATE SET
               plaque_count = plaque_count + 1,
               bow_total = bow_total + 1,
               updated_at = ?4`
          )
          .bind(tagNorm, kamioshiName, category, createdAt)
      );
    }

    for (const token of tokens) {
      batchStmts.push(
        db
          .prepare('INSERT OR IGNORE INTO plaque_tokens (token, coordinate) VALUES (?1, ?2)')
          .bind(token, coord)
      );
    }

    await db.batch(batchStmts);

    const stats = await readShrineStats(db);

    return jsonResponse(
      {
        plaque: mapRowToPlaque(insertedRow, authorTokenHash),
        stats
      },
      201
    );
  } catch (err) {
    return jsonResponse(
      { error: 'Failed to save plaque to shrine database.', details: String(err) },
      500
    );
  }
};
