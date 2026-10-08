import { bearer, body, environment, respond } from '../lib/http.js';
import { appEvent } from '../lib/events.js';
import { database } from '../lib/db.js';

export default async function appEvents(req, res) {
  if (req.method !== 'POST') return respond(res, 405, { error: 'method' });
  // Trusted backend only; website identifiers cannot authorize app records.
  if (!bearer(req, process.env.APP_INGEST_SECRET)) return respond(res, 401, { error: 'unauthorized' });
  if (process.env.ANALYTICS_ENABLED !== 'true') return respond(res, 503, { error: 'disabled' });
  let event;
  try { event = appEvent(await body(req)); } catch { return respond(res, 400, { error: 'invalid_event' }); }
  try {
    const sql = database('app');
    const rows = await sql`INSERT INTO analytics.app_events(id,environment,user_id,machine_id,license_id,activity_type,details,created_at)
      VALUES(${event.id}::uuid,${environment()},${event.user_id}::uuid,${event.machine_id}::uuid,${event.license_id}::uuid,${event.activity_type},${JSON.stringify(event.details)}::jsonb,${event.created_at}::timestamptz)
      ON CONFLICT(environment,id) DO NOTHING RETURNING id`;
    return respond(res, 202, { id: event.id, status: rows.length ? 'accepted' : 'duplicate' });
  } catch { return respond(res, 503, { error: 'unavailable' }); }
}
