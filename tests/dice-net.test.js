const assert=require('node:assert/strict');
const C=require('../app/src/main/assets/cards.js');
const N=require('../app/src/main/assets/net.js');
const P=require('../app/src/main/assets/pvp.js');
const {makeDb,clk}=require('./fakedb');
const deck=C.STARTERS[0].list;
const client=(db,uid,die='classic')=>N.create({db:'https://x',fetch:db.fetch,now:clk.now,auth:()=>({uid,tok:uid,name:uid}),die:()=>die});
const tick=async(...clients)=>{for(const t of clients)await t.tick()};
async function pair(){
 clk.t+=100000;const db=makeDb(),a=client(db,'uA','emberheart'),b=client(db,'uB','starless');
 await a.join(deck);await b.join(deck);
 for(let i=0;i<5&&(a.st!=='match'||b.st!=='match');i++)await tick(a,b);
 assert.equal(a.st,'match');assert.equal(b.st,'match');return{db,a,b};
}
(async()=>{
 for(const simultaneous of [false,true]){
  const {db,a,b}=await pair();
  assert.deepEqual(a.meta.dice,{uA:'emberheart',uB:'starless'});
  assert.deepEqual(a.G.opening,b.G.opening);
  assert(!a.act({a:'end'}).ok);
  const p=a.meta.p,e=a.meta.e;
  assert.equal((await db.fetch(`https://x/matches/${a.mid}/log/roll_${p}.json?auth=${e}`,{method:'PUT',body:JSON.stringify({u:p,roll:1,t:clk.t})})).status,401,'opponent cannot roll for the other player');
  if(simultaneous)await Promise.all([a.roll(),b.roll()]);
  else{
   await a.roll();await tick(a,b);
   assert(a.G.opening.rolled[a.seat]);assert(!a.G.opening.rolled[b.seat]);
   assert(!a.act({a:'end'}).ok,'one rolled die does not start gameplay');
   await assert.rejects(()=>a.roll(),/already/);clk.t+=15000;await b.roll();
  }
  await tick(a,b);assert(a.openingStarted&&b.openingStarted);
  assert.equal(P.hash(a.G),P.hash(b.G));assert.equal(a.G.n,0);
  assert(a.timeLeft()>=N.TURN_MS-1000&&b.timeLeft()>=N.TURN_MS-1000,'normal turn clock begins after the second roll');
  const first=a.G.turn===a.seat?a:b,second=first===a?b:a;
  assert(first.act({a:'end'}).ok);await new Promise(r=>setImmediate(r));await tick(a,b);
  assert.equal(first.G.turn,second.seat);assert.equal(P.hash(a.G),P.hash(b.G));
  const resumed=client(db,'uA');assert(await resumed.reconnect());await tick(resumed);
  assert.equal(P.hash(resumed.G),P.hash(a.G),'reload restores both rolls and replays actions, not a fresh roll');
  assert.deepEqual(resumed.meta.dice,a.meta.dice,'reload restores the original equipped dice');
 }
 {
  const {a,b}=await pair();await a.roll();clk.t+=N.TURN_MS+1;await tick(a);
  assert.equal(a.st,'over');assert.equal(a.why,'timeout');assert.equal(a.over,a.seat,'declining to roll cannot stall ranked indefinitely');
  await tick(b);assert.equal(b.st,'over');assert.equal(b.over,a.seat);
 }
 {
  const {db,a,b}=await pair();db.down.add('uA');
  await assert.rejects(()=>a.roll(),/offline/);assert(!a.G.opening.rolled[a.seat]);
  db.down.delete('uA');await a.roll();await b.roll();await tick(a,b);assert.equal(P.hash(a.G),P.hash(b.G));
 }
 {
  const {db,a,b}=await pair(),base=db.fetch;let release,entered;
  const gate=new Promise(r=>release=r),stored=new Promise(r=>entered=r);
  db.fetch=async(url,opt={})=>{
   const result=await base(url,opt);
   if(opt.method==='PUT'&&new URL(url).pathname.endsWith('/log/roll_uA.json')){entered();await gate}
   return result;
  };
  // Clients capture their fetch callback; recreate this one to delay only its response.
  const delayed=client(db,'uA');await delayed.resume(a.mid);
  const rolling=delayed.roll();await stored;
  await tick(delayed);assert(delayed.G.opening.rolled[delayed.seat],'polling can receive the roll before its request completes');
  release();await rolling;await b.roll();await tick(delayed,b);
  assert.equal(P.hash(delayed.G),P.hash(b.G),'the late response is idempotent, not a second roll');
 }
 {
  const {db,a,b}=await pair();
  await db.fetch(`https://x/matches/${a.mid}/log/roll_uA.json?auth=uB`,{method:'PUT',body:JSON.stringify({u:'uB',roll:1,t:clk.t})});
  await tick(a);assert.equal(a.st,'over');assert.equal(a.over,a.seat);assert.equal(a.why,'cheat','blocking another player’s roll key loses, rather than forcing their timeout');
  await tick(b);assert.equal(b.over,a.seat);
 }
 {
  clk.t+=100000;const db=makeDb(),a=client(db,'uBot','deep-anvil');
  await a.join(deck);clk.t+=N.BOT_WAIT_MS;await tick(a);
  assert(a.isBot);assert(a.G.opening.rolled[a.botSeat]);assert(!a.G.opening.rolled[a.seat]);
  const before=a.G.n;await tick(a);assert.equal(a.G.n,before,'bot cannot play before the human rolls');
  await a.roll();await tick(a);assert(a.openingStarted);
 }
 console.log('PASS shared ranked rolls, simultaneous independent rolls, immutable ownership, second-roll clock, resume, timeout, network failure and bot opening');
})().catch(err=>{console.error(err);process.exitCode=1});
