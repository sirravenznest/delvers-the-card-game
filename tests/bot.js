// Shared heuristic bot for balance tests: summon, cast, advance, attack.
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const E = require(path.join(A, 'engine.js'));
const P = require(path.join(A, 'pvp.js'));
const { ROWS, NT } = C;
const row = i => Math.floor(i / C.COLS), dist = (a, b) => Math.abs(row(a) - row(b)) + Math.abs(a % C.COLS - b % C.COLS);

function lcg(s) { return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function deckFor(r, maxRar) {
  const pool = C.ALL.filter(c => c.rar <= maxRar), d = [], cnt = {};
  while (d.length < 30) {
    const c = pool[Math.floor(r() * pool.length)];
    const lim = c.rar >= 3 ? 1 : c.rar == 2 ? 2 : 3;
    if ((cnt[c.name] || 0) < lim && (c.t == 'c' || d.length > 15)) { cnt[c.name] = (cnt[c.name] || 0) + 1; d.push(c.name); }
  }
  return d;
}

// Sensible heuristic player: summon, cast, advance, attack.
function turn(G, s) {
  const o = s == 'p' ? 'e' : 'p', X = G[s], enemyRow = s == 'p' ? 0 : ROWS - 1;
  const act = a => P.act(G, s, a).ok;
  const mine = () => G.b.map((u, i) => u && u.o == s ? [u, i] : null).filter(Boolean);
  const foes = () => G.b.map((u, i) => u && u.o == o ? [u, i] : null).filter(Boolean);
  for (let guard = 0; guard < 60 && !G.over; guard++) {
    let did = false;
    const hand = X.hand.map((c, h) => [c, h]).filter(([c]) => c.cost <= X.mp).sort((a, b) => b[0].cost - a[0].cost);
    for (const [c, h] of hand) {
      if (c.t == 'c') { const f = P.HOME[s].find(q => !G.b[q]); if (f !== undefined && act({ a: 'summon', h, pos: f })) { did = true; break; } continue; }
      let ok = false;
      if (c.kind == 'aoe') { if (foes().length >= 2) ok = act({ a: 'cast', h }); }
      else if (E.AREA[c.kind]) {
        const sc = foes().map(([u, i]) => [E.hits(s, c, u).reduce((m, [x, n]) => m + Math.min(n, x.hp), 0), i]).sort((a, b) => b[0] - a[0])[0];
        ok = sc ? sc[0] >= c.n && act({ a: 'cast', h, t: { side: o, i: sc[1] } }) : act({ a: 'cast', h, t: { side: o, i: null } });
      }
      else if (c.kind == 'dmg') {
        const k = foes().find(([u]) => u.hp <= c.n) || foes().sort((a, b) => b[0].atk - a[0].atk)[0];
        ok = k ? act({ a: 'cast', h, t: { side: o, i: k[1] } }) : (c.tg == 'any' && act({ a: 'cast', h, t: { side: o, i: null } }));
      } else if (c.kind == 'heal') {
        const hurt = mine().find(([u]) => u.hp < u.mhp - 2);
        if (X.hp <= X.mx - 5) ok = act({ a: 'cast', h, t: { side: s, i: null } }); else if (hurt) ok = act({ a: 'cast', h, t: { side: s, i: hurt[1] } });
      } else if (c.kind == 'sleep') { const k = foes().filter(([u]) => !C.imm(u)).sort((a, b) => b[0].atk - a[0].atk)[0]; if (k) ok = act({ a: 'cast', h, t: { side: o, i: k[1] } }); }
      else if (c.kind == 'haste') { const k = mine().find(([u]) => !u.ready && u.fresh); if (k) ok = act({ a: 'cast', h, t: { side: s, i: k[1] } }); }
      else { const k = mine().filter(([u]) => c.kind != 'gear' || !c.slot || !u['s' + c.slot]).sort((a, b) => b[0].atk - a[0].atk)[0]; if (k) ok = act({ a: 'cast', h, t: { side: s, i: k[1] } }); }
      if (ok) { did = true; break; }
    }
    if (did) continue;
    for (const [u, i] of mine()) {
      if (!u.ready) continue;
      const reachHero = s == 'p' ? row(i) < u.rch : ROWS - 1 - row(i) < u.rch;
      if (reachHero && act({ a: 'attack', from: i, t: { side: o, i: null } })) { did = true; break; }
      const t = foes().filter(([, j]) => dist(i, j) <= u.rch).sort((a, b) => a[0].hp - b[0].hp)[0];
      if (t && act({ a: 'attack', from: i, t: { side: o, i: t[1] } })) { did = true; break; }
    }
    if (did) continue;
    for (const [u, i] of mine()) {
      if (u.mv <= 0) continue;
      let best = null;
      for (let j = 0; j < NT; j++) if (!G.b[j] && dist(i, j) <= u.mv) {
        const sc = Math.abs(row(j) - enemyRow) - u.rch;
        if (!best || sc < best.sc) best = { j, sc };
      }
      if (best && best.sc < Math.abs(row(i) - enemyRow) - u.rch && act({ a: 'move', from: i, to: best.j })) { did = true; break; }
    }
    if (!did) break;
  }
  if (!G.over) act({ a: 'end' });
}

function play(seed, dp, de) {
  const G = P.newMatch(seed, dp, de);
  for (let t = 0; t < 400 && !G.over; t++) turn(G, G.turn);
  return G;
}

module.exports = { lcg, deckFor, turn, play };
