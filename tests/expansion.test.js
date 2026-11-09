const test = require('node:test');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const C = require('../app/src/main/assets/cards.js');
const E = require('../app/src/main/assets/engine.js');
const P = require('../app/src/main/assets/pvp.js');
const {play} = require('./bot.js');

const names = [
  'Sister Cera, Last Candle', 'Nim, Gatemarket Guide', 'Ashen Road Escort',
  'Hollow Seal Scribe', 'Gloamwood Lookout', 'Rustfang Runner',
  'Emberwatch Vigil', 'Deep Anvil Charm'
];
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const state = seed => ({
  p:{hp:15,mx:20,mp:10,max:10,hand:[],deck:[E.mk(C.BN.Squire)]},
  e:{hp:20,mx:20,mp:10,max:10,hand:[],deck:[E.mk(C.BN.Squire)]},
  b:Array(C.NT).fill(null), log:[], turn:'p', rs:seed
});
function put(G, name, side, i, changes = {}) {
  const u = Object.assign(E.mk(C.BN[name]), {o:side}, changes);
  G.b[i] = u;
  return u;
}
function substitute(deck, old, name, count = 1) {
  const result = deck.slice();
  for (let i = 0; i < count; i++) {
    const at = result.indexOf(old);
    assert(at >= 0, old);
    result[at] = name;
  }
  return result;
}

test('122 unique cards; all 114 original names, definitions and starters unchanged', () => {
  assert.equal(C.ALL.length, 122);
  assert.equal(new Set(C.ALL.map(c => c.name)).size, 122);
  const original = C.ALL.filter(c => !names.includes(c.name));
  assert.equal(original.length, 114);
  assert.equal(hash(original), '5e89728a85c8aae7991aab90e9c511de20987bbfb00aaad909f62f0dc55a1232');
  assert.equal(hash(C.STARTERS), 'c7157046c97998ce636d1999f6ad1ef96610bc349b8b4c3186a388e317432b2a');
  const added = names.map(n => C.BN[n]);
  assert.deepEqual(['c','s','i'].map(t => added.filter(c => c.t == t).length), [6,1,1]);
  assert.equal(added.filter(c => c.rar == 3 && c.t == 'c' && c.cost >= 1 && c.cost <= 2).length, 2);
  assert.deepEqual(added.filter(c => c.t == 'c' && c.rar < 3).map(c => c.cls).sort(), ['F','R','T','W']);
  for (const c of C.ALL) {
    assert.equal(C.BN[c.name], c);
    assert(Number.isInteger(c.rar) && c.rar >= 0 && c.rar <= 3);
    assert(Number.isInteger(c.cost) && c.cost >= 0 && c.cost <= 10);
    assert(C.CL[c.cls]);
    if (c.t == 'c') {
      assert(c.hp > 0 && c.atk >= 0 && c.init > 0 && c.rch > 0);
      assert(!c.kw || C.KW[c.kw], c.name);
      assert.equal(c.ct, C.CTYPE[c.cls]);
    }
  }
});

test('new cards share normal three-copy limits in ranked and replay identical legal actions', () => {
  for (const name of names) {
    const c = C.BN[name], cap = 3;
    const deck = substitute(C.STARTERS[0].list, 'Squire', name, cap);
    assert(P.validRanked(deck), name);
    const illegal = deck.slice();
    illegal[illegal.indexOf('Town Guard')] = name;
    assert(!P.validRanked(illegal), name + ' copy cap');
    function run() {
      const G = P.newMatch(71, deck, C.STARTERS[1].list);
      G.p.hand = [E.mk(c)];
      G.p.mp = 10;
      if (c.t == 'c') {
        assert(P.act(G, 'p', {a:'summon',h:0,pos:16}).ok);
        assert.equal(G.b[16].ready, c.kw == 'haste');
        assert.equal(G.b[16].mv, c.kw == 'haste' ? c.init : 0);
      } else {
        if (c.tg == 'allyC') put(G, 'Squire', 'p', 16);
        assert(P.act(G, 'p', {a:'cast',h:0,...(c.tg == 'none' ? {} : {t:{side:'p',i:16}})}).ok);
      }
      assert.equal(G.p.mp, 10 - c.cost);
      assert.equal(G.p.hand.length, 0);
      return G;
    }
    assert.deepEqual(run(), run(), name + ' seeded determinism');
  }
});

