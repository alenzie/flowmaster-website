import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SITE_URL || 'http://127.0.0.1:4345';const live=base.startsWith('https://flowmaster.live');
const out='outputs/2026-10-07-google-branding';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const checks=[];
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.name));
  const response=await page.goto(base+'/privacy/',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.getByRole('heading',{name:'Privacy Policy',exact:true}).waitFor();assert.equal(await page.locator('article h2').count(),9);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://flowmaster.live/privacy/');
  assert.ok((await page.locator('article').textContent()).includes('October 7, 2026'));
  assert.ok(await page.locator('article a[href^="mailto:support@flowmastersuite.com"]').count());
  assert.equal(await page.locator('a[href="https://myaccount.google.com/connections"]').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/${live?'live':'local'}-privacy-${width}.png`,fullPage:true});
  if(width===1440)await writeFile(`${out}/kit/Privacy-Policy-readable.txt`,await page.locator('article').innerText());
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('footer a[href="/privacy"]').count(),1);
  await page.goto(base+'/account/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.account-note a[href="/privacy"]').count(),1);
  await page.goto(base+'/data/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('main a[href="/privacy"]').count(),1);
  checks.push({width,publicPage:true,canonicalCorrect:true,policySections:9,contactCorrect:true,googleRevocationLinked:true,noOverflow:true,homeAccountTrialLinks:true,browserErrors:errors});await page.close();
 }
 await writeFile(`${out}/${live?'live':'local'}-verification.json`,JSON.stringify({base,checks},null,2)+'\n');console.log(JSON.stringify({checked:checks.length,base,passed:true}));
}finally{await browser.close();}
