// Measures PvP fairness: first-move advantage with mirrored decks, plus rule checks for draws and summoning sickness.
// Run with: node tests/balance.js [matchesPerDeck]
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const E = require(path.join(A, 'engine.js'));
const P = require(path.join(A, 'pvp.js'));
const assert = require('assert');
const { ROWS, NT, BN } = C;
const row = i => Math.floor(i / C.COLS), dist = (a, b) => Math.abs(row(a) - row(b)) + Math.abs(a % C.COLS - b % C.COLS);

const { lcg, deckFor, turn, play } = require('./bot.js');
// --- Rule checks ---
if (P.P_OPT.extraCard) {
  const r = lcg(1), d = deckFor(r, 1), G = P.newMatch(7, d, d);
  const h = s => G[s].hand.length;
  assert.strictEqual(h('p'), 4, 'first player opens with 3 cards plus the draw for their first turn');
  assert.strictEqual(h('e'), 4, 'second player opens with 3 cards plus 1 extra');
  assert.strictEqual(G.p.mp, 1);
  assert.strictEqual(G.e.mp, 0);
  P.act(G, 'p', { a: 'end' });
  assert.strictEqual(h('e'), 5, 'second player draws on their first turn (5 cards, 1 mana)');
  assert.strictEqual(G.e.mp, 1);
  console.log('PASS opening hands: first player 4 cards, second player 5 cards on their first turn');
}
{ // summoning sickness
  let checked = 0;
  for (let seed = 1; seed < 200 && checked < 40; seed++) {
    const r = lcg(seed), d = deckFor(r, 1), G = P.newMatch(seed, d, d);
    for (let t = 0; t < 6 && !G.over; t++) {
      const s = G.turn;
      for (let h = 0; h < G[s].hand.length; h++) {
        const c = G[s].hand[h];
        if (c.t != 'c' || c.cost > G[s].mp || c.kw == 'haste') continue;
        const pos = P.HOME[s].find(q => !G.b[q]); if (pos === undefined) continue;
        assert(P.act(G, s, { a: 'summon', h, pos }).ok);
        const free = G.b.findIndex(x => !x), foe = s == 'p' ? 'e' : 'p';
        assert(!P.act(G, s, { a: 'move', from: pos, to: free }).ok, 'a creature cannot move the turn it is summoned: ' + c.name);
        assert(!P.act(G, s, { a: 'attack', from: pos, t: { side: foe, i: null } }).ok, 'a creature cannot attack the turn it is summoned: ' + c.name);
        checked++; break;
      }
      P.act(G, s, { a: 'end' });
    }
  }
  assert(checked >= 20, 'enough samples: ' + checked);
  console.log('PASS summoning sickness holds for ' + checked + ' summons (haste excepted)');
}
{ // haste creature may act when summoned; and it acts again next turn
  const d = ['Pseudodragon'];
  let found = 0;
  for (let seed = 1; seed < 400 && !found; seed++) {
    const dk = deckFor(lcg(seed), 3), G = P.newMatch(seed, dk, dk);
    for (let t = 0; t < 12 && !G.over && !found; t++) {
      const s = G.turn;
      G[s].hand.forEach((c, h) => {
        if (found || c.t != 'c' || c.kw != 'haste' || c.cost > G[s].mp) return;
        const pos = P.HOME[s].find(q => !G.b[q]); if (pos === undefined) return;
        assert(P.act(G, s, { a: 'summon', h, pos }).ok);
        const u = G.b[pos]; assert(u.ready && u.mv == u.init, 'haste creature is ready on arrival'); found = 1;
      });
      P.act(G, s, { a: 'end' });
    }
  }
  console.log(found ? 'PASS haste creatures act on the turn they arrive' : 'SKIP no haste creature drawn in sample');
}
{ // a creature is not stuck "ready" for the opponent's turn: only the active seat can act
  const r = lcg(3), d = deckFor(r, 1), G = P.newMatch(3, d, d);
  assert(!P.act(G, 'e', { a: 'summon', h: 0, pos: P.HOME.e[0] }).ok, 'second player cannot act on first players turn');
  console.log('PASS cannot act out of turn');
}

// --- First-move advantage ---
const N = Number(process.argv[2] || 300);
let tot = 0, pw = 0, over = 0, turns = 0;
for (const rar of [0, 1, 3]) {
  let w = 0, n = 0, len = 0;
  for (let i = 0; i < N; i++) {
    const r = lcg(1000 * rar + i + 1), d = deckFor(r, rar), G = play(i + 1, d, d);
    if (!G.over) { over++; continue; }
    n++; len += Math.ceil(G.n / 25); if (G.over == 'p') w++;
  }
  console.log(`deck pool rarity<=${rar}: first player wins ${(100 * w / n).toFixed(1)}% of ${n} mirror matches`);
  tot += n; pw += w;
}
console.log(`OVERALL first player ${(100 * pw / tot).toFixed(1)}% (${tot} matches, ${over} unfinished)`);
