import {
  DbPlaqueRow,
  PagesContext,
  jsonResponse,
  normalizeTagKey,
  normalizeText,
  readShrineStats,
  sha256Hex
} from '../../_shared/shrineDb';

async function decrementPlaqueAggregates(ctx: PagesContext, row: DbPlaqueRow) {
  const db = ctx.env.DB;
  const locationNorm = normalizeText(row.location).slice(0, 40) || 'everywhere';
  const tagNorm = normalizeTagKey(row.kamioshi_name);
  const bows = Math.max(0, Number(row.bow_count) || 1);

  const locRow = await db
    .prepare('SELECT plaque_count FROM shrine_locations WHERE location_norm = ?1')
    .bind(locationNorm)
    .first<{ plaque_count: number }>();

  const isLastInLocation = locRow && Number(locRow.plaque_count) <= 1;

  const stmts = [
    db.prepare(
      `UPDATE shrine_stats
       SET stat_value = MAX(0, stat_value - 1)
       WHERE stat_key = 'total_plaques'`
    ),
    db
      .prepare(
        `UPDATE shrine_stats
         SET stat_value = MAX(0, stat_value - ?1)
         WHERE stat_key = 'total_bells'`
      )
      .bind(bows),
    db
      .prepare(
        `UPDATE shrine_stats
         SET stat_value = MAX(0, stat_value - 1)
         WHERE stat_key = ?1`
      )
      .bind(`cat_${row.category}`),
    db
      .prepare(
        `UPDATE shrine_locations
         SET plaque_count = MAX(0, plaque_count - 1)
         WHERE location_norm = ?1`
      )
      .bind(locationNorm)
  ];

  if (isLastInLocation) {
    stmts.push(
      db.prepare(
        `UPDATE shrine_stats
         SET stat_value = MAX(0, stat_value - 1)
         WHERE stat_key = 'unique_locations'`
      )
    );
  }

  if (tagNorm) {
    stmts.push(
      db
        .prepare(
          `UPDATE shrine_tags
           SET plaque_count = MAX(0, plaque_count - 1),
               bow_total = MAX(0, bow_total - ?1)
           WHERE tag_norm = ?2`
        )
        .bind(bows, tagNorm)
    );
  }

  await db.batch(stmts);
}

export const onRequestPost = async (ctx: PagesContext<{ id: string }>): Promise<Response> => {
  try {
    const db = ctx.env.DB;
    const plaqueId = ctx.params.id;
    if (!plaqueId) {
      return jsonResponse({ error: 'Missing plaque ID.' }, 400);
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await ctx.request.json()) as Record<string, unknown>;
    } catch {
      // default empty body
    }

    const action = String(body.action || 'bow').toLowerCase();

    const row = await db
      .prepare('SELECT * FROM plaques WHERE id = ?1 LIMIT 1')
      .bind(plaqueId)
      .first<DbPlaqueRow>();

    if (!row || row.is_hidden === 1) {
      return jsonResponse({ error: 'Plaque not found.' }, 404);
    }

    // Action 1: Ring Bell (+1 bowCount)
    if (action === 'bow') {
      const tagNorm = normalizeTagKey(row.kamioshi_name);
      const stmts = [
        db
          .prepare('UPDATE plaques SET bow_count = bow_count + 1 WHERE id = ?1')
          .bind(plaqueId),
        db.prepare(
          `UPDATE shrine_stats
           SET stat_value = stat_value + 1
           WHERE stat_key = 'total_bells'`
        )
      ];

      if (tagNorm) {
        stmts.push(
          db
            .prepare(
              `UPDATE shrine_tags
               SET bow_total = bow_total + 1
               WHERE tag_norm = ?1`
            )
            .bind(tagNorm)
        );
      }

      await db.batch(stmts);

      return jsonResponse({
        ok: true,
        bowCount: Number(row.bow_count) + 1
      });
    }

    // Action 2: Report plaque (auto-quarantines at 3 community reports)
    if (action === 'report') {
      const reason = String(body.reason || 'hide_only');
      if (reason === 'hide_only') {
        return jsonResponse({ ok: true, quarantined: false });
      }

      const newReportCount = Number(row.report_count || 0) + 1;
      const shouldHide = newReportCount >= 3 ? 1 : 0;

      await db
        .prepare(
          `UPDATE plaques
           SET report_count = ?1, is_hidden = ?2
           WHERE id = ?3`
        )
        .bind(newReportCount, shouldHide, plaqueId)
        .run();

      if (shouldHide === 1 && row.is_hidden === 0) {
        await decrementPlaqueAggregates(ctx, row);
      }

      return jsonResponse({
        ok: true,
        quarantined: shouldHide === 1
      });
    }

    // Action 3: Delete own plaque
    if (action === 'delete') {
      return handleDelete(ctx, row, body);
    }

    return jsonResponse({ error: 'Unsupported action.' }, 400);
  } catch (err) {
    return jsonResponse({ error: 'Failed to process plaque action.', details: String(err) }, 500);
  }
};

export const onRequestDelete = async (ctx: PagesContext<{ id: string }>): Promise<Response> => {
  try {
    const db = ctx.env.DB;
    const plaqueId = ctx.params.id;
    if (!plaqueId) {
      return jsonResponse({ error: 'Missing plaque ID.' }, 400);
    }

    const row = await db
      .prepare('SELECT * FROM plaques WHERE id = ?1 LIMIT 1')
      .bind(plaqueId)
      .first<DbPlaqueRow>();

    if (!row) {
      return jsonResponse({ error: 'Plaque not found.' }, 404);
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await ctx.request.json()) as Record<string, unknown>;
    } catch {
      // ignore empty body
    }

    return handleDelete(ctx, row, body);
  } catch (err) {
    return jsonResponse({ error: 'Failed to delete plaque.', details: String(err) }, 500);
  }
};

async function handleDelete(
  ctx: PagesContext<{ id: string }>,
  row: DbPlaqueRow,
  body: Record<string, unknown>
): Promise<Response> {
  const db = ctx.env.DB;
  const clientToken =
    typeof body.clientToken === 'string' && body.clientToken.trim()
      ? body.clientToken.trim()
      : ctx.request.headers.get('X-Pilgrim-Token') || '';

  if (!clientToken || !row.author_token_hash) {
    return jsonResponse({ error: 'Unauthorized: missing pilgrim token.' }, 403);
  }

  const callerHash = await sha256Hex(clientToken);
  if (callerHash !== row.author_token_hash) {
    return jsonResponse({ error: 'Unauthorized: you can only remove plaques you carved.' }, 403);
  }

  await db.batch([
    db.prepare('DELETE FROM plaque_tokens WHERE coordinate = ?1').bind(row.coordinate),
    db.prepare('DELETE FROM plaques WHERE coordinate = ?1').bind(row.coordinate)
  ]);

  if (row.is_hidden === 0) {
    await decrementPlaqueAggregates(ctx, row);
  }

  const stats = await readShrineStats(db);
  return jsonResponse({ ok: true, stats });
}
