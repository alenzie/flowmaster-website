const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base = process.env.SITE_URL || 'http://127.0.0.1:4337/';
const output = new URL('../outputs/2026-10-07-home-workflow/', import.meta.url);
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true});
const checks=[];
try {
  for (const width of [1440,390]) {
    const page = await browser.newPage({viewport:{width,height:1000},reducedMotion:width===390?'reduce':'no-preference'});
    const errors=[]; const failures=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('response', r=>{if(r.status()>=400 && r.url().includes('/demos/flowmaster-ux-story/'))failures.push({url:r.url(),status:r.status()});});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('#workflow-demo').scrollIntoViewIfNeeded();
    const button=page.locator('[data-workflow-play]');
    await button.waitFor();
    await page.waitForFunction(()=>!document.querySelector('[data-workflow-play]').disabled,{},{timeout:60000});
    const frame = page.frames().find(f=>f.url().includes('/demos/flowmaster-ux-story/'));
    if(!frame || !frame.url().includes('embed=1'))throw Error('Demo embed mode not loaded');
    const media=await frame.locator('video').evaluateAll(vids=>vids.map(v=>({ready:v.readyState,width:v.videoWidth,paused:v.paused,src:new URL(v.currentSrc).pathname})));
    if(!media.length || media.some(v=>v.ready<2 || !v.width || !v.paused))throw Error('Video was not ready or unexpectedly autoplayed');
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal page overflow');
    const placement=await page.evaluate(()=>document.querySelector('#hero').nextElementSibling.id);
    if(placement!=='workflow-demo')throw Error('Demo is not immediately below hero');
    await page.screenshot({path:fileURLToPath(new URL(`ready-${width}.png`,output))});
    await button.click();
    await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Pause walkthrough');
    await page.waitForTimeout(1800);
    await button.click();
    await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Play walkthrough');
    // Frame geometry exposes accidental cropping/letterboxing at either size.
    const geometry=await frame.locator('svg[data-om-exportable-video-with-duration-secs]').evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top};});
    await frame.locator('svg[data-om-exportable-video-with-duration-secs]').evaluate(el => el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame',{detail:{time:35,sync:true}})));
    await page.waitForTimeout(300);
    await page.screenshot({path:fileURLToPath(new URL(`playing-${width}.png`,output))});
    const embeddedGeometry=await frame.locator('svg[data-om-exportable-video-with-duration-secs]').evaluate(el=>{const r=el.getBoundingClientRect();return {bottom:r.bottom,height:innerHeight,top:r.top};});
    if(embeddedGeometry.top < -.6 || embeddedGeometry.bottom > embeddedGeometry.height + .6)throw Error('Composition is cropped');
    await button.click();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Play walkthrough');
    const mediaPaused=await frame.locator('video,audio').evaluateAll(media=>media.every(m=>m.paused));
    if(!mediaPaused)throw Error('Media continued offscreen');
    if(errors.length||failures.length)throw Error(JSON.stringify({errors,failures}));
    checks.push({width,reducedMotion:width===390,placement,media,geometry,playPause:true,offscreenPause:true,errors,failures});
    await page.close();
  }
  await writeFile(new URL(process.env.SITE_URL?'live-verification.json':'local-verification.json',output),JSON.stringify({url:base,checks},null,2)+'\n');
  console.log(JSON.stringify(checks.map(({width,geometry,playPause,offscreenPause})=>({width,geometry,playPause,offscreenPause}))));
} finally { await browser.close(); }
