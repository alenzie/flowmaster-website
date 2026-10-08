// Read-only production smoke: opens Google authorization but never signs in.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
const out='outputs/2026-10-07-google-signin';await mkdir(out,{recursive:true});
const checks=[];
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1050}});const errors=[];page.on('pageerror',e=>errors.push(e.name));
  await page.goto('https://flowmaster.live/account/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#account-google')?.disabled===false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#account-submit').isEnabled(),true);
  await page.screenshot({path:`${out}/live-google-signin-${width}.png`,fullPage:true});
  if(width===1440){
   await page.locator('#account-google').click();await page.waitForURL(u=>u.hostname==='accounts.google.com');await page.waitForLoadState('domcontentloaded');
   const url=new URL(page.url());assert.equal(url.searchParams.get('client_id'),'580964033316-7o2qqgc8rcf6nm2m4mhfrokf48b95tma.apps.googleusercontent.com');
   const body=await page.locator('body').innerText();assert.equal(/redirect_uri_mismatch|invalid_client|Error 400/.test(body),false);
   checks.push('Live button reaches Google with configured client; no client/redirect error shown before sign-in');
  }
  assert.deepEqual(errors,[]);checks.push(`Live enabled Google button and email fallback, no overflow at ${width}px`);await page.close();
 }
 await writeFile(`${out}/production.json`,JSON.stringify({url:'https://flowmaster.live/account/',checks,passed:checks.length,googleAccountSignIn:'not performed; owner must complete consent',accountsCreated:0,emailsSent:0},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,checks}));
}finally{await browser.close();}
