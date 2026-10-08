import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SITE_URL || 'http://127.0.0.1:4346';const live=base.startsWith('https://flowmaster.live');
const out='outputs/2026-10-07-terms';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const checks=[];
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.name));
  const response=await page.goto(base+'/terms/',{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.getByRole('heading',{name:'Terms of Service',exact:true}).waitFor();assert.equal(await page.locator('article h2').count(),10);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://flowmaster.live/terms/');
  assert.ok((await page.locator('article').textContent()).includes('October 7, 2026'));
  assert.ok(await page.locator('article a[href^="mailto:support@flowmastersuite.com"]').count());
  assert.ok((await page.locator('article').innerText()).includes('30 actions per PC'));
  assert.ok((await page.locator('article').innerText()).includes('software license'));
  assert.ok(await page.locator('article a[href="/privacy"]').count());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  const label=await page.locator('.terms-label').boundingBox();
  const nav=await page.locator('body > header').boundingBox();
  assert.ok(label.y >= nav.y + nav.height, 'Page label must clear the fixed navigation');
  await page.screenshot({path:`${out}/${live?'live':'local'}-terms-top-${width}.png`});
  await page.screenshot({path:`${out}/${live?'live':'local'}-terms-${width}.png`,fullPage:true});
  if(width===1440)await writeFile('outputs/2026-10-07-google-branding/kit/Terms-of-Service-readable.txt',await page.locator('article').innerText());
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('footer a[href="/terms"]').count(),1);
  await page.goto(base+'/account/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.account-note a[href="/terms"]').count(),1);
  await page.goto(base+'/download/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('main a[href="/terms"]').count(),1);
  checks.push({width,publicPage:true,canonicalCorrect:true,termsSections:10,contactCorrect:true,privacyAndTrialLinked:true,noOverflow:true,homeAccountDownloadLinks:true,browserErrors:errors});await page.close();
 }
 await writeFile(`${out}/${live?'live':'local'}-verification.json`,JSON.stringify({base,checks},null,2)+'\n');console.log(JSON.stringify({checked:checks.length,base,passed:true}));
}finally{await browser.close();}
