import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { appEvent,webEvent } from '../lib/events.js';
import { bearer } from '../lib/http.js';
const config = { flowmaster:{ origins:['https://flowmaster.live'], paths:['/','/download'], campaigns:['launch'] } };
const event = () => ({id:randomUUID(),site:'flowmaster',kind:'page_view',path:'/',device:'desktop',referrer:'google.com'});

test('rejects private routes, URL queries and foreign origins before storage', () => {
  for (const path of ['/account','/invite/secret','/?token=secret','//evil.example','/%61ccount']) assert.throws(() => webEvent({...event(),path},'https://flowmaster.live',config));
  for (const origin of ['https://flowmaster.live.evil.example','https://evil.example','null',undefined]) assert.throws(() => webEvent(event(),origin,config));
});
test('website inputs cannot forge app events or persist arbitrary metadata', () => {
  assert.throws(() => webEvent({...event(),kind:'app_launch'},'https://flowmaster.live',config));
  const result = webEvent({...event(),email:'private@example.com',campaign:'unapproved'},'https://flowmaster.live',config);
  assert.equal(result.email,undefined); assert.equal(result.campaign,'');
  assert.throws(() => webEvent({...event(),referrer:'https://example.com/?email=private'},'https://flowmaster.live',config));
});
test('app events enforce identities, dates and bounded object details', () => {
  const input={id:randomUUID(),activity_type:'clip_exported',created_at:new Date().toISOString(),details:{format:'mp4'}};
  assert.equal(appEvent(input).user_id,null);
  for (const details of [[],null,'text',{text:'x'.repeat(17000)}]) assert.throws(() => appEvent({...input,details}));
  assert.throws(() => appEvent({...input,user_id:'not-an-account'}));
  assert.throws(() => appEvent({...input,created_at:'2099-01-01'}));
});
test('secret checks fail closed, including equal-length unicode input', () => {
  const secret='a'.repeat(64);
  assert.equal(bearer({headers:{authorization:`Bearer ${secret}`}},secret),true);
  assert.equal(bearer({headers:{authorization:`Bearer ${'é'.repeat(64)}`}},secret),false);
  assert.equal(bearer({headers:{}},''),false);
});
