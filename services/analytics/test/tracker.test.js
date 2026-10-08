import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const source=await readFile(new URL('../public/tracker.js',import.meta.url),'utf8');
function run(overrides={}) {
 const sent=[],listeners={};
 class Element {closest(){return {dataset:{analytics:'download_click'}};}}
 const document={currentScript:{dataset:{site:'flowmaster',paths:'/,/download',endpoint:'https://analytics.example/api/events',campaigns:'launch'}},referrer:'https://example.com/private?email=secret',visibilityState:'visible',addEventListener:(name,fn)=>{listeners[name]=fn;}};
 const context={document,navigator:{userAgent:'Chrome'},location:{pathname:'/download/',href:'https://flowmaster.live/download/?token=private&utm_campaign=launch'},crypto:{randomUUID},URL,AbortSignal,Element,fetch:(_url,request)=>{sent.push(JSON.parse(request.body));return Promise.reject(new Error('collector offline'));},...overrides};
 vm.runInNewContext(source,context);
 return {sent,listeners,Element,document};
}
test('tracker sends one view and marked click without collecting URL secrets or referrer paths', async()=>{
 const {sent,listeners,Element}=run();listeners.visibilitychange();listeners.click({target:new Element()});
 assert.deepEqual(sent.map(e=>e.kind),['page_view','download_click']);
 assert.equal(sent[0].path,'/download');assert.equal(sent[0].referrer,'example.com');assert.equal(sent[0].campaign,'launch');
 assert(!JSON.stringify(sent).includes('private'));assert.notEqual(sent[0].id,sent[1].id);
 // Rejected fetch promises are handled; tracking cannot break the page on outages.
 await new Promise(resolve=>setImmediate(resolve));
});
test('tracker exits before requests for privacy opt-out and private paths',()=>{
 assert.equal(run({navigator:{globalPrivacyControl:true}}).sent.length,0);
 assert.equal(run({navigator:{doNotTrack:'1'}}).sent.length,0);
 assert.equal(run({location:{pathname:'/account',href:'https://flowmaster.live/account'}}).sent.length,0);
});
