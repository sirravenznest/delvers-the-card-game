// Run with: node tests/net.test.js
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const P = require(path.join(A, 'pvp.js'));
const N = require(path.join(A, 'net.js'));
const assert = require('assert');

let clock = 1_000_000;
const now = () => clock;

// Minimal Realtime Database REST fake. Emulates: sv timestamps, immutable log entries, write-once queue/$uid/m,
// and members-only match access (the intent of database.rules.json).
function makeDb() {
  const root = {};
  const get = (p) => p.split('/').filter(Boolean).reduce((n, k) => (n == null ? n : n[k]), root);
  const stamp = (v) => {
    if (v && typeof v == 'object') {
      if (v['.sv'] == 'timestamp') return clock;
      const o = Array.isArray(v) ? [] : {};
      for (const k of Object.keys(v)) o[k] = stamp(v[k]);
      return o;
    }
    return v;
  };
  const set = (p, v) => {
    const ks = p.split('/').filter(Boolean);
    let n = root;
    for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] != 'object') n[ks[i]] = {}; n = n[ks[i]]; }
    const last = ks[ks.length - 1];
    if (v === null) delete n[last]; else n[last] = v;
  };
  function allowed(uid, method, p) {
    const ks = p.split('/').filter(Boolean);
    if (ks[0] == 'queue' && ks[1] && method != 'GET') {
      if (ks[2] == 'm') return get(p) == null;
      return ks[1] == uid && ks.length <= 2;
    }
    if (ks[0] == 'matches' && ks[1]) {
      const m = get(`matches/${ks[1]}/meta`);
      if (ks[2] == 'meta' && method != 'GET') return m == null;
      if (!m) return method == 'GET' || false;
      const member = m.p == uid || m.e == uid;
      if (!member) return false;
      if (ks[2] == 'log' && method != 'GET') return get(p) == null;
      if (ks[2] == 'res' && method != 'GET') return ks[3] == uid;
      return true;
    }
    if (ks[0] == 'ratings' && ks[1] && method != 'GET') return ks[1] == uid;
    return true;
  }
  const down = new Set();
  const fetch = async (url, opt = {}) => {
    const u = new URL(url);
    const uid = u.searchParams.get('auth');
    const R = (b, st = 200) => ({ ok: st < 400, status: st, json: async () => b });
    if (down.has(uid)) throw new Error('offline');
    const p = decodeURIComponent(u.pathname).replace(/^\//, '').replace(/\.json$/, '');
    const m = opt.method || 'GET';
    if (!allowed(uid, m, p)) return R({ error: 'Permission denied' }, 401);
    if (m == 'GET') {
      let v = get(p);
      const ob = u.searchParams.get('orderBy');
      if (v && ob == '"$key"') {
        const s = Number(JSON.parse(u.searchParams.get('startAt')));
        v = Object.fromEntries(Object.entries(v).filter(([k]) => Number(k) >= s));
      } else if (v && ob == '"r"') {
        const lim = Number(u.searchParams.get('limitToLast') || 1e9);
        v = Object.fromEntries(Object.entries(v).sort((a, b) => a[1].r - b[1].r).slice(-lim));
      }
      return R(v === undefined ? null : v);
    }
    const body = opt.body === undefined ? undefined : stamp(JSON.parse(opt.body));
    if (m == 'PUT') { set(p, body); return R(body); }
    if (m == 'PATCH') { for (const k of Object.keys(body)) set(p + '/' + k, body[k]); return R(body); }
    if (m == 'DELETE') { set(p, null); return R(null); }
    return R(null, 400);
  };
  return { root, fetch, get, down };
}

function lcg(s) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function deckFor(r) {
  const pool = C.ALL.filter(c => c.rar <= 1), d = [], cnt = {};
  while (d.length < 30) {
    const c = pool[Math.floor(r() * pool.length)];
    if ((cnt[c.name] || 0) < 3 && (c.t == 'c' || d.length > 14)) { cnt[c.name] = (cnt[c.name] || 0) + 1; d.push(c.name); }
  }
  return d;
}
function candidates(G, s) {
  const o = s == 'p' ? 'e' : 'p', out = [];
  G[s].hand.forEach((c, h) => {
    if (c.t == 'c') P.HOME[s].forEach(pos => out.push({ a: 'summon', h, pos }));
    else if (c.tg == 'none') out.push({ a: 'cast', h });
    else {
      G.b.forEach((u, i) => { if (u) out.push({ a: 'cast', h, t: { side: u.o, i } }); });
      out.push({ a: 'cast', h, t: { side: s, i: null } }, { a: 'cast', h, t: { side: o, i: null } });
    }
  });
  G.b.forEach((u, i) => {
    if (!u || u.o != s) return;
    G.b.forEach((t, j) => { if (t && t.o == o) out.push({ a: 'attack', from: i, t: { side: o, i: j } }); });
    out.push({ a: 'attack', from: i, t: { side: o, i: null } });
    for (let j = 0; j < G.b.length; j++) if (!G.b[j]) out.push({ a: 'move', from: i, to: j });
  });
  return out;
}
const mkClient = (db, uid, name) => N.create({ db: 'https://x.firebaseio.com', fetch: db.fetch, now, auth: () => ({ uid, tok: uid, name }) });

