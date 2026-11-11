const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const P=require('../app/src/main/assets/pvp.js');
const D=require('../app/src/main/assets/campaign-decks.js');
const {lcg,turn}=require('./bot.js');
const originalClasses=[['T','R'],['T','F','R'],['T','F','B'],['W','U'],['C','U'],['F','G','B'],['G','B'],['T','W','B'],['E','W','K'],['U','F'],['D','F','W'],['D','G','E'],['W','T','U'],['G','B','F'],['W','K','E'],['E','B','D'],['R','B','E'],['B','R','G'],['U','W','D'],['F','C','W','D']];
const cap=(i,t)=>Math.min(3,Math.min(3,(i<10?0:i<20?1:2)+(i%3===2&&i>=29?1:0))+t-1);
function legacy(i,rarity,random){
 const pool=C.ALL.filter(c=>c.rar<=rarity&&c.kind!=='haste'),units=pool.filter(c=>c.t==='c'),fav=units.filter(c=>originalClasses[Math.floor(i/3)].includes(c.cls));
 const pick=list=>list[Math.floor(random()*list.length)];
 return Array.from({length:30},()=>random()<.6?pick(fav.length?fav:units).name:pick(pool).name);
}
function match(i,t,seed,player,deck){
 const g=P.newMatch(seed,player,deck),boss=i%3===2;
 g.e.hp=g.e.mx=Math.round((Math.round(i<36?8+i*.6:29.6+(i-35)*.3)+(boss?(i>=36?1:2):0))*(1+.2*(t-1)));
 g.e.max=(boss&&i>=32?1:0)+(t>2?1:0)+(g.turn==='e'?1:0);g.e.mp=g.turn==='e'?g.e.max:0;
 for(let n=0;n<400&&!g.over;n++)turn(g,g.turn);
 assert(g.over,'campaign simulation terminates');return g.over;
}
test('all 60 encounters and three tiers keep faction, curve and rarity constraints',()=>{
 assert.equal(D.THEMES.length,20);
 for(const theme of D.THEMES)for(const name of [...theme.signature,...theme.spells,...theme.gear])assert(C.BN[name],name);
 for(let i=0;i<60;i++)for(let tier=1;tier<=3;tier++)for(let seed=1;seed<=15;seed++){
  const rarity=cap(i,tier),deck=D.build(i,rarity,lcg(seed)),cards=deck.map(n=>C.BN[n]),theme=D.THEMES[Math.floor(i/3)];
  assert.equal(deck.length,30);
  assert(cards.every(c=>c.rar<=rarity),'preserve difficulty rarity caps');
  assert.equal(cards.filter(c=>c.t==='c').length,24);
  assert.equal(cards.filter(c=>c.t==='s').length,4);
  assert.equal(cards.filter(c=>c.t==='i').length,2);
  assert(cards.filter(c=>c.t==='c').every(c=>theme.classes.includes(c.cls)||theme.signature.includes(c.name)),'all creatures belong to this faction');
  assert(cards.filter(c=>c.t==='s').every(c=>theme.spells.includes(c.name)),'thematic spells only');
  assert(cards.filter(c=>c.t==='i').every(c=>theme.gear.includes(c.name)),'thematic gear only');
  assert(cards.filter(c=>c.t==='c'&&c.cost>=5).length<=4,'avoid top-heavy creature hands');
  assert.deepEqual(deck,D.build(i,rarity,lcg(seed)),'seeded generator is reproducible');
 }
});
test('paired legacy/themed campaign difficulty samples across early/mid/late story and all tiers',()=>{
 const stages=[[0,2,5,8],[14,20,26,32],[38,44,50,59]];
 const failures=[];
 for(let tier=1;tier<=3;tier++)for(const stage of stages){
  let old=0,current=0,games=0;
  for(const i of stage)for(const starter of C.STARTERS)for(let seed=1;seed<=20;seed++){
   const rarity=cap(i,tier);
   current+=match(i,tier,seed,starter.list,D.build(i,rarity,lcg(seed)))==='p';
   old+=match(i,tier,seed,starter.list,legacy(i,rarity,lcg(seed)))==='p';games++;
  }
  const delta=(current-old)/games;
  console.log(`Story ${stage[0]}–${stage.at(-1)} tier ${tier}: player ${current}/${games} vs legacy ${old}/${games}; ${(delta*100).toFixed(1)}pp`);
  if(Math.abs(delta)>=.15)failures.push({tier,stage,delta});
 }
 assert.deepEqual(failures,[],'thematic decks must stay within 15pp of the sampled legacy difficulty');
});
