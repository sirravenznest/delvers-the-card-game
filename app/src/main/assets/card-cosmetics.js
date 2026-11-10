(function(root){
'use strict';
const C=typeof require!=='undefined'?require('./cards.js'):root.DelversCards;
const DUST=[5,15,50,150],SLOTS=['frame','lettering','background','foil'];
const colors=[['silver','Silver',25],['red','Red',25],['blue','Blue',25],['gold','Gold',75]];
const options=rows=>rows.map(([id,name,cost])=>({id,name,cost}));
const CATALOG={
 frame:options(colors),lettering:options(colors),
 background:options([['holographic','Holographic',600],['gold-holographic','Gold holographic',1200]]),
 foil:options([['foil','Foil shine',300]])
};
const PACK_CHANCE=[0,.0025,.0075,.015];
const option=(slot,id)=>CATALOG[slot]?.find(x=>x.id===id);
function cleanLook(x){const r={};for(const slot of SLOTS)if(option(slot,x?.[slot]))r[slot]=x[slot];return r}
function cleanCopy(c,id){
 const unlocked={};for(const slot of SLOTS)unlocked[slot]=CATALOG[slot].filter(x=>Array.isArray(c?.unlocked?.[slot])&&c.unlocked[slot].includes(x.id)).map(x=>x.id);
 const earned={};for(const slot of SLOTS)earned[slot]=unlocked[slot].filter(x=>Array.isArray(c?.earned?.[slot])&&c.earned[slot].includes(x));
 const purchased=!!c?.purchased||SLOTS.some(slot=>unlocked[slot].some(x=>!earned[slot].includes(x)));
 const look=cleanLook(c?.look);for(const slot of SLOTS)if(!unlocked[slot].includes(look[slot]))delete look[slot];
 return{id,unlocked,earned,purchased,look};
}
const cosmeticCopy=c=>SLOTS.some(slot=>c.unlocked[slot].length>0);
const protectedCopy=c=>c.purchased;
function normalize(s){
 if(s.cardCosmeticsVersion>1)throw new Error('This collection requires a newer app version.');
 s.cardCosmeticsVersion=1;
 s.dust=Number.isSafeInteger(s.dust)&&s.dust>=0?s.dust:0;
 s.nextCopy=Number.isSafeInteger(s.nextCopy)&&s.nextCopy>=1?s.nextCopy:1;
 const input=s.copies||{},copies={},ids=new Set();
 // Reserve all existing identifiers before allocating any migration copies.
 for(const name of Object.keys(input))if(Array.isArray(input[name]))for(const c of input[name])if(/^c[1-9]\d*$/.test(c?.id)&&Number.isSafeInteger(Number(c.id.slice(1))))s.nextCopy=Math.max(s.nextCopy,Number(c.id.slice(1))+1);
 for(const card of C.ALL){
  const name=card.name,list=[];
  if(Array.isArray(input[name]))for(const c of input[name]){
   if(!/^c[1-9]\d*$/.test(c?.id)||ids.has(c.id))continue;
   ids.add(c.id);list.push(cleanCopy(c,c.id));
  }
  const count=Math.max(0,Math.floor(s.col[name]||0),list.filter(cosmeticCopy).length);
  while(list.length>count){let i=list.length-1;while(cosmeticCopy(list[i]))i--;list.splice(i,1)}
  while(list.length<count)list.push(cleanCopy(null,'c'+s.nextCopy++));
  s.col[name]=count;copies[name]=list;
 }
 s.copies=copies;
 s.deckCopies=resolve(s,s.deck,s.deckCopies);
 for(const b of s.builds||[])b.copyIds=resolve(s,b.deck,b.copyIds);
 const receipt=s.lastPack;
 s.lastPack=receipt&&Array.isArray(receipt.ids)?{ids:[...new Set(receipt.ids)].filter(id=>find(s,id)).slice(0,C.PACK_SIZE)}:null;
 return s;
}
function find(s,id){for(const [name,list] of Object.entries(s.copies)) {const copy=list.find(c=>c.id===id);if(copy)return{name,copy}}return null}
function resolve(s,names,ids){
 const used=new Set();
 return names.map((name,i)=>{
  const list=s.copies[name]||[],c=list.find(c=>c.id===ids?.[i]&&!used.has(c.id))||list.find(c=>!used.has(c.id));
  if(!c)return null;used.add(c.id);return c.id;
 });
}
function add(s,name,count=1){
 if(!C.BN[name]||!Number.isSafeInteger(count)||count<1)throw new Error('Invalid card acquisition.');
 const result=[];for(let i=0;i<count;i++){const c=cleanCopy(null,'c'+s.nextCopy++);s.copies[name].push(c);result.push(c.id)}
 s.col[name]+=count;return result;
}
function styled(s,name,id){const c=s.copies[name]?.find(c=>c.id===id);return{...C.BN[name],copyId:c?.id,look:cleanLook(c?.look)}}
function deckCards(s){return s.deck.map((name,i)=>styled(s,name,s.deckCopies[i]))}
function select(s,position,id){
 const name=s.deck[position],copy=s.copies[name]?.find(c=>c.id===id);
 if(!copy)throw new Error('That copy is not available for this deck slot.');
 const other=s.deckCopies.indexOf(id),old=s.deckCopies[position];
 s.deckCopies[position]=id;if(other>=0&&other!==position)s.deckCopies[other]=old;
}
function unlock(s,id,slot,treatment){
 const item=option(slot,treatment),found=find(s,id);
 if(!found||!item)throw new Error('That card copy or cosmetic is unavailable.');
 const c=found.copy;
 if(c.unlocked[slot].includes(treatment))throw new Error('That treatment is already unlocked on this copy.');
 if(s.dust<item.cost)throw new Error('Not enough Arcane Dust.');
 s.dust-=item.cost;c.unlocked[slot].push(treatment);c.look[slot]=treatment;c.purchased=true;
 return item;
}
function equip(s,id,slot,treatment){
 const found=find(s,id);
 if(!found||!SLOTS.includes(slot))throw new Error('That card copy or cosmetic slot is unavailable.');
 if(treatment&&!found.copy.unlocked[slot].includes(treatment))throw new Error('Unlock that treatment on this copy first.');
 if(treatment)found.copy.look[slot]=treatment;else delete found.copy.look[slot];
}
function extras(s,onlyIds,cosmetic=false){
 const allowed=onlyIds?new Set(onlyIds):null,selected=new Set(s.deckCopies),result=[];
 for(const card of C.ALL){
  const candidates=s.copies[card.name].filter(c=>!protectedCopy(c)&&cosmeticCopy(c)===cosmetic&&(!allowed||allowed.has(c.id)));
  candidates.sort((a,b)=>Number(selected.has(a.id))-Number(selected.has(b.id)));
  result.push(...candidates.slice(0,Math.max(0,s.col[card.name]-3)).map(c=>c.id));
 }
 return result;
}
function quote(s,ids,cosmetic=false){
 const eligible=new Set(extras(s,ids,cosmetic)),seen=new Set(),cards=[];
 for(const id of ids||[])if(eligible.has(id)&&!seen.has(id)){
  seen.add(id);const {name,copy}=find(s,id);
  const bonus=cosmetic?SLOTS.reduce((n,slot)=>n+copy.earned[slot].reduce((v,id)=>v+Math.floor(option(slot,id).cost*.06),0),0):0;
  cards.push({id,name,bonus});
 }
 return{cards,gold:cards.reduce((n,c)=>n+C.SELL[C.BN[c.name].rar],0),dust:cards.reduce((n,c)=>n+DUST[C.BN[c.name].rar]+c.bonus,0)};
}
function breakdown(s,ids,cosmetic=false){
 if(!Array.isArray(ids)||!ids.length)throw new Error('No eligible spare copies selected.');
 const q=quote(s,ids,cosmetic);
 if(q.cards.length!==ids.length)throw new Error('These copies are no longer eligible. Review the breakdown again.');
 for(const {id,name} of q.cards){s.copies[name]=s.copies[name].filter(c=>c.id!==id);s.col[name]--}
 s.gold+=q.gold;s.dust+=q.dust;
 s.deckCopies=resolve(s,s.deck,s.deckCopies);
 for(const b of s.builds||[])b.copyIds=resolve(s,b.deck,b.copyIds);
 if(s.lastPack)s.lastPack.ids=s.lastPack.ids.filter(id=>!ids.includes(id));
 return q;
}
function packTreatments(rarity,tier){
 if(!Number.isInteger(rarity)||rarity<0||rarity>3||!Number.isInteger(tier)||tier<1||tier>3)throw new Error('Invalid cosmetic pack tier or rarity.');
 const result=[];
 for(const slot of SLOTS)for(const item of CATALOG[slot]){
  let weight=0;
  if(item.cost===25)weight=[15,10,7,3][rarity];
  if(item.cost===75)weight=[0,5,9,10][rarity]*tier;
  if(slot==='foil')weight=[10,30,35,50][rarity]*tier;
  if(item.id==='holographic')weight=[0,0,5,11][rarity]*tier;
  if(item.id==='gold-holographic')weight=rarity===3?tier:0;
  if(weight)result.push({slot,...item,weight});
 }
 return result;
}
function grantPack(s,id,tier,rng=Math.random){
 const found=find(s,id);if(!found)throw new Error('The pack card is unavailable.');
 const treatments=packTreatments(C.BN[found.name].rar,tier);
 if(rng()>=PACK_CHANCE[tier])return null;
 let roll=rng()*treatments.reduce((n,x)=>n+x.weight,0);
 const item=treatments.find(x=>(roll-=x.weight)<0)||treatments[treatments.length-1];
 if(!found.copy.unlocked[item.slot].includes(item.id)){found.copy.unlocked[item.slot].push(item.id);found.copy.earned[item.slot].push(item.id)}
 found.copy.look[item.slot]=item.id;
 return item;
}
const api={DUST,SLOTS,CATALOG,PACK_CHANCE,packTreatments,grantPack,option,cleanLook,cosmeticCopy,protectedCopy,normalize,find,add,styled,deckCards,select,unlock,equip,extras,quote,breakdown};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversCardCosmetics=api;
})(typeof self!=='undefined'?self:globalThis);
