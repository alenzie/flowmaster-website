import { bearer, respond } from '../lib/http.js';
import { database } from '../lib/db.js';
export default async function retention(req, res) {
  if (req.method !== 'GET') return respond(res, 405, { error: 'method' });
  if (!bearer(req, process.env.CRON_SECRET)) return respond(res, 401, { error: 'unauthorized' });
  try { const sql = database('maintenance'); await sql`SELECT analytics.retain_web()`; return respond(res, 200, { status: 'complete' }); }
  catch { return respond(res, 503, { error: 'unavailable' }); }
}
