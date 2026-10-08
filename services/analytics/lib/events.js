import { uuid } from './http.js';

export function sites() {
  const configured = JSON.parse(process.env.ANALYTICS_SITES || '{}');
  return configured;
}

export function webEvent(input, origin, config = sites()) {
  if (!uuid(input.id) || !['flowmaster','spindle','portfolio'].includes(input.site)) throw new Error('invalid_event');
  const site = config[input.site];
  if (!site?.origins?.includes(origin)) throw new Error('invalid_origin');
  if (!['page_view','download_click','outbound_click'].includes(input.kind)) throw new Error('invalid_kind');
  if (typeof input.path !== 'string' || !site.paths?.includes(input.path)) throw new Error('private_or_unknown_route');
  if (!['mobile','desktop','unknown'].includes(input.device)) throw new Error('invalid_device');
  let referrer = '';
  if (typeof input.referrer === 'string' && input.referrer) {
    // Receive a hostname only, never a full URL or its query string.
    if (input.referrer.length > 120 || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}$/.test(input.referrer)) throw new Error('invalid_referrer');
    referrer = input.referrer;
  }
  const campaign = typeof input.campaign === 'string' && site.campaigns?.includes(input.campaign) ? input.campaign : '';
  return { id: input.id, site: input.site, kind: input.kind, path: input.path, device: input.device, referrer, campaign };
}

export function appEvent(input) {
  if (!uuid(input.id) || typeof input.activity_type !== 'string' || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(input.activity_type)) throw new Error('invalid_event');
  for (const name of ['user_id','machine_id','license_id']) {
    if (input[name] !== null && input[name] !== undefined && !uuid(input[name])) throw new Error('invalid_identity');
  }
  if (!input.details || typeof input.details !== 'object' || Array.isArray(input.details) || Buffer.byteLength(JSON.stringify(input.details)) > 16000) throw new Error('invalid_details');
  const created = new Date(input.created_at);
  if (!Number.isFinite(created.getTime()) || created.getTime() > Date.now() + 300000 || created.getTime() < Date.now() - 86400000) throw new Error('invalid_time');
  return { ...input, user_id: input.user_id || null, machine_id: input.machine_id || null, license_id: input.license_id || null, created_at: created.toISOString() };
}
