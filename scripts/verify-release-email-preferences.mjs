// All account and preferences requests are intercepted. No real account or email mutations.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.env.ACCOUNT_URL||'http://127.0.0.1:4346/account/';
const out='outputs/2026-10-07-release-email-preferences';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const uid='00000000-0000-4000-8000-000000000042';
const user={id:uid,aud:'authenticated',role:'authenticated',email:'fixture@example.invalid',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'google',providers:['google']},user_metadata:{},identities:[{id:uid,user_id:uid,provider:'google'}],created_at:new Date().toISOString()};
const jwt=[{alg:'HS256',typ:'JWT'},{sub:uid,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'},'fixture'].map((x,i)=>Buffer.from(i<2?JSON.stringify(x):x).toString('base64url')).join('.');
const state=enabled=>({enabled,blocked:false,consentVersion:'release-updates-v1',consentText:'Email me Flowmaster release announcements and product updates. I can unsubscribe at any time.'});
const checks=[];
async function setup(options={}){
 const page=await browser.newPage({viewport:{width:options.width||1440,height:1080}}),requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));let enabled=options.enabled||false;let failGet=options.failGet||false;let pendingResolve;const pending=new Promise(r=>pendingResolve=r);
 const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
 await page.route('https://wwuafjftlttmkvhzgtxh.supabase.co/**',async route=>{
  const req=route.request();if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  const target=new URL(req.url());
  if(target.pathname.includes('/functions/v1/account-email-preferences')){
   const body=req.postDataJSON();requests.push(body);assert.equal(req.headers().authorization,'Bearer '+jwt);
   if(body.operation==='get'){
    if(options.delayGet)await pending;
    if(failGet)return route.fulfill({status:503,headers,json:{error:'Not available'}});
    return route.fulfill({headers,json:{...state(enabled),blocked:options.blocked||false}});
   }
   if(body.operation==='set'){
    if(options.delaySet)await pending;
    if(options.failSet)return route.fulfill({status:options.failSet,headers,json:{error:'Not saved'}});
    assert.equal(body.consentVersion,'release-updates-v1');enabled=body.enabled;return route.fulfill({headers,json:state(enabled)});
   }
   throw new Error('Unexpected preference operation');
  }
  const action=target.pathname.split('/').pop();
  if(action==='settings')return route.fulfill({headers,json:{external:{google:true}}});
  if(action==='user')return route.fulfill({headers,json:{...user,email_confirmed_at:options.unverified?null:user.email_confirmed_at}});
  if(action==='logout')return route.fulfill({headers,json:{}});
  throw new Error('Unexpected network request '+target.pathname);
 });
 await page.goto(url+(options.signedOut?'':`#access_token=${jwt}&refresh_token=fixture&expires_in=3600&token_type=bearer`));
 if(!options.signedOut)await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
 return {page,requests,errors,release:()=>pendingResolve(),recoverGet:()=>{failGet=false}};
}
try{
 for(const width of [390,1440]){
  const {page,requests,errors}=await setup({width});await page.getByText('You’re not subscribed to release emails.',{exact:true}).waitFor();
  assert.equal(await page.locator('#release-email-enabled').isChecked(),false);assert.deepEqual(requests,[{operation:'get'}]);
  await page.locator('#release-email-enabled').check();assert.equal(requests.length,1);await page.locator('#release-preferences-save').click();await page.getByText('You’re subscribed to release emails. You can unsubscribe here at any time.',{exact:true}).waitFor();
  assert.equal(requests.at(-1).enabled,true);await page.reload();await page.getByText('You’re subscribed to release emails.',{exact:true}).waitFor();assert.equal(await page.locator('#release-email-enabled').isChecked(),true);
  await page.screenshot({path:`${out}/subscribed-${width}.png`,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#release-preferences-unsubscribe').click();await page.getByText('You’re unsubscribed from release emails. Account and security emails are unaffected.',{exact:true}).waitFor();assert.equal(await page.locator('#release-email-enabled').isChecked(),false);assert.equal(requests.at(-1).enabled,false);
  assert.deepEqual(errors,[]);checks.push(`Explicit opt-in, saved readback, unsubscribe and layout at ${width}px`);await page.close();
 }
 for(const opt of [{signedOut:true},{unverified:true}]){
  const {page,requests}=await setup(opt);assert.equal(await page.locator('#release-preferences').isVisible(),false);assert.equal(requests.length,0);checks.push(opt.signedOut?'Signed-out visitor has no preferences request or signup opt-in':'Unverified session cannot show subscription controls');await page.close();
 }
 {
  const {page,requests}=await setup({failGet:true});await page.getByText('Your email preference could not be confirmed. Please try again.',{exact:true}).waitFor();assert.equal(await page.locator('#release-preferences-save').isDisabled(),true);assert.equal(await page.locator('#release-email-enabled').isChecked(),false);await page.locator('#release-preferences-unsubscribe').click();await page.getByText('You’re unsubscribed from release emails. Account and security emails are unaffected.',{exact:true}).waitFor();assert.equal(requests.at(-1).enabled,false);checks.push('Failed preference read never implies subscription; unsubscribe stays available');await page.close();
 }
 for(const status of [401,503]){
  const {page}=await setup({failSet:status});await page.getByText('You’re not subscribed to release emails.',{exact:true}).waitFor();await page.locator('#release-email-enabled').check();await page.locator('#release-preferences-save').click();await page.getByText(status===401?'Your sign-in has expired. Sign in again to manage release emails.':'Your email preference could not be confirmed. Please try again.',{exact:true}).waitFor();assert.equal(await page.locator('#release-email-enabled').isChecked(),false);assert.equal(await page.locator('#release-preferences-save').isDisabled(),true);assert.equal(await page.locator('#release-preferences-retry').isVisible(),true);checks.push(`${status} save response never displays confirmed subscription`);await page.close();
 }
 {
  const {page,requests}=await setup({blocked:true});await page.getByText('Release emails are paused because of a delivery issue. Contact support@flowmastersuite.com if you want to receive them again.',{exact:true}).waitFor();assert.equal(await page.locator('#release-email-enabled').isDisabled(),true);assert.equal(await page.locator('#release-preferences-save').isDisabled(),true);await page.locator('#release-preferences-unsubscribe').click();await page.getByText('You’re unsubscribed from release emails. Account and security emails are unaffected.',{exact:true}).waitFor();assert.equal(requests.at(-1).enabled,false);checks.push('Delivery suppression prevents self-service re-enable while unsubscribe works');await page.close();
 }
 {
  const {page,release}=await setup({enabled:true,delayGet:true});await page.locator('#account-signout').click();await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();release();await page.waitForTimeout(150);assert.equal(await page.locator('#release-preferences').isVisible(),false);assert.equal(await page.locator('#release-email-enabled').isChecked(),false);assert.equal(await page.locator('#release-preferences-message').textContent(),'');checks.push('Late read from signed-out account cannot repopulate preferences');await page.close();
 }
 {
  const {page,release}=await setup({delaySet:true});await page.getByText('You’re not subscribed to release emails.',{exact:true}).waitFor();await page.locator('#release-email-enabled').check();await page.locator('#release-preferences-save').click();await page.getByText('Saving your email preference…',{exact:true}).waitFor();await page.locator('#account-signout').click();await page.getByRole('heading',{name:'Sign in',exact:true}).waitFor();release();await page.waitForTimeout(150);assert.equal(await page.locator('#release-preferences-message').textContent(),'');assert.equal(await page.locator('#release-email-enabled').isChecked(),false);checks.push('Late save response cannot display success after signout');await page.close();
 }
 await writeFile(`${out}/browser.json`,JSON.stringify({url,passed:checks.length,checks,network:'All Supabase requests intercepted; no emails or live account changes'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,checks}));
}finally{await browser.close()}
