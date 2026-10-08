export async function isAdmin(req) {
  const token = req.headers.authorization;
  const emails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!token?.startsWith('Bearer ') || token.length > 12000 || !emails.length) return false;
  const url = process.env.SUPABASE_URL;
  if (url !== 'https://wwuafjftlttmkvhzgtxh.supabase.co') return false;
  try {
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_PUBLIC_KEY, Authorization: token }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const user = await response.json();
    return Boolean(user.email_confirmed_at && emails.includes(String(user.email || '').toLowerCase()));
  } catch { return false; }
}
