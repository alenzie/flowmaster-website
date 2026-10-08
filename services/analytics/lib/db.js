import { neon } from '@neondatabase/serverless';

export function database(role) {
  const name = { web: 'WEB_DATABASE_URL', app: 'APP_DATABASE_URL', reader: 'REPORT_DATABASE_URL', maintenance: 'MAINTENANCE_DATABASE_URL' }[role];
  if (!name || !process.env[name]) throw new Error('Database is not configured');
  return neon(process.env[name], { fetchOptions: { signal: AbortSignal.timeout(8000) } });
}
