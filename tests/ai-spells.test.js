const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
const P=require('../app/src/main/assets/pvp.js');
const B=require('../app/src/main/assets/ranked-bots.js');
const state=s=>{const g=P.newMatch(81,Array(20).fill('Squire'),Array(20).fill('Squire'));g.turn=s;g[s].mp=2;return g};
for(const side of ['p','e']){
 for(const count of [1,5,6,7]){
  for(const tier of B.STEPS){
   const g=state(side),x=g[side];x.hand=[E.mk(C.BN['Arcane Insight']),...Array.from({length:count-1},()=>E.mk(C.BN['Red Dragon']))];
   const before=JSON.stringify(g),a=B.chooseAction(g,side,tier.skill,()=>.999);
   assert.deepEqual(a,{a:'cast',h:0},'draw before ending with '+count+' cards at '+tier.tier);
   assert.equal(JSON.stringify(g),before,'planning does not mutate live state');
   assert(P.act(g,side,a).ok);
   assert.equal(x.hand.length,Math.min(7,count+1),'casting frees one hand slot before drawing');
  }
 }
 for(const deck of [[],[E.mk(C.BN.Squire)]]){
  const g=state(side);g[side].hand=[E.mk(C.BN['Arcane Insight'])];g[side].deck=deck;g[side].hp=2;
  assert.deepEqual(B.chooseAction(g,side,5),{a:'end'},'do not draw into empty deck or fatal fatigue');
 }
 const g=state(side),x=g[side],u=E.mk(C.BN.Squire),from=side==='p'?4:12;
 u.o=side;u.ready=true;u.mv=u.init;g.b[from]=u;x.hand=[E.mk(C.BN['Potion of Speed'])];
 assert.equal(E.refreshValue(g,side,u),0,'never refresh wholly unused actions');
 assert.notEqual(B.chooseAction(g,side,5,()=>0).a,'cast','act before spending Speed');
 u.ready=false;u.mv=0;
 assert(E.refreshValue(g,side,u)>0,'refresh enables reachable attacks');
 for(const tier of B.STEPS)assert.equal(B.chooseAction(g,side,tier.skill,()=>0).a,'cast','all ranked tiers use a useful refresh');
 E.use(g);E.cast(side,C.BN['Potion of Speed'],{side,c:u});
 assert.equal(u.ready,true);assert.equal(u.mv,u.init);assert.equal(E.refreshValue(g,side,u),0,'do not refresh twice without acting');
 const blocked=state(side),trapped=E.mk(C.BN.Squire);trapped.o=side;trapped.ready=false;trapped.mv=0;
 for(let i=0;i<C.NT;i++){const ally=E.mk(C.BN.Squire);ally.o=side;blocked.b[i]=ally}
 blocked.b[side==='p'?16:0]=trapped;
 assert.equal(E.refreshValue(blocked,side,trapped),0,'do not refresh a blocked unit that cannot reach combat');
 const double=E.mk(C.BN.Bladedancer);double.o=side;double.ready=true;double.u2=1;double.mv=double.init;g.b[from]=double;
 assert(E.refreshValue(g,side,double)>0,'restore the spent attack on a two-attack unit');
 const choice=B.chooseAction(g,side,5,()=>0),again=B.chooseAction(g,side,5,()=>0);
 assert.deepEqual(choice,again,'planning remains deterministic');
 for(const tier of B.STEPS){
  const duel=state(side),fighter=E.mk(C.BN.Squire);
  fighter.o=side;fighter.ready=true;fighter.mv=fighter.init=0;duel.b[side==='p'?0:16]=fighter;
  duel[side].hand=[E.mk(C.BN['Potion of Speed'])];duel[E.opp(side)].hp=100;
  const actions=B.playTurn(duel,side,tier.skill,()=>.999);
  assert.deepEqual(actions.map(a=>a.a),['attack','cast','attack','end'],'ranked '+tier.tier+' spends Speed between attacks, not before them');
 }
}
console.log('PASS both seats and all ranked tiers: draw space, fatigue safety, useful Speed, blocked units and double attacks');
