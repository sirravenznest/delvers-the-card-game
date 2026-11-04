// Multiplayer balance for the starter decks: round robin against each other, the old starting deck, and random Common/Uncommon decks.
// Run with: node tests/starters.js [gamesPerSeat]
const path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js'));
const P = require(path.join(A, 'pvp.js'));
const assert = require('assert');
const { lcg, deckFor, play } = require('./bot.js');
const N = Number(process.argv[2] || 150);

const OLD = { Squire: 3, 'Town Guard': 3, 'Tusk Raider': 2, Pikeman: 2, Apprentice: 2, Skeleton: 2, Acolyte: 2, Cutpurse: 2, 'Goblin Skulker': 2, Woodsman: 2, Hunter: 2, 'Dire Wolf': 2, 'Giant Rat': 2, Zombie: 1, 'Dwarf Fighter': 1, Ogre: 1, 'Magic Missile': 2, 'Cure Light Wounds': 2, Bless: 1, 'Burning Hands': 1, Dagger: 2, Spear: 1, Shield: 2, 'Leather Armor': 1, 'Potion of Healing': 1 };
const oldDeck = Object.entries(OLD).flatMap(([n, k]) => Array(k).fill(n)).sort((a, b) => (C.BN[a].t == 'c' ? 0 : 1) - (C.BN[b].t == 'c' ? 0 : 1)).slice(0, 30);

// Win rate of deck a against deck b, over both seats.
function vs(a, b, n) {
  let w = 0, g = 0;
  for (let i = 0; i < n; i++) {
    const s1 = play(1000 + i, a, b), s2 = play(5000 + i, b, a);
    g += 2; if (s1.over == 'p') w++; if (s2.over == 'e') w++;
    assert(s1.over && s2.over, 'match finished');
  }
  return w / g;
}
const pct = x => (100 * x).toFixed(1) + '%';
for (const d of C.STARTERS) assert(P.validRanked(d.list), d.name + ' is ranked-legal');
const S = C.STARTERS, res = {};
let ok = true;
for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
  const r = vs(S[i].list, S[j].list, N); res[S[i].id + '>' + S[j].id] = r;
  console.log(`${S[i].name} vs ${S[j].name}: ${pct(r)}`);
  if (r < .4 || r > .6) { ok = false; console.log('  OUT OF BAND'); }
}
for (const d of S) {
  const o = vs(d.list, oldDeck, N);
  let rw = 0, rg = 0;
  for (let k = 0; k < N; k++) { const r = deckFor(lcg(90 + k), 1); const a = play(300 + k, d.list, r), b = play(700 + k, r, d.list); rg += 2; if (a.over == 'p') rw++; if (b.over == 'e') rw++; }
  console.log(`${d.name}: vs old starting deck ${pct(o)}, vs random Common/Uncommon decks ${pct(rw / rg)}`);
  if (o < .5 || rw / rg < .4) { ok = false; console.log('  OUT OF BAND'); }
}
console.log(ok ? 'PASS starter decks balanced in multiplayer rules' : 'FAIL starter decks out of balance');
process.exit(ok ? 0 : 1);
