const assert=require('node:assert/strict');
const F=require('../app/src/main/assets/card-cosmetics.js');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
const P=require('../app/src/main/assets/pvp.js');
const fresh=()=>F.normalize({col:Object.fromEntries(C.ALL.map(c=>[c.name,0])),deck:[],builds:[],gold:100,dust:5000});
const s=fresh();
F.add(s,'Squire',5);s.deck=['Squire','Squire','Squire'];s.builds=[{name:'Saved',deck:s.deck.slice()}];F.normalize(s);
const originalIds=s.copies.Squire.map(c=>c.id);
assert.equal(new Set(originalIds).size,5);
assert.deepEqual(s.deckCopies,originalIds.slice(0,3));
F.unlock(s,originalIds[0],'frame','gold');
assert.equal(s.dust,4925);
F.unlock(s,originalIds[0],'background','gold-holographic');
F.unlock(s,originalIds[0],'lettering','blue');
F.unlock(s,originalIds[0],'foil','foil');
assert.deepEqual(F.find(s,originalIds[0]).copy.look,{frame:'gold',background:'gold-holographic',lettering:'blue',foil:'foil'});
F.equip(s,originalIds[0],'frame','');
assert(F.protectedCopy(F.find(s,originalIds[0]).copy),'disabled treatment still protects copy');
assert.throws(()=>F.equip(s,originalIds[1],'foil','foil'),/Unlock/);
const before=JSON.stringify(s);
assert.throws(()=>F.unlock(s,originalIds[1],'background','invalid'),/unavailable/);
assert.equal(JSON.stringify(s),before);
assert.throws(()=>F.breakdown(s,[originalIds[0]]),/eligible/);
F.select(s,1,originalIds[4]);
assert.equal(s.deckCopies[1],originalIds[4]);
F.select(s,2,originalIds[4]);
assert.equal(new Set(s.deckCopies).size,3,'selecting an in-deck copy swaps slots');
const restored=F.normalize(JSON.parse(JSON.stringify(s)));
assert.deepEqual(restored,s,'save round-trip preserves cosmetics, currency, identifiers and builds');
const legacy=fresh();legacy.col.Squire=4;legacy.deck=['Squire','Squire'];legacy.builds=[{name:'Old deck',deck:['Squire']}];F.normalize(legacy);
const migrated=JSON.stringify(legacy);F.normalize(legacy);assert.equal(JSON.stringify(legacy),migrated,'migration is idempotent');
assert.equal(legacy.col.Squire,4);
assert.deepEqual(legacy.deck,['Squire','Squire']);
const packIds=F.add(s,'Squire',2);s.lastPack={ids:packIds};
F.unlock(s,packIds[0],'foil','foil');
assert.deepEqual(F.extras(s,packIds),[packIds[1]],'pack breakdown excludes cosmetics and all older copies');
const q=F.quote(s,F.extras(s,packIds)),money={gold:s.gold,dust:s.dust};
F.breakdown(s,q.cards.map(c=>c.id));
assert.equal(s.gold,money.gold+C.SELL[C.BN.Squire.rar]);
assert.equal(s.dust,money.dust+F.DUST[C.BN.Squire.rar]);
assert.throws(()=>F.breakdown(s,q.cards.map(c=>c.id)),/eligible/,'receipt cannot pay twice');
const all=F.extras(s);F.breakdown(s,all);
assert.equal(s.col.Squire,3,'three total copies kept including protected ones');
assert.equal(s.copies.Squire.length,3);
assert(s.deckCopies.every(id=>F.find(s,id)),'active deck remaps removed plain copies');
assert(s.builds[0].copyIds.every(id=>F.find(s,id)),'saved build remaps removed plain copies');
assert.throws(()=>F.breakdown(s,[s.copies.Squire.find(c=>!F.protectedCopy(c)).id]),/eligible/);
assert.deepEqual(F.DUST,[5,15,50,150]);
for(let r=0;r<4;r++){
 const x=fresh(),card=C.ALL.find(c=>c.rar===r),id=F.add(x,card.name,4)[3];
 const result=F.breakdown(x,[id]);assert.equal(result.gold,C.SELL[r]);assert.equal(result.dust,F.DUST[r]);
}
const poor=fresh();poor.dust=24;const poorId=F.add(poor,'Squire')[0];
assert.throws(()=>F.unlock(poor,poorId,'frame','blue'),/Not enough/);
assert.equal(poor.dust,24);assert.equal(F.protectedCopy(F.find(poor,poorId).copy),false);
assert.deepEqual(F.cleanLook({frame:'<script>',lettering:'red',background:'holographic',foil:'invalid'}),{lettering:'red',background:'holographic'});
assert.deepEqual(F.PACK_CHANCE,[0,.0025,.0075,.015]);
for(let tier=1;tier<=3;tier++)for(let rarity=0;rarity<=3;rarity++){
 const pool=F.packTreatments(rarity,tier);
 assert(pool.some(x=>x.slot==='foil'),'basic foil in every pack tier and rarity');
 assert.equal(pool.some(x=>x.id==='holographic'),rarity>=2);
 assert.equal(pool.some(x=>x.id==='gold-holographic'),rarity===3);
 const x=fresh(),name=C.ALL.find(c=>c.rar===rarity).name,id=F.add(x,name)[0];
 assert.equal(F.grantPack(x,id,tier,()=>F.PACK_CHANCE[tier]),null,'exact non-drop boundary');
 const draws=[0,.999999],item=F.grantPack(x,id,tier,()=>draws.shift());
 assert(item);assert(F.cosmeticCopy(F.find(x,id).copy));assert.equal(F.protectedCopy(F.find(x,id).copy),false);assert.equal(x.dust,5000,'pack grant costs no Dust');
}
for(const [slot,treatment,bonus] of [['frame','blue',1],['frame','gold',4],['foil','foil',18],['background','holographic',36],['background','gold-holographic',72]]){
 const x=fresh(),id=F.add(x,'Squire',4)[3],copy=F.find(x,id).copy;
 copy.unlocked[slot].push(treatment);copy.earned[slot].push(treatment);copy.look[slot]=treatment;
 F.normalize(x);
 assert(!F.extras(x).includes(id),'pack cosmetic excluded from bulk extras');
 assert.throws(()=>F.breakdown(x,[id]),/eligible/,'cosmetic requires separate salvage action');
 F.equip(x,id,slot,'');
 const q=F.quote(x,[id],true);assert.equal(q.cards[0].bonus,bonus,'6% bonus uses unlocked treatment, not current appearance');
 assert.equal(q.dust,F.DUST[C.BN.Squire.rar]+bonus);
 const prior=x.dust;F.breakdown(x,[id],true);assert.equal(x.dust,prior+q.dust);
 assert.throws(()=>F.breakdown(x,[id],true),/eligible/);
}
{
 const x=fresh(),id=F.add(x,'Squire',4)[3],c=F.find(x,id).copy;
 c.unlocked.foil=['foil'];c.earned.foil=['foil'];F.unlock(x,id,'frame','blue');
 assert(F.protectedCopy(F.find(x,id).copy),'a purchase permanently protects an originally pack-granted copy');
 assert.throws(()=>F.breakdown(x,[id],true),/eligible/);
}
const rng=require('./bot.js').lcg(736),trials=100000;
for(const tier of [1,2,3]){
 let drops=0;
 const x=fresh(),id=F.add(x,'Squire')[0];
 for(let i=0;i<trials;i++){const c=F.find(x,id).copy;for(const slot of F.SLOTS)c.unlocked[slot]=[];if(F.grantPack(x,id,tier,rng))drops++}
 assert(Math.abs(drops/trials-F.PACK_CHANCE[tier])<.001,'cosmetic pack probability '+tier);
}
for(const rarity of [0,1,2,3]){
 let previous=-1;
 for(const tier of [1,2,3]){
  const pool=F.packTreatments(rarity,tier),total=pool.reduce((n,x)=>n+x.weight,0),premium=pool.filter(x=>x.cost>=75).reduce((n,x)=>n+x.weight,0)/total;
  assert(premium>=previous,'higher pack tiers improve premium treatment mix');previous=premium;
 }
}
{
 const x=fresh(),ids=F.add(x,'Squire',5),before=JSON.stringify(x);
 assert.throws(()=>F.breakdown(x,[ids[0],ids[0]]),/eligible/,'duplicate IDs cannot pay twice');
 assert.equal(JSON.stringify(x),before,'invalid requests are atomic');
 const q=F.quote(x,[ids[4]]);F.unlock(x,ids[4],'frame','gold');
 const afterPurchase=JSON.stringify(x);
 assert.throws(()=>F.breakdown(x,q.cards.map(c=>c.id)),/eligible/,'a stale quote cannot destroy a newly protected copy');
 assert.equal(JSON.stringify(x),afterPurchase);
}
// Appearance data must survive shuffling without affecting the deterministic rules.
const deck=C.STARTERS[0].list,looks=deck.map((n,i)=>i===0?{frame:'gold',foil:'foil'}:{});
const plain=P.newMatch(123,deck,deck),dressed=P.newMatch(123,deck,deck,{looksP:looks});
assert.equal(P.hash(plain),P.hash(dressed));
assert.equal(dressed.p.deck.concat(dressed.p.hand).filter(c=>c.look?.frame==='gold').length,1);
const dressedCard=dressed.p.deck.concat(dressed.p.hand).find(c=>c.look?.frame==='gold');
assert.deepEqual(E.mk(dressedCard).look,dressedCard.look);
console.log('PASS individual cosmetics, migration, Dust, protected breakdown, pack grants and deterministic appearance transport');
