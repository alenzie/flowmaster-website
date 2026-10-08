import { bearer, body, environment, respond, uuid } from '../lib/http.js';
import { database } from '../lib/db.js';

export default async function appHistory(req, res) {
  if (req.method !== 'POST') return respond(res, 405, { error: 'method' });
  if (!bearer(req, process.env.APP_REPORT_SECRET)) return respond(res, 401, { error: 'unauthorized' });
  let input;
  try {
    input = await body(req, 2048);
    if (input.user_id && !uuid(input.user_id)) throw new Error();
    if (input.activity_type && !/^[a-zA-Z0-9_.:-]{1,100}$/.test(input.activity_type)) throw new Error();
    if (input.search && (typeof input.search !== 'string' || input.search.length > 100)) throw new Error();
    for (const k of ['date_from','date_to']) if (input[k] && !Number.isFinite(new Date(input[k]).getTime())) throw new Error();
  } catch { return respond(res, 400, { error: 'invalid_query' }); }
  const limit = Math.min(5000, Math.max(1, Number(input.limit) || 100));
  const offset = Math.min(100000, Math.max(0, Number(input.offset) || 0));
  const order = input.sort_order === 'asc' ? 'ASC' : 'DESC';
  const values = [environment(), input.user_id || null, input.activity_type || null, input.date_from || null, input.date_to || null, input.search || null];
  const where = `environment=$1 AND ($2::uuid IS NULL OR user_id=$2::uuid) AND ($3::text IS NULL OR activity_type=$3)
    AND ($4::timestamptz IS NULL OR created_at >= $4::timestamptz) AND ($5::timestamptz IS NULL OR created_at <= $5::timestamptz)
    AND ($6::text IS NULL OR machine_id::text ILIKE '%' || $6 || '%')`;
  try {
    const sql = database('reader');
    const [rows, total] = await sql.transaction([
      sql.query(`SELECT id::text,'user' AS source,user_id::text AS actor_id,'user' AS actor_type,NULL::text AS actor_username,
        activity_type,details,NULL::text AS related_entity_type,NULL::text AS related_entity_id,NULL::text AS ip_address,
        license_id::text,machine_id::text,created_at FROM analytics.app_events WHERE ${where} ORDER BY created_at ${order},id ${order} LIMIT $7 OFFSET $8`, [...values, Math.floor(limit), Math.floor(offset)]),
      sql.query(`SELECT count(*)::integer AS total FROM analytics.app_events WHERE ${where}`, values)
    ], { isolationLevel: 'RepeatableRead', readOnly: true });
    return respond(res, 200, { entries: rows, total_count: total[0].total });
  } catch { return respond(res, 503, { error: 'unavailable' }); }
}
