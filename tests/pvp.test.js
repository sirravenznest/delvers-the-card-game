// Run with: node tests/pvp.test.js
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const P = require(path.join(A, 'pvp.js'));
const assert = require('assert');

function lcg(s) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function randDeck(r) {
  const pool = C.ALL.filter(c => c.rar <= 1);
  const d = [], cnt = {};
  while (d.length < 30) {
    const c = pool[Math.floor(r() * pool.length)];
    if ((cnt[c.name] || 0) < 3 && (c.t == 'c' || d.length > 14)) { cnt[c.name] = (cnt[c.name] || 0) + 1; d.push(c.name); }
  }
  return d;
}

// Plausible actions, legal and illegal, for the seat to move.
function candidates(G, s) {
  const o = s == 'p' ? 'e' : 'p', X = G[s], out = [];
  X.hand.forEach((c, h) => {
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

let matches = 0, actions = 0, rejected = 0, over = 0;
const wins = { p: 0, e: 0 };
for (let seed = 1; seed <= 60; seed++) {
  const r = lcg(seed * 7919);
  const dp = randDeck(r), de = randDeck(r);
  assert(P.validDeck(dp) && P.validDeck(de));
  const G = P.newMatch(seed, dp, de);
  const log = [];
  for (let step = 0; step < 4000 && !G.over; step++) {
    const s = G.turn, c = candidates(G, s);
    let done = false;
    for (let tries = 0; tries < 12 && c.length; tries++) {
      const a = c[Math.floor(r() * c.length)];
      const before = P.hash(G);
      const res = P.act(G, s, a);
      if (res.ok) { log.push([s, a]); actions++; done = true; break; }
      rejected++;
      assert.strictEqual(P.hash(G), before, 'rejected action mutated state: ' + JSON.stringify(a));
    }
    if (!done || r() < 0.12) { assert(P.act(G, s, { a: 'end' }).ok); log.push([s, { a: 'end' }]); }
  }
  matches++;
  if (G.over) { over++; wins[G.over]++; }
  const rp = P.replay({ seed, deckP: dp, deckE: de, log });
  assert(rp.ok, 'replay failed at ' + rp.at + ' ' + rp.err);
  assert.strictEqual(P.hash(rp.G), P.hash(G), 'replay diverged (seed ' + seed + ')');
}

const G = P.newMatch(1, randDeck(lcg(1)), randDeck(lcg(2)));
assert(!P.act(G, 'e', { a: 'end' }).ok, 'out-of-turn must fail');
assert(!P.act(G, 'p', { a: 'summon', h: 0, pos: 0 }).ok, 'summon on foe row must fail');
assert(!P.act(G, 'p', null).ok);
assert(!P.act(G, 'p', { a: 'nope' }).ok);
assert(!P.validDeck(Array(30).fill('Squire')), '4+ copies invalid');
assert(!P.validDeck(['Nope']));
const [a, b] = P.elo(1000, 1000, 1);
assert(a == 1016 && b == 984);
console.log(`OK: ${matches} matches (${over} finished: p ${wins.p}, e ${wins.e}), ${actions} actions, ${rejected} illegal actions rejected without side effects, all replays identical`);
{
  const base = C.ALL.filter(c => c.rar <= 1).slice(0, 10).flatMap(c => [c.name, c.name, c.name]);
  assert.strictEqual(P.validRanked, P.validDeck, 'ranked shares the normal deck validator');
  for (let n = 20; n <= 30; n++) assert(P.validRanked(base.slice(0, n)), `${n} cards allowed`);
  assert(!P.validRanked(base.slice(0, 19)), 'fewer than 20 cards invalid');
  assert(!P.validRanked([...base, base[0]]), 'more than 30 cards invalid');
  const leg = C.ALL.find(c => c.rar == 3).name, rare = C.ALL.find(c => c.rar == 2).name;
  for (const card of [base[0], rare, leg]) {
    const rest = base.filter(name => name != card).slice(0, 17);
    assert(P.validRanked([...rest, card, card, card]), 'three copies allowed at any rarity');
    assert(!P.validRanked([...rest, card, card, card, card]), 'four copies invalid at any rarity');
  }
  assert(!P.validRanked([...base.slice(1), 'Unknown card']), 'unknown card invalid');
  for (const invalid of [null, {}, 'deck']) assert(!P.validRanked(invalid));
  console.log('PASS ranked deck format');
}
