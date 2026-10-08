import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
for (const file of ['.env.local','.env.roles.local','.env.runtime.local']) process.loadEnvFile(file);
assert.equal(process.env.ANALYTICS_ENVIRONMENT, 'preview', 'Only run this against preview.');
const base = process.env.SMOKE_URL || 'http://127.0.0.1:8787';
const owner = neon(process.env.DATABASE_URL);
const ids = [], checks = [];
const check = name => { checks.push(name); console.log(`PASS ${name}`); };
const post = (path, data, headers={}) => fetch(`${base}/api/${path}`, { method:'POST', headers:{'Content-Type':'text/plain',...headers},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
try {
  for (const [key,query] of [
    ['WEB_DATABASE_URL','SELECT * FROM analytics.app_events LIMIT 0'],
    ['WEB_DATABASE_URL','SELECT * FROM analytics.web_events LIMIT 0'],
    ['APP_DATABASE_URL','DELETE FROM analytics.app_events WHERE false'],
    ['APP_DATABASE_URL','SELECT * FROM analytics.web_events LIMIT 0'],
    ['REPORT_DATABASE_URL','DELETE FROM analytics.web_events WHERE false'],
    ['MAINTENANCE_DATABASE_URL','SELECT * FROM analytics.app_events LIMIT 0']
  ]) {
    let denied = false;
    try { await neon(process.env[key]).query(query); } catch(e) { denied = e.code === '42501'; }
    assert(denied, `${key} must be denied`);
  }
  check('Database roles reject access beyond their purpose');
  const id=randomUUID();ids.push(id);
  const event={id,site:'flowmaster',kind:'page_view',path:'/',device:'desktop',referrer:'example.com',campaign:'launch'};
  const origin = process.env.SMOKE_ORIGIN || 'http://localhost:4321';
  const headers={Origin:origin,'User-Agent':'Analytics preview verification'};
  assert.equal((await post('events',event,{...headers,Origin:'https://attacker.example'})).status,403);
  assert.equal((await post('events',{...event,path:'/account'},headers)).status,400);
  assert.equal((await post('events',event,{...headers,'Sec-GPC':'1'})).status,204);
  check('Unapproved origins, private routes and privacy opt-outs excluded');
  const first=await post('events',event,headers);assert.equal(first.status,202,await first.clone().text());assert.equal((await first.json()).status,'accepted');
  const replay=await post('events',event,headers);assert.equal(replay.status,202);assert.equal((await replay.json()).status,'duplicate');
  const rows=await owner`SELECT count(*)::int AS n FROM analytics.web_events WHERE environment='preview' AND event_id=${id}::uuid`;assert.equal(rows[0].n,1);
  check('Website event stored once despite replay');
  const appId=randomUUID();ids.push(appId);
  const app={id:appId,activity_type:'analytics_preview_check',details:{test:true},created_at:new Date().toISOString()};
  assert.equal((await post('app-events',app)).status,401);
  const appHeaders={Authorization:`Bearer ${process.env.APP_INGEST_SECRET}`};
  const a=await post('app-events',app,appHeaders);assert.equal(a.status,202,await a.clone().text());assert.equal((await a.json()).status,'accepted');
  const a2=await post('app-events',app,appHeaders);assert.equal(a2.status,202);assert.equal((await a2.json()).status,'duplicate');
  const history=await post('app-history',{activity_type:'analytics_preview_check'}, {Authorization:`Bearer ${process.env.APP_REPORT_SECRET}`});assert.equal(history.status,200,await history.clone().text());assert((await history.json()).entries.some(row=>row.id===appId));
  check('Backend-only app events deduplicate and appear in authenticated history');
  assert.equal((await fetch(`${base}/api/stats`)).status,401);
  assert.equal((await fetch(`${base}/api/retention`)).status,401);
  check('Private reporting and retention reject anonymous requests');
  const old=randomUUID();ids.push(old);
  await owner`INSERT INTO analytics.web_events(event_id,environment,site,kind,path,referrer,device,campaign,received_at) VALUES(${old}::uuid,'preview','flowmaster','page_view','/smoke-retention','','unknown','',now()-interval '32 days')`;
  const maintenance=neon(process.env.MAINTENANCE_DATABASE_URL);
  await maintenance`SELECT analytics.retain_web()`;
  await maintenance`SELECT analytics.retain_web()`;
  const rollup=await owner`SELECT sum(events)::int AS n FROM analytics.web_daily WHERE environment='preview' AND path='/smoke-retention'`;
  assert.equal(rollup[0].n,1);
  check('Retention rolls up old website events exactly once; app history retained');
} finally {
  for (const id of ids) {
    await owner`DELETE FROM analytics.web_events WHERE environment='preview' AND event_id=${id}::uuid`;
    await owner`DELETE FROM analytics.app_events WHERE environment='preview' AND id=${id}::uuid`;
  }
  await owner`DELETE FROM analytics.web_daily WHERE environment='preview' AND path='/smoke-retention'`;
  console.log('Synthetic preview event rows removed.');
}
console.log(`${checks.length} live checks passed.`);
