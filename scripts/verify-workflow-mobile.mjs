import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
const {chromium,webkit,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.SITE_URL || 'http://127.0.0.1:4342/';
const out='outputs/2026-10-07-mobile-loading';
await mkdir(out,{recursive:true});
const results=[];
for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
 if(process.env.ENGINE && process.env.ENGINE!==name) continue;
 const browser=await engine.launch({headless:true});
 try {
  for(const scenario of ['normal','no-preload','music-failed','video-stalled','runtime-failed']) {
   if(process.env.SCENARIO && process.env.SCENARIO!==scenario) continue;
   const page=await browser.newPage({...devices['iPhone 13'],reducedMotion:'reduce'});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__mediaTapCalls=[];
    const dispatch=EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent=function(event){
     if(event.type!=='flowmaster:playback') return dispatch.call(this,event);
     window.__inTap=true;
     try{return dispatch.call(this,event);}finally{window.__inTap=false;}
    };
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
     window.__mediaTapCalls.push({tag:this.tagName,inTap:!!(window.__inTap || window.parent.__inTap)});
     return play.call(this);
    };
   });
   let release;
   const held=new Promise(resolve=>release=resolve);
   if(scenario==='no-preload' || scenario==='video-stalled') await page.route('**/uploads/**',async route=>{
    await held;try{await route.continue();}catch{}
   });
   if(scenario==='music-failed') await page.route('**/space-rent-aac.m4a',route=>route.abort());
   if(scenario==='runtime-failed') await page.route('**/support.js',route=>route.abort());
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.locator('#workflow-demo').scrollIntoViewIfNeeded();
   const button=page.locator('[data-workflow-play]');
   await page.waitForFunction(()=>!document.querySelector('[data-workflow-play]').disabled,null,{timeout:30000});
   if(scenario==='runtime-failed') {
    assert.equal(await button.textContent(),'Retry walkthrough');
    await page.unroute('**/support.js');await button.click();
    await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Play walkthrough').catch(async error=>{console.log({scenario,button:await button.textContent(),errors,frames:page.frames().map(f=>f.url())});throw error;});
    results.push({engine:name,scenario,retryRecovered:true,errors});await page.close();continue;
   }
   assert.equal(await button.textContent(),'Play walkthrough');
   const frame=page.frames().find(f=>f.url().includes('/demos/flowmaster-ux-story/'));
   assert.equal(await frame.locator('video,audio').evaluateAll(els=>els.every(v=>v.paused)),true);
   if(scenario==='no-preload') assert.equal(await frame.locator('video').evaluate(v=>v.readyState),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await button.click();
   if(scenario==='no-preload') release();
   if(scenario==='video-stalled') {
    await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Retry walkthrough',null,{timeout:17000});
    release();await page.unroute('**/uploads/**');await button.click();
    await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Play walkthrough').catch(async error=>{console.log({scenario,button:await button.textContent(),errors,frames:page.frames().map(f=>f.url())});throw error;});
    await button.click();
   }
   await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Pause walkthrough');
   // Seek into the scene that contains actual footage, then observe its clock.
   const activeFrame=page.frames().find(f=>f.url().includes('/demos/flowmaster-ux-story/'));
   await activeFrame.waitForFunction(()=>document.querySelector('video')?.readyState>=2,null,{timeout:15000});
   await activeFrame.locator('svg[data-om-exportable-video-with-duration-secs]').evaluate(el=>el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame',{detail:{time:22,sync:true}})));
   // The seek protocol pauses the timeline; resume through the real control.
   await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Play walkthrough');
   await button.click();
   await activeFrame.waitForFunction(()=>[...document.querySelectorAll('video')].some(v=>!v.paused && v.currentTime>0));
   const first=await activeFrame.locator('video').first().evaluate(v=>v.currentTime);
   await page.waitForTimeout(800);
   const second=await activeFrame.locator('video').first().evaluate(v=>v.currentTime);
   assert.ok(second>first+.1,`Footage not moving: ${first} → ${second}`);
   const gesture=await activeFrame.evaluate(()=>window.__mediaTapCalls.some(c=>c.inTap));
   assert.equal(gesture,true,'Media did not start in the click stack');
   await page.screenshot({path:`${out}/${process.env.SITE_URL?'live':'local'}-${name}-${scenario}.png`});
   await page.locator('footer').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('[data-workflow-play]').textContent==='Play walkthrough');
   await activeFrame.waitForFunction(()=>[...document.querySelectorAll('video,audio')].every(v=>v.paused));
   assert.deepEqual(errors,[]);
   results.push({engine:name,scenario,playableBeforeFullDownload:true,footageTimes:[first,second],gesturePreserved:gesture,offscreenPause:true,errors});
   console.log(`${name}: ${scenario} passed`);
   release();await page.close();
  }
 } finally {await browser.close();}
}
await writeFile(`${out}/${process.env.SITE_URL?'live':'local'}-verification.json`,JSON.stringify({url:base,realIOSDevice:false,results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
