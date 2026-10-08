import { respond } from '../lib/http.js';
export default function config(req, res) {
  if (req.method !== 'GET') return respond(res, 405, { error: 'method' });
  return respond(res, 200, { url: process.env.SUPABASE_URL || '', publicKey: process.env.SUPABASE_PUBLIC_KEY || '', environment: process.env.ANALYTICS_ENVIRONMENT === 'production' ? 'production' : 'preview' });
}
