(() => {
  const script = document.currentScript;
  if (!script || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  // No cookies, local storage, fingerprint or account linkage.
  const site = script.dataset.site;
  const allowed = (script.dataset.paths || '').split(',');
  const path = location.pathname.replace(/\/$/, '') || '/';
  if (!allowed.includes(path) || !crypto.randomUUID) return;
  const endpoint = script.dataset.endpoint;
  try { if (!endpoint || new URL(endpoint).protocol !== 'https:') return; } catch { return; }
  let referrer = '';
  try { referrer = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* unknown referrer */ }
  const campaign = new URL(location.href).searchParams.get('utm_campaign') || '';
  const approvedCampaign = (script.dataset.campaigns || '').split(',').includes(campaign) ? campaign : '';
  const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  const send = kind => {
    const payload = JSON.stringify({ id: crypto.randomUUID(), site, kind, path, referrer, device, campaign: approvedCampaign });
    fetch(endpoint, { method: 'POST', body: payload, credentials: 'omit', mode: 'cors', keepalive: true, headers: { 'Content-Type': 'text/plain' }, signal: AbortSignal.timeout(3000) }).catch(() => {});
  };
  let sent = false;
  const pageView = () => { if (!sent && document.visibilityState === 'visible') { sent = true; send('page_view'); } };
  pageView(); document.addEventListener('visibilitychange', pageView);
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[data-analytics]') : null;
    if (link && ['download_click','outbound_click'].includes(link.dataset.analytics)) send(link.dataset.analytics);
  }, { passive: true });
})();
