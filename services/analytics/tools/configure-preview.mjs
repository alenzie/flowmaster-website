import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
for (const path of ['.env.roles.local','.env.runtime.local']) process.loadEnvFile(path);
const scope='team_Tnxxcaebmciyfkpwvsir9asM', project='prj_twVar6A7sWst5aJwAlBSrEeJMwUP';
const keys=['WEB_DATABASE_URL','APP_DATABASE_URL','REPORT_DATABASE_URL','MAINTENANCE_DATABASE_URL','APP_INGEST_SECRET','APP_REPORT_SECRET','RATE_HASH_SECRET','CRON_SECRET','SUPABASE_URL','SUPABASE_PUBLIC_KEY','ADMIN_EMAILS','ANALYTICS_ENABLED','ANALYTICS_ENVIRONMENT','ANALYTICS_SITES'];
if(process.env.ANALYTICS_ENVIRONMENT!=='preview') throw new Error('Preview configuration only.');
function api(path, method, payload) {
  const inputFile = '.env.vercel-request.local';
  // CLI 52 serializes objects but not arrays; pass arrays as a parsed raw JSON string.
  writeFileSync(inputFile,JSON.stringify(Array.isArray(payload) ? JSON.stringify(payload) : payload),{mode:0o600});
  try {
    const result=execFileSync('vercel',['api',path,'--method',method,'--scope',scope,'--input',inputFile,'--header','Content-Type:application/json','--raw'],{input:JSON.stringify(payload),encoding:'utf8',stdio:['pipe','pipe','pipe'],timeout:120000});
    const parsed=JSON.parse(result);
    if(parsed.error || parsed.failed?.length) throw new Error('API rejected request.');
    return parsed;
  } catch (error) {
    let diagnostic = String(error.stderr || error.message || 'Unknown error');
    for (const key of keys) if(process.env[key]) diagnostic = diagnostic.split(process.env[key]).join('[redacted]');
    console.error(diagnostic.slice(-1800));
    throw new Error(`Vercel ${method} configuration failed; credentials redacted.`);
  } finally { unlinkSync(inputFile); }
}
api(`/v10/projects/${project}/env?upsert=true`,'POST',keys.map(key=>{
  if(!process.env[key]) throw new Error(`Missing ${key}`);
  return {key,value:process.env[key],target:['preview'],type:'encrypted'};
}));
console.log('Restricted credentials and runtime configuration saved for preview only.');
// The collector accepts browser requests. Reports remain behind verified admin sign-in.
// This applies only to the newly created collector, never the existing websites.
api(`/v9/projects/${project}`,'PATCH',{ssoProtection:null});
console.log('Collector reachable by test browsers; application-level report authentication retained.');