function bot(c, r) { // plays a few random legal actions then ends the turn
  const G = c.T.G, s = c.T.seat;
  if (c.T.st != 'match' || G.turn != s) return;
  const cs = candidates(G, s);
  for (let i = 0; i < 6; i++) {
    if (!cs.length || r() < .15) break;
    c.T.act(cs[Math.floor(r() * cs.length)]);
    if (c.T.st != 'match') return;
  }
  if (c.T.st == 'match' && G.turn == s) c.T.act({ a: 'end' });
}
async function step(clients, ms = 1000) { clock += ms; for (const c of clients) await c.T.tick(); }

(async () => {
  // 1. Full ranked match between two bots, matched through the queue
  {
    const db = makeDb(), r = lcg(5);
    const A_ = { T: mkClient(db, 'uA', 'Ann') }, B_ = { T: mkClient(db, 'uB', 'Bob') };
    await A_.T.join(deckFor(r)); await B_.T.join(deckFor(r));
    assert(db.get('queue/uA') && db.get('queue/uB'));
    let i = 0;
    while ((A_.T.st != 'over' || B_.T.st != 'over') && i++ < 3000) {
      await step([A_, B_]);
      bot(A_, r); bot(B_, r);
    }
    assert.strictEqual(A_.T.st, 'over'); assert.strictEqual(B_.T.st, 'over');
    assert.strictEqual(A_.T.over, B_.T.over, 'both agree on winner');
    assert.strictEqual(P.hash(A_.T.G), P.hash(B_.T.G), 'states match');
    assert(!db.get('queue/uA') && !db.get('queue/uB'), 'queue cleaned');
    await step([A_, B_]);
    const ra = db.get('ratings/uA'), rb = db.get('ratings/uB'), win = A_.T.seat == A_.T.over ? ra : rb, lose = win === ra ? rb : ra;
    assert(win.r > 1000 && lose.r < 1000 && win.w == 1 && lose.l == 1 && !win.from && !lose.from, JSON.stringify([ra, rb]));
    assert.strictEqual(win.r + lose.r, 2000, 'elo zero-sum');
    const lb = await A_.T.leaderboard(); assert(lb.length == 2 && lb[0].r > lb[1].r);
    console.log('PASS full match via queue, winner', A_.T.over, 'ratings', ra.r, rb.r, 'turns', A_.T.G.n);
  }
  // 2. Three players in queue: exactly one pair forms, no double-booking
  {
    const db = makeDb(), r = lcg(9);
    const cs = ['u1', 'u2', 'u3'].map(u => ({ T: mkClient(db, u, u) }));
    for (const c of cs) await c.T.join(deckFor(r));
    for (let i = 0; i < 6; i++) await step(cs);
    const inMatch = cs.filter(c => c.T.st == 'match'), waiting = cs.filter(c => c.T.st == 'queue');
    assert.strictEqual(inMatch.length, 2); assert.strictEqual(waiting.length, 1);
    assert.notStrictEqual(inMatch[0].T.seat, inMatch[1].T.seat);
    assert.strictEqual(inMatch[0].T.mid, inMatch[1].T.mid);
    console.log('PASS 3-player queue pairs exactly two');
  }
  // 3. Rating window: far-apart ratings wait, then match as the window widens
  {
    const db = makeDb(), r = lcg(3);
    db.root.ratings = { uH: { r: 1600, w: 0, l: 0 } };
    const a = { T: mkClient(db, 'uH', 'High') }, b = { T: mkClient(db, 'uL', 'Low') };
    await a.T.join(deckFor(r)); await b.T.join(deckFor(r));
    await step([a, b]); await step([a, b]);
    assert.strictEqual(a.T.st, 'queue', 'too far apart at first');
    for (let i = 0; i < 40 && a.T.st == 'queue'; i++) await step([a, b], 5000);
    assert.strictEqual(a.T.st, 'match'); console.log('PASS rating window widens over time');
  }
  // 4. Cheater writes an illegal action: opponent detects it and wins
  {
    const db = makeDb(), r = lcg(11);
    const a = { T: mkClient(db, 'uA', 'A') }, b = { T: mkClient(db, 'uB', 'B') };
    await a.T.join(deckFor(r)); await b.T.join(deckFor(r));
    for (let i = 0; i < 6 && (a.T.st != 'match' || b.T.st != 'match'); i++) await step([a, b]);
    const cheater = a.T.G.turn == a.T.seat ? a : b, victim = cheater === a ? b : a;
    const k = cheater.T.G.n;
    db.root.matches[cheater.T.mid].log = { [k]: { u: cheater.T.meta[cheater.T.seat], a: { a: 'cast', h: 0, t: { side: 'e', i: null } }, t: clock } };
    // a cast of a creature card or of a card not in hand must be rejected by the victim
    db.root.matches[cheater.T.mid].log[k].a = { a: 'summon', h: 99, pos: 0 };
    await step([victim]);
    assert.strictEqual(victim.T.st, 'over'); assert.strictEqual(victim.T.over, victim.T.seat); assert.strictEqual(victim.T.why, 'cheat');
    console.log('PASS illegal opponent action detected');
  }
  // 5. Opponent disconnects: timeout win, and the leaver keeps the booked loss
  {
    const db = makeDb(), r = lcg(21);
    const a = { T: mkClient(db, 'uA', 'A') }, b = { T: mkClient(db, 'uB', 'B') };
    await a.T.join(deckFor(r)); await b.T.join(deckFor(r));
    for (let i = 0; i < 6 && (a.T.st != 'match' || b.T.st != 'match'); i++) await step([a, b]);
    const first = a.T.G.turn == a.T.seat ? a : b, other = first === a ? b : a;
    db.down.add(first.T === a.T ? 'uA' : 'uB');
    await step([other], 1000);
    assert.strictEqual(other.T.st, 'match');
    await step([other], N.TURN_MS + N.GRACE_MS + 1000);
    assert.strictEqual(other.T.st, 'over'); assert.strictEqual(other.T.why, 'timeout');
    assert.strictEqual(other.T.over, other.T.seat);
    await step([other]);
    const fl = db.get('ratings/' + (first === a ? 'uA' : 'uB')), ol = db.get('ratings/' + (other === a ? 'uA' : 'uB'));
    assert(fl.r < 1000 && fl.l == 1 && fl.from, 'leaver keeps booked loss'); assert(ol.r > 1000 && ol.w == 1);
    console.log('PASS disconnect -> timeout win; leaver keeps loss');
  }
  // 6. Resign
  {
    const db = makeDb(), r = lcg(31);
    const a = { T: mkClient(db, 'uA', 'A') }, b = { T: mkClient(db, 'uB', 'B') };
    await a.T.join(deckFor(r)); await b.T.join(deckFor(r));
    for (let i = 0; i < 6 && (a.T.st != 'match' || b.T.st != 'match'); i++) await step([a, b]);
    a.T.act({ a: 'resign' });
    for (let i = 0; i < 4; i++) await step([a, b]);
    assert.strictEqual(a.T.st, 'over'); assert.strictEqual(b.T.st, 'over');
    assert.strictEqual(b.T.over, b.T.seat); assert.strictEqual(b.T.why, 'win');
    assert(db.get('ratings/uA').r < 1000 && db.get('ratings/uB').r > 1000);
    console.log('PASS resign');
  }
  // 7. Rules: outsiders can't read or write a match; log entries are immutable
  {
    const db = makeDb(), r = lcg(41);
    const a = { T: mkClient(db, 'uA', 'A') }, b = { T: mkClient(db, 'uB', 'B') };
    await a.T.join(deckFor(r)); await b.T.join(deckFor(r));
    for (let i = 0; i < 6 && (a.T.st != 'match' || b.T.st != 'match'); i++) await step([a, b]);
    const mid = a.T.mid;
    const rq = (uid, m, p, body) => db.fetch(`https://x/${p}.json?auth=${uid}`, { method: m, body: body && JSON.stringify(body) });
    assert.strictEqual((await rq('uX', 'GET', `matches/${mid}/log`)).status, 401);
    assert.strictEqual((await rq('uX', 'PUT', `matches/${mid}/log/0`, { u: 'uX' })).status, 401);
    const first = a.T.G.turn == a.T.seat ? a : b;
    first.T.act({ a: 'end' }); await step([a, b]);
    assert.strictEqual((await rq(first.T.meta.p, 'PUT', `matches/${mid}/log/0`, { u: 'x' })).status, 401, 'log immutable');
    assert.strictEqual((await rq('uA', 'PUT', `queue/uB/n`, 'evil')).status, 401, 'cannot edit others queue entry');
    assert.strictEqual((await rq('uA', 'PUT', `ratings/uB`, { r: 0 })).status, 401);
    console.log('PASS access rules');
  }
  console.log('ALL NET TESTS PASSED');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
