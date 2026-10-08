import { createHmac } from 'node:crypto';
import { body, environment, respond } from '../lib/http.js';
import { sites, webEvent } from '../lib/events.js';
import { database } from '../lib/db.js';

export default async function events(req, res) {
  const origin = req.headers.origin;
  let config;
  try { config = sites(); } catch { return respond(res, 503, { error: 'unavailable' }); }
  if (!origin || !Object.values(config).some(site => site.origins?.includes(origin))) return respond(res, 403, { error: 'origin' });
  const headers = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (req.method === 'OPTIONS') return respond(res, 204, undefined, headers);
  if (req.method !== 'POST') return respond(res, 405, { error: 'method' }, headers);
  if (req.headers['sec-gpc'] === '1' || req.headers.dnt === '1' || /bot|crawler|spider|headless/i.test(req.headers['user-agent'] || '')) return respond(res, 204, undefined, headers);
  let event;
  try { event = webEvent(await body(req, 2048), origin, config); }
  catch { return respond(res, 400, { error: 'invalid_event' }, headers); }
  if (process.env.ANALYTICS_ENABLED !== 'true' || !process.env.RATE_HASH_SECRET || process.env.RATE_HASH_SECRET.length < 32) return respond(res, 503, { error: 'disabled' }, headers);
  // Platform-provided address is used only in a rotating hash for rate limiting.
  const ip = String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
  const bucket = createHmac('sha256', process.env.RATE_HASH_SECRET).update(`${new Date().toISOString().slice(0,10)}:${ip}`).digest('hex');
  try {
    const sql = database('web');
    const rows = await sql`SELECT analytics.collect_web(${event.id}::uuid,${environment()},${event.site},${event.kind},${event.path},${event.referrer},${event.device},${event.campaign},${bucket}) AS result`;
    return respond(res, rows[0].result === 'limited' ? 429 : 202, { status: rows[0].result }, headers);
  } catch { return respond(res, 503, { error: 'unavailable' }, headers); }
}
