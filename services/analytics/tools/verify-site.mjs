// Run through the website project's `vercel env run -- node <this file> ...`.
// PLAYWRIGHT_MODULE is an absolute path to a locally installed Playwright module.
import assert from 'node:assert/strict';
import {writeFile, mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
const [site,url,evidenceDir]=process.argv.slice(2);
const origin=new URL(url).origin;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({userAgent:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'});
if(process.env.VERCEL_OIDC_TOKEN) await context.route(`${origin}/**`, route=>route.continue({headers:{...route.request().headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN}}));
const page=await context.newPage(),events=[];
page.on('request',req=>{if(req.url().endsWith('/api/events') && req.method()==='POST') events.push(JSON.parse(req.postData()));});
const first=page.waitForResponse(r=>r.url().endsWith('/api/events') && r.request().method()==='POST',{timeout:30000});
const response=await page.goto(url,{waitUntil:'domcontentloaded'});
assert.equal(response.status(),200);
const collected=await first; assert.equal(collected.status(),202,`Collector returned ${collected.status()}`);
assert.equal(events[0].site,site);assert.equal(events[0].path,'/');assert(!JSON.stringify(events[0]).includes('private-test-value'));
assert.equal(await page.locator('script[src="/shared-analytics.js"]').count(),1);
await page.setViewportSize({width:390,height:844});
await mkdir(evidenceDir,{recursive:true});
await page.screenshot({path:`${evidenceDir}/${site}-mobile.png`});
if(site==='flowmaster') {
 await page.goto(`${origin}/download/`,{waitUntil:'networkidle'});
 await page.evaluate(()=>document.querySelector('#download-windows-btn')?.addEventListener('click',e=>e.preventDefault()));
 if(await page.locator('#download-windows-btn').count()) {
  const click=page.waitForResponse(r=>r.url().endsWith('/api/events') && r.request().postData()?.includes('download_click'));
  await page.locator('#download-windows-btn').click();assert.equal((await click).status(),202);
 }
 const before=events.length;await page.goto(`${origin}/account/`,{waitUntil:'networkidle'});assert.equal(events.length,before);
 assert.equal(await page.locator('script[src="/shared-analytics.js"]').count(),0);
}
if(site==='portfolio') {
 const before=events.length;await page.goto(`${origin}/contact/confirm/?token=private-test-value`,{waitUntil:'networkidle'});assert.equal(events.length,before);
 assert.equal(await page.locator('script[src="/shared-analytics.js"]').count(),0);
}
if(site==='spindle') {
 const next=page.waitForResponse(r=>r.url().endsWith('/api/events') && r.request().method()==='POST');
 await page.goto(`${origin}/about/`,{waitUntil:'domcontentloaded'});assert.equal((await next).status(),202);
}
await context.addInitScript(()=>Object.defineProperty(navigator,'globalPrivacyControl',{get:()=>true}));
const before=events.length;await page.goto(url,{waitUntil:'networkidle'});assert.equal(events.length,before);
await writeFile(`${evidenceDir}/${site}-events.json`,JSON.stringify(events,null,2));
console.log(`PASS ${site}: browser → collector; route exclusions, privacy opt-out and emitted event fields verified.`);
await browser.close();
