import { timingSafeEqual } from 'node:crypto';

export function respond(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

export async function body(req, limit = 18000) {
  if (Number(req.headers['content-length'] || 0) > limit) throw new Error('body_too_large');
  let raw = req.body;
  if (raw === undefined) {
    const chunks = []; let length = 0;
    for await (const chunk of req) {
      length += Buffer.byteLength(chunk);
      if (length > limit) throw new Error('body_too_large');
      chunks.push(Buffer.from(chunk));
    }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(raw)) raw = raw.toString('utf8');
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || Buffer.byteLength(JSON.stringify(parsed)) > limit) throw new Error('invalid_body');
  return parsed;
}

export function bearer(req, expected) {
  if (!req.headers.authorization?.startsWith('Bearer ')) return false;
  const provided = req.headers.authorization.slice(7);
  if (!expected || expected.length < 32 || provided.length !== expected.length) return false;
  const actual = Buffer.from(provided), wanted = Buffer.from(expected);
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const environment = () => process.env.ANALYTICS_ENVIRONMENT === 'production' ? 'production' : 'preview';
