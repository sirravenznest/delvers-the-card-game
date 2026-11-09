const assert=require('assert');
const C=require('../app/src/main/assets/cards.js');
const {ALL,PACK_PRICE,PACK_SIZE,SELL,packSlots,PACK_W,STARTERS,STARTER_PRICE,BN,campaignGold,lossGold,MISSION_GOLD}=C;
const ev=t=>packSlots(t).reduce((a,w)=>a+w.reduce((b,x,k)=>b+x/100*SELL[k],0),0);

// every slot is a valid distribution and the last-slot guarantee holds
for(const t of [1,2,3]){for(const w of packSlots(t))assert(Math.abs(w.reduce((a,b)=>a+b,0)-100)<1e-9,'slot sums to 100')}
assert.strictEqual(packSlots(1)[PACK_SIZE-1][0],0);
assert.strictEqual(packSlots(3)[PACK_SIZE-1][0]+packSlots(3)[PACK_SIZE-1][1],0);
assert.deepStrictEqual(packSlots(1)[0],PACK_W[1]);

// Expected sell-back value stays below pack cost; individual lucky packs can exceed it.
for(const t of [1,2,3])assert(ev(t)<PACK_PRICE,'tier '+t+' pack sell-back '+ev(t));
assert(ev(1)<ev(2)&&ev(2)<ev(3));
assert.strictEqual(PACK_PRICE,100);
assert.strictEqual(STARTER_PRICE,400);
assert.deepStrictEqual(SELL,[3,10,25,60]);

// First clears, not repeat farming, fund the first earned pack in three wins.
assert.strictEqual([12,16,40].reduce((sum,b)=>sum+campaignGold(b,true),0),100);
assert.strictEqual([12,16,40].reduce((sum,b)=>sum+campaignGold(b,false),0),12);
assert.deepStrictEqual(MISSION_GOLD,{daily:[15,10,10],weekly:[50,0,0,35]});
assert(MISSION_GOLD.daily.reduce((a,b)=>a+b,0)<80);
assert(MISSION_GOLD.weekly.reduce((a,b)=>a+b,0)<175);
for(const base of [12,16,40,60,90,150,300,600]){
 assert(Number.isInteger(lossGold(base))&&lossGold(base)>=0);
 assert(lossGold(base)<Math.max(8,Math.round(base*.15)));
 for(const first of [true,false]){
  let prev=0;
  for(const tier of [1,2,3]){
   const g=campaignGold(base,first,tier);
   assert(Number.isInteger(g)&&g>prev,'tier reward growth');
   assert(campaignGold(base,true,tier)>campaignGold(base,false,tier));
   assert(Math.round(lossGold(base)*[0,1,1.35,1.75][tier])<g,'losing is worse than replaying');
   prev=g;
  }
 }
}
for(const first of [true,false])for(const tier of [1,2,3]){
 const rewards=[40,60,90,150,300,600].map(b=>campaignGold(b,first,tier));
 rewards.forEach((g,i)=>{if(i)assert(g>rewards[i-1],'later campaign rewards rise')});
}
assert(campaignGold(300,true)>3*campaignGold(40,true),'later successful battles earn packs faster');
console.log('REWARD GROWTH OK; opening earned gold 100, opening replay gold 12');

// starter decks cost more than their cards sell for
for(const d of STARTERS){const v=d.list.reduce((a,n)=>a+SELL[BN[n].rar],0);assert.strictEqual(d.list.length,30);assert(v<STARTER_PRICE,d.id+' sells for '+v)}
assert(STARTER_PRICE>PACK_PRICE*3&&STARTER_PRICE<=PACK_PRICE*5);

// Monte Carlo: the odds shown in the app match what packs deliver
const rng=require('./bot.js').lcg(224),N=200000;for(const t of [1,2,3]){const sl=packSlots(t),got=[0,0,0,0];
 for(let n=0;n<N;n++)sl.forEach(w=>{let r=rng()*100,k=0;for(;k<3;k++){if(r<w[k])break;r-=w[k]}got[k]++});
 const exp=[0,1,2,3].map(k=>sl.reduce((a,w)=>a+w[k],0)/PACK_SIZE);
 got.forEach((g,k)=>assert(Math.abs(g/(N*PACK_SIZE)*100-exp[k])<0.4,'tier '+t+' rarity '+k+': '+(g/(N*PACK_SIZE)*100)+' vs '+exp[k]))}
console.log('ECONOMY TESTS PASSED','EV',[1,2,3].map(ev).map(x=>x.toFixed(1)).join('/'));

// cosmetics use three price tiers
const html=require('fs').readFileSync(__dirname+'/../app/src/main/assets/index.html','utf8');
const prices=[...html.matchAll(/\{id:'[\w-]+',name:'[^']*',(?:glyph:'[^']*',bg:'#\w+',fg:'#\w+',)?price:(\d+)/g)].map(m=>+m[1]);
assert.strictEqual(prices.length,16);
prices.forEach(p=>assert([350,450,600].includes(p),'cosmetic price '+p));
console.log('COSMETIC PRICES OK');
