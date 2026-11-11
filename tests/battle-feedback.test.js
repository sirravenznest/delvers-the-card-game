const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
const P=require('../app/src/main/assets/pvp.js');
for(const side of ['p','e']){
 const g=P.newMatch(52,Array(20).fill('Squire'),Array(20).fill('Squire'));
 g.fx=true;g.turn=side;g[side].mp=10;E.use(g);
 const unit=E.mk(C.BN.Squire);unit.o=side;g.b[side==='p'?16:0]=unit;
 for(const name of ['Dagger','Shield','Amulet of Health']){
  const card=E.mk(C.BN[name]);card.look={foil:'foil'};g[side].hand=[card];
  assert(P.act(g,side,{a:'cast',h:0,t:{side,i:g.b.indexOf(unit)}}).ok);
  assert.equal(unit['s'+card.slot],1,'existing slot rules remain intact');
  assert.equal(unit.gear[card.slot],name,'equipped item name is retained');
  const event=g.ev.at(-1);
  assert.equal(event.name,name);assert.equal(event.caster,side);
  assert.equal(event.target,'Squire');assert.equal(event.kind,'gear');
  assert.deepEqual(event.look,{foil:'foil'});
  const duplicate=E.mk(C.BN[name]);g[side].hand=[duplicate];
  const before=JSON.stringify(g);
  assert.equal(P.act(g,side,{a:'cast',h:0,t:{side,i:g.b.indexOf(unit)}}).ok,false);
  assert.equal(JSON.stringify(g),before,'duplicate slot rejection remains mutation-free');
 }
 const gear={...unit.gear};
 E.move(side,g.b.indexOf(unit),side==='p'?12:4);
 assert.deepEqual(unit.gear,gear,'movement retains all item names');
 for(const name of ['Arcane Insight','Mana Potion','Mass Cure Wounds','Meteor Swarm']){
  E.cast(side,C.BN[name],null);
  const event=g.ev.filter(x=>x.k==='spell').at(-1);
  assert.equal(event.name,name);assert.equal(event.caster,side);
  assert.equal(event.s,name==='Meteor Swarm'?E.opp(side):side,'untargeted effects highlight the correct side');
 }
 E.cast(side,C.BN.Bless,{side,c:unit});
 assert.equal(g.ev.filter(x=>x.k==='spell').at(-1).kind,'bless','buff spells are not presented as equipped gear');
 assert.deepEqual(unit.gear,gear,'spell buffs do not create equipment');
}
console.log('PASS named equipment, slot protection, action presentation metadata and both caster seats');
