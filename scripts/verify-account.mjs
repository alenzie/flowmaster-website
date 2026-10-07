// Verify published controls and their request wiring without sending another real email.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const url=process.env.ACCOUNT_URL || 'https://flowmaster.live/account';
const out=new URL('../outputs/2026-10-07-account-release/',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:1000}});
  const requests=[];const errors=[];
  page.on('pageerror',err=>errors.push(err.name));
  await page.route('https://wwuafjftlttmkvhzgtxh.supabase.co/auth/v1/**',async route=>{
   const req=route.request();const u=new URL(req.url());
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST,GET,OPTIONS'}});
   const action=u.pathname.split('/').pop();
   if(!['signup','recover'].includes(action))return route.abort();
   const data=req.postDataJSON();
   if(data.email!=='preview@example.com'||u.searchParams.get('redirect_to')!=='https://flowmaster.live/account')throw new Error('Unexpected request wiring');
   requests.push(action);
   await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(action==='signup'?{id:'00000000-0000-4000-8000-000000000000',email:data.email,identities:[]}: {})});
  });
  await page.goto(url,{waitUntil:'networkidle'});
  for(const id of ['account-switch','account-recover'])if(!await page.locator('#'+id).isEnabled())throw new Error('Public button still disabled');
  if(await page.locator('.account-service-status').count())throw new Error('Old email setup banner remains');
  await page.screenshot({path:fileURLToPath(new URL(`account-enabled-${width}.png`,out)),fullPage:true});
  await page.locator('#account-switch').click();
  if(await page.locator('#account-title').innerText()!=='Create a free account')throw new Error('Signup mode failed');
  await page.screenshot({path:fileURLToPath(new URL(`signup-enabled-${width}.png`,out)),fullPage:true});
  await page.locator('#account-email').fill('preview@example.com');
  await page.locator('#account-password').fill('Preview-fixture-only-93!');
  await page.locator('#account-submit').click();
  await page.getByText('Check your email to confirm your account, then sign in to Flowmaster.',{exact:true}).waitFor();
  await page.locator('#account-switch').click();
  await page.locator('#account-recover').click();
  await page.getByText('If this account exists, you’ll receive a password-reset email.',{exact:true}).waitFor();
  if(requests.join(',')!=='signup,recover'||errors.length)throw new Error('Request sequence or browser errors');
  if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error('Overflow');
  results.push({width,signupEnabled:true,recoveryEnabled:true,staleBannerRemoved:true,requests,submissions:'intercepted, no real emails sent',browserErrors:errors});
  await page.close();
 }
 await writeFile(new URL('browser-verification.json',out),JSON.stringify({url,checkedAt:new Date().toISOString(),results},null,2)+'\n');
 console.log('Account controls and signup/recovery wiring passed at mobile and desktop widths. No real messages sent.');
}finally{await browser.close();}
