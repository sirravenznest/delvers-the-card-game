const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
const {play}=require('./bot.js');
const legends=[
 {name:'Sister Cera, Last Candle',starter:0,replace:'Squire',old:{hp:1,kw:'heal'}},
 {name:'Nim, Gatemarket Guide',starter:2,replace:'Cat Burglar',old:{hp:1,kw:'back'}}
];
function version(card,old,run){
 const current={...card};
 try{delete card.k2;Object.assign(card,old);return run()}finally{for(const key of Object.keys(card))delete card[key];Object.assign(card,current)}
}
test('paired-seat power comparison for one and three cheap Legendary copies',()=>{
 for(const legend of legends)for(const copies of [1,3]){
  const card=C.BN[legend.name],deck=C.STARTERS[legend.starter].list.slice();
  for(let i=0;i<copies;i++)deck[deck.indexOf(legend.replace)]=legend.name;
  let wins=0,oldWins=0,games=0;
  for(const opponent of C.STARTERS)for(let seed=1;seed<=100;seed++)for(const seat of ['p','e']){
   const run=()=>seat==='p'?play(seed,deck,opponent.list):play(seed,opponent.list,deck);
   const updated=run(),original=version(card,legend.old,run);
   assert(updated.over&&original.over,'both versions finish');
   wins+=updated.over===seat;oldWins+=original.over===seat;games++;
  }
  const gain=(wins-oldWins)/games;
  console.log(`${legend.name} x${copies}: ${wins}/${games} vs old ${oldWins}/${games}; ${(gain*100).toFixed(1)}pp (paired fixed-seed heuristic sample, not optimal play)`);
  assert(gain>=-.02,legend.name+' should not materially regress in the sampled matchups');
  assert(gain<.15,legend.name+' should not cause a 15pp or greater swing');
 }
});
test('existing removal still answers both cheap legends',()=>{
 for(const legend of legends){
  const u=E.mk(C.BN[legend.name]),g={b:Array(C.NT).fill(null),log:[],p:{hp:20,mx:20},e:{hp:20,mx:20},turn:'p',rs:9};
  u.o='e';g.b[0]=u;E.use(g);E.cast('p',C.BN.Disintegrate,{side:'e',c:u});
  assert.equal(g.b[0],null);
 }
});