test('Vigil heals only allies, Charm consumes the magic-item slot, Cera heals without offense', () => {
  const G = state(9);
  E.use(G);
  const a = put(G, 'Ashen Road Escort', 'p', 16, {hp:1});
  const b = put(G, 'Squire', 'p', 17, {hp:1});
  const enemy = put(G, 'Ashen Road Escort', 'e', 0, {hp:1});
  E.cast('p', C.BN['Emberwatch Vigil'], null);
  assert.equal(G.p.hp, 17);
  assert.equal(a.hp, 3);
  assert.equal(b.hp, 2);
  assert.equal(enemy.hp, 1);
  E.cast('p', C.BN['Deep Anvil Charm'], {side:'p',c:a});
  assert.equal(a.hp, 4);
  assert.equal(a.mhp, 5);
  assert.equal(a.save, C.BN['Ashen Road Escort'].save - 2);
  assert.equal(a.sI, 1);
  assert(!E.ok('allyC', 'p', {side:'p',c:a}, C.BN['Amulet of Health']));
  assert(E.ok('allyC', 'p', {side:'p',c:a}, C.BN.Dagger));
  const cera = put(G, names[0], 'p', 18);
  E.startTurn('p');
  assert.equal(G.p.hp, 18);
  E.attack('p', cera, {side:'e',c:null});
  assert.equal(G.e.hp, 20, 'Cera has no unassisted combat damage');
});

test('low-cost legends retain damage/removal tradeoffs across 2000 fixed combat seeds', () => {
  let nimDamage = 0, burglarDamage = 0, nimDeaths = 0, burglarDeaths = 0;
  for (let seed = 1; seed <= 2000; seed++) {
    for (const name of [names[1], 'Cat Burglar']) {
      const G = state(seed);
      E.use(G);
      const a = put(G, name, 'p', 16);
      const target = put(G, 'Squire', 'e', 12, {hp:30,mhp:30,atk:0});
      E.attack('p', a, {side:'e',c:target});
      if (name == names[1]) nimDamage += 30 - target.hp;
      else burglarDamage += 30 - target.hp;
      const H = state(seed);
      E.use(H);
      const hunter = put(H, 'Hunter', 'e', 12);
      const victim = put(H, name, 'p', 16);
      E.attack('e', hunter, {side:'p',c:victim});
      if (name == names[1]) nimDeaths += victim.hp <= 0;
      else burglarDeaths += victim.hp <= 0;
    }
    const G = state(seed);
    E.use(G);
    const cera = put(G, names[0], 'e', 0);
    E.cast('p', C.BN['Magic Missile'], {side:'e',c:cera});
    assert(cera.hp <= 0, 'even a successful save cannot protect one-health Cera');
  }
  assert(nimDamage > burglarDamage, 'Nim buys accuracy');
  assert(nimDeaths > burglarDeaths, 'Nim pays with worse Guard');
  assert(C.BN[names[1]].save > C.BN['Cat Burglar'].save, 'and a worse save');
  assert(C.BN[names[0]].hp < C.BN.Acolyte.hp);
  console.log('legend combat samples:', {nimDamage,burglarDamage,nimDeaths,burglarDeaths});
});

test('paired-seat starter substitutions: no new card causes a gross heuristic win-rate swing', () => {
  const cases = [
    [0,'Squire',names[0]], [2,'Cat Burglar',names[1]],
    [0,'Pikeman',names[2]], [1,'Evoker',names[3]],
    [2,'Elven Ranger',names[4]], [2,'Goblin Skulker',names[5]],
    [1,'Smite',names[6]], [0,'Tower Shield',names[7]]
  ];
  // Broad regression bounds, not evidence of statistical balance or optimal deck strength.
  const samples = 40;
  for (const [starter, old, name] of cases) {
    const base = C.STARTERS[starter].list;
    const deck = substitute(base, old, name);
    assert(P.validRanked(deck), name);
    assert.deepEqual(play(224, deck, C.STARTERS[0].list), play(224, deck, C.STARTERS[0].list), name + ' full-match determinism');
    let wins = 0, baseline = 0, games = 0;
    for (const opponent of C.STARTERS) {
      for (let seed = 1; seed <= samples; seed++) {
        for (const seat of ['p','e']) {
          const run = d => seat == 'p' ? play(seed, d, opponent.list) : play(seed, opponent.list, d);
          const G = run(deck), H = run(base);
          assert(G.over && H.over, name + ' games finish');
          wins += G.over == seat;
          baseline += H.over == seat;
          games++;
        }
      }
    }
    const swing = (wins - baseline) / games;
    assert(Math.abs(swing) < .15, name + ' gross win-rate swing: ' + swing);
    console.log(`${name}: ${wins}/${games} wins; baseline ${baseline}/${games}; delta ${(100*swing).toFixed(1)}pp`);
  }
});
