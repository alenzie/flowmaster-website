// Isolated browser checks: all Auth requests intercepted; no real accounts or emails.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.ACCOUNT_URL || 'http://127.0.0.1:4345/account';
const out='outputs/2026-10-07-google-signin';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const checks=[];
const uid='00000000-0000-4000-8000-000000000042';
const user={id:uid,aud:'authenticated',role:'authenticated',email:'preview@example.com',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'google',providers:['google']},user_metadata:{},identities:[{id:uid,user_id:uid,provider:'google',identity_data:{email:'preview@example.com'}}],created_at:new Date().toISOString()};
const jwt=[{alg:'HS256',typ:'JWT'},{sub:uid,exp:Math.floor(Date.now()/1000)+3600,aud:'authenticated'},'fixture'].map((x,i)=>Buffer.from(i<2?JSON.stringify(x):x).toString('base64url')).join('.');
const session={access_token:jwt,refresh_token:'fixture-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:'bearer',user};
async function setup({enabled=true,settingsFail=false}={}){
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const requests=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://wwuafjftlttmkvhzgtxh.supabase.co/auth/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),action=url.pathname.split('/').pop();
  const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PUT,OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  requests.push({action,method:req.method(),url:url.href,body:req.postData()?req.postDataJSON():null});
  if(action==='settings'&&settingsFail)return route.abort();
  let body;
  if(action==='settings')body={external:{google:enabled}};
  else if(action==='authorize')return route.fulfill({status:200,contentType:'text/html',body:'<p>Intercepted OAuth redirect</p>'});
  else if(action==='user')body=user;
  else if(action==='logout')body={};
  else if(action==='signup')body={user:{...user,identities:[]},session:null};
  else if(action==='recover')body={};
  else if(action==='token')body={...session,user:{...user,identities:[{provider:'email'}],app_metadata:{provider:'email'}}};
  else throw new Error('Unexpected Auth endpoint: '+action);
  return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(body)});
 });
 return {page,requests,errors};
}
try{
 for(const width of [390,1440]){
  const {page,requests,errors}=await setup();await page.setViewportSize({width,height:1050});await page.goto(base);await page.waitForFunction(()=>!document.querySelector('#account-google').disabled);
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).count(),1);
  await page.screenshot({path:`${out}/google-signin-${width}.png`,fullPage:true});
  await page.locator('#account-switch').click();assert.equal(await page.locator('#account-title').textContent(),'Create a free account');
  await page.locator('#account-google').click();await page.waitForURL('**/auth/v1/authorize?**');
  const target=new URL(page.url());assert.equal(target.searchParams.get('provider'),'google');assert.equal(target.searchParams.get('redirect_to'),'https://flowmaster.live/account');assert.equal(target.searchParams.get('prompt'),'select_account');
  assert.equal(target.searchParams.has('access_type'),false);assert.equal(target.searchParams.has('scope'),false);assert.deepEqual(errors,[]);
  checks.push(`Google button and fixed signup/login redirect at ${width}px`);await page.close();
 }
 for(const opts of [{enabled:false},{settingsFail:true}]){
  const {page}=await setup(opts);await page.goto(base);await page.waitForFunction(()=>!document.querySelector('#account-google-status').textContent.includes('Checking'));
  assert.equal(await page.locator('#account-google').isDisabled(),true);assert.equal(await page.locator('#account-submit').isEnabled(),true);checks.push(opts.settingsFail?'Settings failure preserves email form':'Disabled provider cannot start OAuth');await page.close();
 }
 {
  const {page}=await setup();await page.goto(base+'#error=access_denied&error_description=%3Cscript%3Ebad%3C/script%3E');await page.getByText('Google sign-in wasn’t completed. Try again or use email below.').waitFor();assert.equal(new URL(page.url()).hash,'');checks.push('Cancelled OAuth gives safe retry and removes error fragment');await page.close();
 }
 {
  const {page,requests,errors}=await setup();
  await page.goto(base+`#access_token=${jwt}&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer`);
  await page.getByRole('heading',{name:'You’re signed in'}).waitFor();assert.equal(new URL(page.url()).hash,'');assert.equal(await page.locator('#account-google-options').isVisible(),false);
  await page.reload();await page.getByRole('heading',{name:'You’re signed in'}).waitFor();
  await page.getByRole('button',{name:'Set a Flowmaster password',exact:true}).click();await page.locator('#new-password').fill('Fixture-flowmaster-93!');await page.locator('#confirm-password').fill('Different-pass-93!');await page.getByRole('button',{name:'Save password',exact:true}).click();await page.getByText('Passwords do not match.',{exact:true}).waitFor();assert.equal(requests.some(r=>r.method==='PUT'),false);
  await page.locator('#password-cancel').click();assert.equal(await page.locator('#new-password').inputValue(),'');
  await page.getByRole('button',{name:'Set a Flowmaster password',exact:true}).click();await page.locator('#new-password').fill('Fixture-flowmaster-93!');await page.locator('#confirm-password').fill('Fixture-flowmaster-93!');await page.getByRole('button',{name:'Save password',exact:true}).click();await page.getByText('Password saved. Sign in to Flowmaster with your email and this password.',{exact:true}).waitFor();
  assert.equal(requests.filter(r=>r.action==='user'&&r.method==='PUT').length,1);assert.equal(requests.filter(r=>r.action==='logout').length,1);
  assert.equal(await page.locator('#account-form').isVisible(),true);assert.deepEqual(errors,[]);checks.push('OAuth return, fragment cleanup, reload, password handoff, mismatch, cancel, and signout');await page.close();
 }
 {
  const {page,requests}=await setup();await page.goto(base);await page.locator('#account-switch').click();await page.locator('#account-email').fill('preview@example.com');await page.locator('#account-password').fill('Fixture-email-93!');await page.locator('#account-submit').click();await page.getByText('Check your email to confirm your account, then sign in to Flowmaster.',{exact:true}).waitFor();await page.locator('#account-switch').click();await page.locator('#account-recover').click();await page.getByText('If this account exists, you’ll receive a password-reset email.',{exact:true}).waitFor();await page.locator('#account-password').fill('Fixture-email-93!');await page.locator('#account-submit').click();await page.getByRole('heading',{name:'You’re signed in'}).waitFor();assert.equal(await page.locator('#account-set-password').isVisible(),false);assert.ok(requests.some(r=>r.action==='signup'));assert.ok(requests.some(r=>r.action==='recover'));assert.ok(requests.some(r=>r.action==='token'));checks.push('Email signup, recovery request, and password login preserved');await page.close();
 }
 {
  const {page}=await setup();await page.goto(base+`#access_token=${jwt}&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=recovery`);await page.getByRole('heading',{name:'Set a Flowmaster password'}).waitFor();assert.equal(await page.locator('#account-google-options').isVisible(),false);checks.push('Existing email recovery callback still opens password form');await page.close();
 }
 await writeFile(`${out}/browser.json`,JSON.stringify({url:base,passed:checks.length,checks,authRequests:'intercepted fixtures; Google consent and real identity linking not yet verified'},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,checks}));
}finally{await browser.close();}
