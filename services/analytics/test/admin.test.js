import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdmin } from '../lib/admin.js';
test('reports require a verified administrator checked against the auth service', async () => {
  const original = global.fetch;
  process.env.ADMIN_EMAILS='owner@example.com';
  process.env.SUPABASE_URL='https://wwuafjftlttmkvhzgtxh.supabase.co';
  process.env.SUPABASE_PUBLIC_KEY='public';
  const req={headers:{authorization:'Bearer test-session'}};
  try {
    global.fetch=async()=>Response.json({email:'owner@example.com',email_confirmed_at:null});
    assert.equal(await isAdmin(req),false);
    global.fetch=async()=>Response.json({email:'visitor@example.com',email_confirmed_at:'2026-10-01'});
    assert.equal(await isAdmin(req),false);
    global.fetch=async()=>Response.json({email:'OWNER@example.com',email_confirmed_at:'2026-10-01'});
    assert.equal(await isAdmin(req),true);
    global.fetch=async()=>new Response('invalid',{status:401});
    assert.equal(await isAdmin(req),false);
    global.fetch=async()=>{throw new Error('offline');};
    assert.equal(await isAdmin(req),false);
  } finally {global.fetch=original;}
});
