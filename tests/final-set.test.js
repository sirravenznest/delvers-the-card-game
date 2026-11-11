const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
const {play}=require('./bot.js');
const cases=[
 ['Ashen Standard-Bearer',0,['Town Guard','Town Guard','Town Guard']],
 ['Lanternbound Adept',1,['Apprentice','Apprentice','Apprentice']],
 ['Emberheart Confessor',1,['Priest','Priest','Acolyte']],
 ['Vaultstep Infiltrator',2,['Cat Burglar','Cat Burglar','Cat Burglar']],
 ['Embertrail Archer',2,['Hunter','Hunter','Hunter']],
 ['Lantern Study',1,['Magic Missile','Magic Missile','Magic Missile']],
 ['Hearthward Prayer',0,['Potion of Healing','Potion of Healing','Bless']],
 ['Ashen Reprisal',1,['Lightning Bolt','Burning Hands','Burning Hands']]
];
function state(seed,side,ward=false,mr=false){
 const o=side==='p'?'e':'p',g={rs:seed,turn:side,log:[],b:Array(C.NT).fill(null),p:{hp:20,mx:20},e:{hp:20,mx:20}};
 for(const i of [4,5,6])g.b[i]={...E.mk(C.BN.Squire),hp:100,mhp:100,o,cls:'U',kw:mr?'mr':'',k2:ward?'ward ward':''};
 E.use(g);return g;
}
test('eight class-based additions keep all cards, rarities, starter decks and acquisition gates',()=>{
 assert.equal(C.ALL.length,130);
 const cards=cases.map(([n])=>C.BN[n]),units=cards.filter(c=>c.t==='c');
 assert.equal(cards.length,8);assert.equal(units.length,5);
 assert.deepEqual(units.map(c=>c.cls).sort(),['C','F','R','T','W']);
 assert(units.every(c=>c.ct==='Humanoid'),'no added monsters');
 assert.equal(cards.filter(c=>c.t==='s').length,3);
 assert.deepEqual([0,1,2,3].map(r=>cards.filter(c=>c.rar===r).length),[3,3,2,0]);
 assert.deepEqual(C.PACK_W,{1:[70,22,7,1],2:[50,30,16,4],3:[30,32,28,10]});
 assert.equal(C.ALL.filter(c=>c.rar===3).length,10,'do not dilute individual Legendary odds');
 assert(C.STARTERS.every(s=>s.list.every(n=>!cases.some(([name])=>name===n))),'no automatic starter unlocks');
 for(const c of cards)assert(C.packSlots(1).some(w=>w[c.rar]>0),'all eight can be obtained from ordinary packs');
});
test('Warded applies once after saves to every damaging spell, for both seats and resistant targets',()=>{
 const damage=C.SP.filter(c=>['dmg','aoe','turn',...Object.keys(E.AREA)].includes(c.kind));
 for(const side of ['p','e'])for(const mr of [false,true])for(const spell of damage)for(let seed=1;seed<=100;seed++){
  const normal=state(seed,side,false,mr),target={side:side==='p'?'e':'p',c:normal.b[4]};
  E.cast(side,spell,target);
  const warded=state(seed,side,true,mr);E.cast(side,spell,{...target,c:warded.b[4]});
  for(const i of [4,5,6]){
   const before=100-normal.b[i].hp,after=100-warded.b[i].hp;
   assert.equal(after,before>1?before-1:before,spell.name+' seed '+seed+' seat '+side);
  }
  assert.equal(warded.rs,normal.rs,'Warded introduces no extra randomness');
 }
});
test('Warded does not alter physical damage, sleep, healing, heroes or zero damage',()=>{
 const g=state(9,'p',true),u=g.b[4];
 E.dmg('e',u,4);assert.equal(u.hp,96,'combat and nonspell damage unchanged');
 E.heal('e',u,2);assert.equal(u.hp,98);
 E.cast('p',C.BN['Magic Missile'],{side:'e',c:null});assert.equal(g.e.hp,17,'heroes are not warded');
 u.save=21;u.cls='F';E.cast('p',C.BN.Sleep,{side:'e',c:u});assert.equal(u.sleep,1,'no immunity to control');
 assert.equal(E.spellDamage(u,0),0);assert.equal(E.spellDamage(u,1),1);assert.equal(E.spellDamage(u,3),2);
});
test('one- and three-copy starter substitutions against every starter stay inside 12pp power bounds',()=>{
 for(const [name,starter,replacements] of cases)for(const copies of [1,3]){
  const base=C.STARTERS[starter].list,deck=base.slice();
  for(const old of replacements.slice(0,copies)){const at=deck.indexOf(old);assert(at>=0);deck[at]=name}
  let wins=0,baseline=0,games=0;
  for(const opponent of C.STARTERS)for(let seed=1;seed<=100;seed++)for(const seat of ['p','e']){
   const result=seat==='p'?play(seed,deck,opponent.list):play(seed,opponent.list,deck);
   const old=seat==='p'?play(seed,base,opponent.list):play(seed,opponent.list,base);
   assert(result.over&&old.over,'every match terminates');
   wins+=result.over===seat;baseline+=old.over===seat;games++;
  }
  const delta=(wins-baseline)/games;
  console.log(`${name} x${copies}: ${wins}/${games} vs starter ${baseline}/${games}; ${(delta*100).toFixed(1)}pp`);
  assert(Math.abs(delta)<.12,name+' should not be an automatic upgrade or a gross power regression');
 }
});
