const $ = id => document.getElementById(id);
let token = '', config;
const names = { flowmaster: 'FlowMaster', spindle: 'Spindle', portfolio: 'Portfolio' };
function rows(target, data) {
  const fragment = document.createDocumentFragment();
  for (const values of data) {
    const tr = document.createElement('tr');
    for (const value of values) { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }
    fragment.append(tr);
  }
  target.replaceChildren(fragment);
}
async function refresh() {
  $('status').textContent = 'Loading reports…';
  try {
    const response = await fetch(`/api/stats?days=${$('days').value}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Report unavailable');
    $('login').hidden = true; $('report').hidden = false;
    $('environment').textContent = data.environment === 'preview' ? 'Preview data only · Live tracking has not been switched.' : `Production reporting · Last ${data.days} days`;
    $('environment').classList.toggle('preview', data.environment === 'preview');
    $('sites').replaceChildren();
    for (const [site,name] of Object.entries(names)) {
      const card = document.createElement('div'); card.className = 'card'; card.textContent = name;
      const count = document.createElement('strong'); count.textContent = data.web.filter(r => r.site === site && r.kind === 'page_view').reduce((sum,r) => sum+r.events,0).toLocaleString();
      const label = document.createElement('span'); label.textContent = 'page views'; card.append(count,label); $('sites').append(card);
    }
    rows($('web'), data.web.map(r => [names[r.site] || r.site, r.path, r.referrer || 'Direct / unknown', r.kind, r.events]));
    rows($('app'), data.app.map(r => [r.activity_type,r.events]));
    $('status').textContent = data.web_groups_limited ? 'Showing the 500 largest web groups; totals shown are limited.' : 'Reports updated. No events means no recorded activity in this window.';
  } catch (error) { $('status').textContent = error.message; }
}
$('login').addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true;
  try {
    config ||= await (await fetch('/api/config')).json();
    if (config.url !== 'https://wwuafjftlttmkvhzgtxh.supabase.co' || !config.publicKey) throw new Error('Administrator sign-in is not configured.');
    const credentials = { email: form.elements.email.value, password: form.elements.password.value };
    form.elements.password.value = '';
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: config.publicKey, 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) });
    const result = await response.json();
    if (!response.ok) throw new Error('Sign-in failed. Check your FlowMaster administrator credentials.');
    token = result.access_token; await refresh();
  } catch (error) { $('status').textContent = error.message; } finally { button.disabled = false; }
});
$('refresh').addEventListener('click', refresh); $('days').addEventListener('change', refresh);
$('logout').addEventListener('click', () => { token = ''; $('report').hidden = true; $('login').hidden = false; $('web').replaceChildren(); $('app').replaceChildren(); $('sites').replaceChildren(); $('status').textContent = 'Signed out of analytics.'; });
