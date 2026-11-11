const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const P=require('../app/src/main/assets/pvp.js');
const N=require('../app/src/main/assets/net.js');
const SO=require('../app/src/main/assets/social.js');
const {makeDb,clk}=require('./fakedb');
const deck=C.STARTERS[0].list;
const looks=deck.map((_,i)=>({frame:i%2?'blue':'gold',background:'gold-holographic',lettering:'silver',foil:'foil'}));
const client=(db,uid,cosmetics=[])=>N.create({db:'https://x',fetch:db.fetch,now:clk.now,auth:()=>({uid,tok:uid,name:uid}),cardLooks:()=>cosmetics});
const signature=g=>['p','e'].map(side=>g[side].deck.concat(g[side].hand).map(c=>[c.name,c.look]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
const tick=async(...clients)=>{clk.t+=1000;for(const t of clients)await t.tick()};
(async()=>{
 for(const friendly of [false,true]){
  clk.t+=100000;const db=makeDb(),a=client(db,'uA',looks),b=client(db,'uB');
  if(friendly){
   const social=uid=>SO.create({db:'https://x',fetch:db.fetch,auth:()=>({uid,tok:uid,name:uid})});
   const sa=social('uA'),sb=social('uB');await sa.ensureProfile();const code=await sb.ensureProfile();
   await sa.addByCode(code);await sb.refresh(clk.t);await sb.accept('uA');
   await a.invite('uB','uB',deck);await b.acceptInvite('uA',deck);
  }else{await a.join(deck);await b.join(deck)}
  for(let i=0;i<6&&(a.st!=='match'||b.st!=='match');i++)await tick(a,b);
  assert.equal(a.st,'match');assert.equal(b.st,'match');assert.notEqual(a.seat,b.seat);
  assert.deepEqual(signature(a.G),signature(b.G),'both clients receive identical appearances');
  const myCards=a.G[a.seat].deck.concat(a.G[a.seat].hand);
  assert.equal(myCards.filter(c=>c.look.foil==='foil').length,30);
  assert.equal(a.G[b.seat].deck.concat(a.G[b.seat].hand).filter(c=>c.look.foil).length,0);
  const resumed=client(db,'uA');
  await resumed.resume(a.mid);assert.deepEqual(signature(resumed.G),signature(a.G),'reconnect restores appearances');
  await Promise.all([a.roll(),b.roll()]);await tick(a,b);
  let active,h;
  for(let turn=0;turn<10;turn++){
   active=a.G.turn===a.seat?a:b;
   h=active.G[active.seat].hand.findIndex(c=>c.t==='c'&&c.cost<=active.G[active.seat].mp);
   if(h>=0)break;
   assert(active.act({a:'end'}).ok);await tick(a,b);
  }
  assert(h>=0,'starter has a playable creature');
  assert(active.act({a:'summon',h,pos:P.HOME[active.seat][0]}).ok);
  await tick(a,b);
  assert.equal(P.hash(a.G),P.hash(b.G),'appearance never changes deterministic actions');
  assert.deepEqual(a.G.b.map(c=>c?.look),b.G.b.map(c=>c?.look),'summoned units retain appearances on both clients');
  console.log('PASS cosmetic metadata, replay, summoning and both seats in',friendly?'friendly':'ranked');
 }
 {
  clk.t+=100000;const db=makeDb(),a=client(db,'uA',looks);await a.join(deck);
  clk.t+=N.BOT_WAIT_MS;await a.tick();assert.equal(a.st,'match');assert(a.isBot);
  assert.equal(a.G[a.seat].deck.concat(a.G[a.seat].hand).filter(c=>c.look.foil==='foil').length,30);
  const resumed=client(db,'uA');await resumed.reconnect();assert.deepEqual(signature(a.G),signature(resumed.G));
  console.log('PASS ranked bot matches retain player cosmetics across reconnect');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
