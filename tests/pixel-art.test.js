const test=require('node:test');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const C=require('../app/src/main/assets/cards.js');
const E=require('../app/src/main/assets/engine.js');
globalThis.DelversCards=C;
require('../app/src/main/assets/pixel-art.js');
const A=globalThis.DelversArt;
const foreground=svg=>svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
test('every card has a distinct deterministic foreground, not just a different background or label',()=>{
 const seen=new Map(),before=JSON.stringify(C.ALL);
 for(const c of C.ALL){
  const svg=A.art(c,'unitSprite'),body=foreground(svg),hash=createHash('sha256').update(body).digest('hex');
  assert(!seen.has(hash),`${c.name} shares foreground with ${seen.get(hash)}`);
  seen.set(hash,c.name);
  assert.equal(A.art(c,'unitSprite'),svg);
  assert.equal(foreground(A.art({...c,rar:(c.rar+1)%4,look:{foil:'foil'}} ,'unitSprite')),body,'rarity and finishes do not change card identity');
 }
 assert.equal(JSON.stringify(C.ALL),before,'art does not mutate mechanics or types');
});
test('class and creature type remain independent in live units and future art',()=>{
 const ranger={...C.BN.Hunter,name:'Future undead ranger',ct:'Undead'};
 const unit=E.mk(ranger);
 assert.equal(unit.cls,'R');assert.equal(unit.ct,'Undead');
 assert.equal(C.CLASS[unit.cls],'Ranger');
 assert.notEqual(foreground(A.art(unit,'unitSprite')),foreground(A.art({...unit,ct:'Humanoid'},'unitSprite')));
 for(const c of C.CR){
  const live=E.mk(c);
  assert.equal(live.cls,c.cls);assert.equal(live.ct,c.ct);
  assert(c.ct,'creature type is explicit on '+c.name);
 }
});
