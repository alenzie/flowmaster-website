import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.UNSUBSCRIBE_URL||'http://127.0.0.1:4346/email-preferences/';
const out='outputs/2026-10-07-release-email-preferences';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const token='a'.repeat(64),checks=[];
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),requests=[],errors=[];let failure=true;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://wwuafjftlttmkvhzgtxh.supabase.co/**',route=>{
   const r=route.request();requests.push({url:r.url(),method:r.method(),body:r.postData(),headers:r.headers()});
   return route.fulfill({status:failure?503:200,headers:{'access-control-allow-origin':'*'},contentType:'text/plain',body:failure?'Retry':'Unsubscribed'});
  });
  await page.goto(url+'#token='+token);await page.getByText('No sign-in needed. Select unsubscribe to confirm your choice.',{exact:true}).waitFor();
  assert.equal(new URL(page.url()).hash,'');assert.equal(requests.length,0);assert.deepEqual(await page.evaluate(()=>[localStorage.length,sessionStorage.length]),[0,0]);
  await page.locator('#unsubscribe').click();await page.getByText('We couldn’t confirm your unsubscribe. Please try again, or use your account preferences.',{exact:true}).waitFor();assert.equal(await page.locator('#unsubscribe').isEnabled(),true);
  failure=false;await page.locator('#unsubscribe').click();await page.getByText('You’re unsubscribed from Flowmaster release emails. Account and security emails are unaffected.',{exact:true}).waitFor();assert.equal(await page.locator('#unsubscribe').isVisible(),false);
  assert.equal(requests.length,2);for(const r of requests){assert.equal(r.method,'POST');assert.equal(new URL(r.url).searchParams.get('token'),token);assert.equal(r.body,'List-Unsubscribe=One-Click');assert.equal(r.headers.authorization,undefined);assert.equal(r.headers.referer,undefined)}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await page.screenshot({path:`${out}/public-unsubscribe-${width}.png`,fullPage:true});checks.push(`No-login explicit confirmation, failed response retry, success and token hygiene at${width}px`);await page.close();
 }
 for(const suffix of ['', '#token=invalid', '#token='+('A'.repeat(64)), '?token='+token]){
  const page=await browser.newPage();const requests=[];await page.route('https://wwuafjftlttmkvhzgtxh.supabase.co/**',r=>{requests.push(r.request().url());return r.abort()});await page.goto(url+suffix);await page.getByText('This link is incomplete or invalid. Open the unsubscribe link from your release email again, or use your account preferences.',{exact:true}).waitFor();assert.equal(await page.locator('#unsubscribe').isVisible(),false);assert.equal(requests.length,0);assert.equal(new URL(page.url()).hash,'');assert.equal(new URL(page.url()).search,'');await page.close();
 }
 checks.push('Missing, malformed, uppercase and query-string tokens cannot send requests');await writeFile(`${out}/public-unsubscribe.json`,JSON.stringify({url,passed:checks.length,checks,network:'Provider requests intercepted; no account or email changes'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,checks}));
}finally{await browser.close()}
