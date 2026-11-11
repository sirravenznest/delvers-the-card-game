const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
const P=require('../app/src/main/assets/pvp.js');
const D=require('../app/src/main/assets/dice.js');
const deck=C.STARTERS[0].list;

assert.deepEqual(D.clean(null),{dice:[],die:'classic'});
assert.deepEqual(D.clean({dice:['emberheart','emberheart','fake'],die:'starless'}),{dice:['emberheart'],die:'classic'});
assert.equal(D.valid('__proto__'),'classic');
for(const d of D.CATALOG.filter(d=>d.price)){
 const s={gold:d.price,cosmetics:D.clean(null)};
 assert.throws(()=>D.equip(s,d.id),/Unlock/);
 D.buy(s,d.id);assert.equal(s.gold,0);assert.equal(s.cosmetics.die,d.id);
 assert.deepEqual(D.clean(JSON.parse(JSON.stringify(s.cosmetics))),s.cosmetics);
 const before=JSON.stringify(s);
 assert.throws(()=>D.buy(s,d.id),/already/);assert.equal(JSON.stringify(s),before);
 D.equip(s,'classic');D.equip(s,d.id);
 const poor={gold:d.price-1,cosmetics:D.clean(null)},snapshot=JSON.stringify(poor);
 assert.throws(()=>D.buy(poor,d.id),/gold/);assert.equal(JSON.stringify(poor),snapshot);
}
{
 const g={log:[],turn:'p'},values=[.45,.45,0,.95],original=Math.random;
 E.use(g);Math.random=()=>{assert(values.length,'roll consumes only the required numbers');return values.shift()};
 try{
  assert.deepEqual(E.rollFirst(),{rounds:[{p:10,e:10},{p:1,e:20}],winner:'e',rolled:{p:false,e:false}});
  assert.equal(values.length,0);assert(g.history.some(h=>/tie; reroll/.test(h.text)));
 }finally{Math.random=original}
}
const faces={p:Array(20).fill(0),e:Array(20).fill(0)},wins={p:0,e:0};
let ties=0;
for(let seed=1;seed<=10000;seed++){
 const g=P.newMatch(seed,deck,deck),r=g.opening,first=r.winner,second=first==='p'?'e':'p';
 const last=r.rounds.at(-1);assert.notEqual(last.p,last.e);assert.equal(first,last.p>last.e?'p':'e');
 for(const round of r.rounds)for(const s of ['p','e']){assert(round[s]>=1&&round[s]<=20);faces[s][round[s]-1]++}
 for(const round of r.rounds.slice(0,-1)){assert.equal(round.p,round.e);ties++}
 wins[first]++;assert.equal(g.turn,first);assert.equal(g[first].mp,1);assert.equal(g[second].mp,0);
 assert.equal(g[first].hand.length,4);assert.equal(g[second].hand.length,4);
 if(seed<=100){
  const again=P.newMatch(seed,deck,deck,{looksP:deck.map(()=>({foil:'foil'}))});
  assert.equal(P.hash(g),P.hash(again),'cosmetics never alter the opening roll or game RNG');
  assert(P.act(g,first,{a:'end'}).ok);assert.equal(g[second].hand.length,5);assert.equal(g[second].mp,1);
 }
}
assert(wins.p>4800&&wins.p<5200,JSON.stringify(wins));
assert(ties>400&&ties<650,'ties appear at the expected approximate 5% rate');
for(const s of ['p','e'])for(const n of faces[s])assert(n>420&&n<640,'each d20 face remains uniformly sampled');
for(const order of [['p','e'],['e','p']]){
 const g=P.newMatch(91,deck,deck,{manualRoll:true}),before=P.hash(g),n=g.n;
 assert(!P.act(g,g.turn,{a:'end'}).ok);assert.equal(P.hash(g),before);
 assert(P.act(g,order[0],{a:'roll'}).ok);assert(!P.act(g,order[0],{a:'roll'}).ok);
 assert(!P.act(g,g.turn,{a:'end'}).ok);assert(P.act(g,order[1],{a:'roll'}).ok);
 assert.equal(g.n,n,'independent roll acknowledgements cannot collide with numbered gameplay actions');
 assert(P.act(g,g.turn,{a:'end'}).ok);
 const replay=P.replay({seed:91,deckP:deck,deckE:deck,manualRoll:true,rolls:{p:true,e:true},log:[[g.second==='p'?'e':'p',{a:'end'}]]});
 assert(replay.ok);assert.equal(P.hash(replay.G),P.hash(g));
}
console.log('PASS gold-only dice, migration, ownership, seeded d20 fairness, tie rerolls, both first seats, second-player card, manual rolls and deterministic replay',wins);
