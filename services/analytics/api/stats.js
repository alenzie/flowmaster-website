import { environment, respond } from '../lib/http.js';
import { database } from '../lib/db.js';
import { isAdmin } from '../lib/admin.js';

export default async function stats(req, res) {
  if (req.method !== 'GET') return respond(res, 405, { error: 'method' });
  if (!(await isAdmin(req))) return respond(res, 401, { error: 'Administrator sign-in required' });
  const days = [7,30,90,365].includes(Number(req.query?.days)) ? Number(req.query.days) : 30;
  try {
    const sql = database('reader');
    const [web, app] = await sql.transaction([
      sql`SELECT site,kind,path,referrer,device,campaign,sum(events)::integer AS events FROM (
        SELECT site,kind,path,referrer,device,campaign,count(*) AS events FROM analytics.web_events
          WHERE environment=${environment()} AND received_at >= now()-make_interval(days=>${days}) GROUP BY 1,2,3,4,5,6
        UNION ALL SELECT site,kind,path,referrer,device,campaign,events FROM analytics.web_daily
          WHERE environment=${environment()} AND day >= (now() AT TIME ZONE 'UTC')::date-${days}
      ) combined GROUP BY 1,2,3,4,5,6 ORDER BY events DESC LIMIT 500`,
      sql`SELECT activity_type,count(*)::integer AS events FROM analytics.app_events
        WHERE environment=${environment()} AND created_at >= now()-make_interval(days=>${days}) GROUP BY 1 ORDER BY events DESC LIMIT 100`
    ], { isolationLevel: 'RepeatableRead', readOnly: true });
    return respond(res, 200, { environment: environment(), days, web, app, generated_at: new Date().toISOString(), web_groups_limited: web.length === 500 });
  } catch { return respond(res, 503, { error: 'Reports are temporarily unavailable' }); }
}
