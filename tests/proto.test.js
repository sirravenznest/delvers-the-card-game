// Run with: node tests/proto.test.js  (clients on different rule versions must never be matched)
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const N = require(path.join(A, 'net.js'));
const SO = require(path.join(A, 'social.js'));
const { makeDb, clk } = require('./fakedb');
const assert = require('assert');
const deck = () => { const d = [], cnt = {}; for (const c of C.ALL.filter(c => c.rar <= 1)) { if (d.length >= 30) break; for (let k = 0; k < 3 && d.length < 30; k++) { d.push(c.name); } } return d; };
const auth = (uid, name) => () => ({ uid, tok: uid, name });
const mkNet = (db, uid, name) => N.create({ db: 'https://x', fetch: db.fetch, now: clk.now, auth: auth(uid, name) });
(async () => {
  assert.strictEqual(N.PROTO, 8, 'opposed opening rolls require a fresh online protocol');
  // ranked: a v2.0 queue entry is never paired
  let db = makeDb(); const a = mkNet(db, 'uA', 'Ann'), d = deck();
  await db.fetch('https://x/queue/uOld.json?auth=uOld', { method: 'PUT', body: JSON.stringify({ n: 'Old', r: 1000, d, pv: 2, t: { '.sv': 'timestamp' }, j: { '.sv': 'timestamp' } }) });
  await a.join(d); for (let i = 0; i < 4; i++) { await a.tick(); clk.t += 1000; }
  assert.strictEqual(a.st, 'queue', 'does not pair with a legacy client'); console.log('PASS ranked skips legacy-version queue entries');
  await db.fetch('https://x/queue/uV3.json?auth=uV3', { method: 'PUT', body: JSON.stringify({ n: 'Old v2.2', r: 1000, d, pv: 3, t: { '.sv': 'timestamp' }, j: { '.sv': 'timestamp' } }) });
  await a.tick(); assert.strictEqual(a.st, 'queue', 'v3 clients with the previous card set are not paired');
  console.log('PASS ranked skips previous card-set protocol');
  await db.fetch('https://x/queue/uV4.json?auth=uV4', { method: 'PUT', body: JSON.stringify({ n: 'Old ranked rules', r: 1000, d, pv: 4, t: { '.sv': 'timestamp' }, j: { '.sv': 'timestamp' } }) });
  await a.tick(); assert.strictEqual(a.st, 'queue', 'clients enforcing the old ranked restrictions are not paired');
  await db.fetch('https://x/queue/uV5.json?auth=uV5', { method: 'PUT', body: JSON.stringify({ n: 'Old cosmetic support', r: 1000, d, pv: 5, t: { '.sv': 'timestamp' }, j: { '.sv': 'timestamp' } }) });
  await a.tick(); assert.strictEqual(a.st, 'queue', 'clients without shared cosmetic appearances are not paired');
  await db.fetch('https://x/queue/uV6.json?auth=uV6', { method: 'PUT', body: JSON.stringify({ n: 'Old Legendary balance', r: 1000, d, pv: 6, t: { '.sv': 'timestamp' }, j: { '.sv': 'timestamp' } }) });
  await a.tick(); assert.strictEqual(a.st, 'queue', 'clients with the previous Legendary balance are not paired');
  await db.fetch('https://x/queue/uV7.json?auth=uV7', { method: 'PUT', body: JSON.stringify({ n: 'Old first-turn rules', r: 1000, d, pv: 7, t: { '.sv': 'timestamp' }, j: { '.sv': 'timestamp' } }) });
  await a.tick(); assert.strictEqual(a.st, 'queue', 'clients without opening d20 rolls are not paired');
  // A v2.0 client pairs with us and writes a match: we refuse it politely.
  await db.fetch('https://x/queue/uA/m.json?auth=uOld', { method: 'PUT', body: JSON.stringify('mOld') });
  await db.fetch('https://x/matches/mOld/meta.json?auth=uOld', { method: 'PUT', body: JSON.stringify({ p: 'uOld', e: 'uA', seed: 1, rk: 1, tl: 75, pv: 2, deckP: d, deckE: d, r: {}, names: {} }) });
  await a.tick(); assert.strictEqual(a.st, 'over'); assert(/different version/i.test(a.err)); console.log('PASS legacy match refused with update message');
  // friends: invite from a legacy client is refused on accept
  db = makeDb(); const ann = { so: SO.create({ db: 'https://x', fetch: db.fetch, auth: auth('uA', 'Ann') }), net: mkNet(db, 'uA', 'Ann') };
  const bob = { so: SO.create({ db: 'https://x', fetch: db.fetch, auth: auth('uB', 'Bob') }), net: mkNet(db, 'uB', 'Bob') };
  await ann.so.ensureProfile(); const cb = await bob.so.ensureProfile();
  await ann.so.addByCode(cb); await bob.so.refresh(clk.t); await bob.so.accept('uA'); await ann.so.refresh(clk.t);
  await db.fetch('https://x/invites/uB/uA.json?auth=uA', { method: 'PUT', body: JSON.stringify({ n: 'Ann', d: d.slice(0, 24), pv: 2, t: { '.sv': 'timestamp' } }) });
  await assert.rejects(() => bob.net.acceptInvite('uA', d.slice(0, 24)), /different version/i); console.log('PASS legacy invite refused');
  // same version still works
  await ann.net.invite('uB', 'Bob', d.slice(0, 24)); await bob.net.acceptInvite('uA', d.slice(0, 24)); await ann.net.tick();
  assert.strictEqual(ann.net.st, 'match'); assert.strictEqual(bob.net.st, 'match'); console.log('PASS same-version friend duel connects');
  console.log('ALL PROTO TESTS PASSED');
})().catch(e => { console.error(e); process.exit(1); });
