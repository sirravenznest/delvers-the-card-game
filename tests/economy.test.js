const assert=require('assert');
const C=require('../app/src/main/assets/cards.js');
const {ALL,PACK_PRICE,PACK_SIZE,SELL,packSlots,PACK_W,STARTERS,STARTER_PRICE,BN}=C;
const ev=t=>packSlots(t).reduce((a,w)=>a+w.reduce((b,x,k)=>b+x/100*SELL[k],0),0);

// every slot is a valid distribution and the last-slot guarantee holds
for(const t of [1,2,3]){for(const w of packSlots(t))assert(Math.abs(w.reduce((a,b)=>a+b,0)-100)<1e-9,'slot sums to 100')}
assert.strictEqual(packSlots(1)[PACK_SIZE-1][0],0);
assert.strictEqual(packSlots(3)[PACK_SIZE-1][0]+packSlots(3)[PACK_SIZE-1][1],0);
assert.deepStrictEqual(packSlots(1)[0],PACK_W[1]);

// selling a pack's cards back never returns more than the pack cost (no gold farming), and higher tiers are worth more
assert(ev(1)<PACK_PRICE,'standard pack sell-back '+ev(1));
assert(ev(1)<ev(2)&&ev(2)<ev(3));

// starter decks cost more than their cards sell for
for(const d of STARTERS){const v=d.list.reduce((a,n)=>a+SELL[BN[n].rar],0);assert.strictEqual(d.list.length,30);assert(v<STARTER_PRICE,d.id+' sells for '+v)}
assert(STARTER_PRICE>PACK_PRICE*3&&STARTER_PRICE<=PACK_PRICE*5);

// Monte Carlo: the odds shown in the app match what packs deliver
const N=200000;for(const t of [1,2,3]){const sl=packSlots(t),got=[0,0,0,0];
 for(let n=0;n<N;n++)sl.forEach(w=>{let r=Math.random()*100,k=0;for(;k<3;k++){if(r<w[k])break;r-=w[k]}got[k]++});
 const exp=[0,1,2,3].map(k=>sl.reduce((a,w)=>a+w[k],0)/PACK_SIZE);
 got.forEach((g,k)=>assert(Math.abs(g/(N*PACK_SIZE)*100-exp[k])<0.4,'tier '+t+' rarity '+k+': '+(g/(N*PACK_SIZE)*100)+' vs '+exp[k]))}
console.log('ECONOMY TESTS PASSED','EV',[1,2,3].map(ev).map(x=>x.toFixed(1)).join('/'));

// cosmetics use three price tiers
const html=require('fs').readFileSync(__dirname+'/../app/src/main/assets/index.html','utf8');
const prices=[...html.matchAll(/\{id:'[\w-]+',name:'[^']*',(?:glyph:'[^']*',bg:'#\w+',fg:'#\w+',)?price:(\d+)/g)].map(m=>+m[1]);
assert.strictEqual(prices.length,16);
prices.forEach(p=>assert([350,450,600].includes(p),'cosmetic price '+p));
console.log('COSMETIC PRICES OK');
