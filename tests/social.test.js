// Run with: node tests/social.test.js
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const P = require(path.join(A, 'pvp.js'));
const N = require(path.join(A, 'net.js'));
const SO = require(path.join(A, 'social.js'));
const { makeDb, clk } = require('./fakedb');
const assert = require('assert');

const lcg = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
function deckFor(r) {
  const pool = C.ALL.filter(c => c.rar <= 1), d = [], cnt = {};
  while (d.length < 24) { const c = pool[Math.floor(r() * pool.length)]; if ((cnt[c.name] || 0) < 3 && (c.t == 'c' || d.length > 12)) { cnt[c.name] = (cnt[c.name] || 0) + 1; d.push(c.name); } }
  return d;
}
const auth = (uid, name) => () => ({ uid, tok: uid, name });
const mk = (db, uid, name) => ({
  so: SO.create({ db: 'https://x', fetch: db.fetch, auth: auth(uid, name) }),
  net: N.create({ db: 'https://x', fetch: db.fetch, now: clk.now, auth: auth(uid, name) }),
  uid, name,
});
const rawq = (db, uid, m, p, body) => db.fetch(`https://x/${p}.json?auth=${uid}`, { method: m, body: body === undefined ? undefined : JSON.stringify(body) });

(async () => {
  const db = makeDb(), r = lcg(8);
  const ann = mk(db, 'uA', 'Ann'), bob = mk(db, 'uB', 'Bob'), cat = mk(db, 'uC', 'Cat');
  const ca = await ann.so.ensureProfile(), cb = await bob.so.ensureProfile(); await cat.so.ensureProfile();
  assert(/^[A-Z2-9]{6}$/.test(ca) && ca != cb);
  assert.strictEqual(await ann.so.ensureProfile(), ca, 'code is stable');
  console.log('PASS profiles and friend codes');

  await assert.rejects(() => ann.so.addByCode('abc'), /6 letters/);
  await assert.rejects(() => ann.so.addByCode('ZZZZZZ'), /No player/);
  await assert.rejects(() => ann.so.addByCode(ca), /your own/);
  const added = await ann.so.addByCode(cb.toLowerCase());
  assert.strictEqual(added.name, 'Bob');
  await ann.so.refresh(clk.t); await bob.so.refresh(clk.t);
  assert.strictEqual(ann.so.friends.length, 0, 'not friends until accepted'); assert.strictEqual(ann.so.outgoing.length, 1);
  assert.strictEqual(bob.so.incoming.length, 1); assert.strictEqual(bob.so.incoming[0].name, 'Ann');
  await bob.so.accept('uA');
  await ann.so.refresh(clk.t); await bob.so.refresh(clk.t);
  assert.strictEqual(ann.so.friends.length, 1); assert.strictEqual(bob.so.friends.length, 1);
  assert.strictEqual(bob.so.incoming.length, 0); assert.strictEqual(ann.so.outgoing.length, 0);
  assert(ann.so.friends[0].online, 'recently seen = online');
  clk.t += SO.ONLINE_MS + 1000; await ann.so.refresh(clk.t); assert(!ann.so.friends[0].online, 'stale presence = offline');
  console.log('PASS request, accept, mutual friendship, presence');

  await cat.so.addByCode(ca); await ann.so.refresh(clk.t); assert.strictEqual(ann.so.incoming.length, 1);
  await ann.so.decline('uC'); await ann.so.refresh(clk.t); assert.strictEqual(ann.so.incoming.length, 0);
  console.log('PASS decline');

  assert.strictEqual((await rawq(db, 'uC', 'GET', 'social/uA')).status, 401, 'others cannot read my social tree');
  assert.strictEqual((await rawq(db, 'uC', 'PUT', 'social/uA/friends/uC', { n: 'x' })).status, 401, 'cannot add myself to someone elses list');
  assert.strictEqual((await rawq(db, 'uC', 'PUT', 'invites/uA/uB', { n: 'x', d: [] })).status, 401, 'cannot forge invite from someone else');
  assert.strictEqual((await rawq(db, 'uC', 'PUT', 'invites/uA/uC', { n: 'Cat', d: deckFor(r) })).status, 401, 'non-friends cannot invite');
  assert.strictEqual((await rawq(db, 'uC', 'GET', 'invites/uA')).status, 401);
  assert.strictEqual((await rawq(db, 'uC', 'GET', 'codes')).status, 401, 'cannot list codes');
  assert.strictEqual((await rawq(db, 'uC', 'PUT', 'codes/' + ca, 'uC')).status, 401, 'cannot steal a code');
  assert.strictEqual((await rawq(db, 'uC', 'PUT', 'profiles/uA', { n: 'Hax' })).status, 401);
  console.log('PASS social access rules');

  const dA = deckFor(r), dB = deckFor(r);
  await ann.net.invite('uB', 'Bob', dA);
  await bob.so.refresh(clk.t);
  assert.strictEqual(bob.so.invites.length, 1); assert.strictEqual(bob.so.invites[0].name, 'Ann');
  await bob.net.acceptInvite('uA', dB);
  assert.strictEqual(bob.net.st, 'match'); assert.strictEqual(bob.net.ranked, false);
  for (let i = 0; i < 4 && ann.net.st != 'match'; i++) { clk.t += 1000; await ann.net.tick(); }
  assert.strictEqual(ann.net.st, 'match'); assert.strictEqual(ann.net.mid, bob.net.mid);
  assert.notStrictEqual(ann.net.seat, bob.net.seat);
  assert(!db.get('invites/uB/uA'), 'invite consumed');
  assert(!db.get('ratings/uA') && !db.get('ratings/uB'), 'friendly games book no rating');
  const nets = [ann.net, bob.net];
  await Promise.all(nets.map(n=>n.roll()));
  for(const n of nets)await n.tick();
  for (let i = 0; i < 6; i++) {
    const first = nets.find(n => n.G.turn == n.seat);
    first.act({ a: 'end' }); clk.t += 1000;
    for (const n of nets) await n.tick();
    assert.strictEqual(P.hash(ann.net.G), P.hash(bob.net.G));
  }
  bob.net.act({ a: 'resign' }); for (let i = 0; i < 4; i++) { clk.t += 1000; for (const n of nets) await n.tick(); }
  assert.strictEqual(ann.net.st, 'over'); assert.strictEqual(ann.net.over, ann.net.seat);
  assert(!db.get('ratings/uA') && !db.get('ratings/uB'), 'still no rating after a friendly game');
  console.log('PASS private invite -> friendly match, resign, no rating change');

  await ann.net.invite('uB', 'Bob', dA);
  await bob.net.declineInvite('uA');
  clk.t += 1000; await ann.net.tick();
  assert.strictEqual(ann.net.st, 'idle'); assert(/declined/.test(ann.net.err));
  await ann.net.invite('uB', 'Bob', dA);
  clk.t += 130000; await ann.net.tick();
  assert.strictEqual(ann.net.st, 'idle'); assert(/expired/.test(ann.net.err)); assert(!db.get('invites/uB/uA'));
  console.log('PASS decline and expiry');

  await assert.rejects(() => ann.net.invite('uB', 'Bob', ['Squire']), /20-30/);
  await bob.so.remove('uA');
  assert.strictEqual((await rawq(db, 'uA', 'PUT', 'invites/uB/uA', { n: 'Ann', d: dA })).status, 401, 'invites need mutual friendship');
  console.log('PASS unfriend blocks invites');
  console.log('ALL SOCIAL TESTS PASSED');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
