// Run with: node tests/ranked-bots-net.test.js
const path=require('path'),assert=require('assert');
const A=path.join(__dirname,'..','app','src','main','assets');
const C=require(path.join(A,'cards.js')),P=require(path.join(A,'pvp.js'));
const N=require(path.join(A,'net.js'));
const {makeDb,clk}=require('./fakedb');
const deck=()=>C.ALL.filter(c=>c.rar==0).slice(0,10).flatMap(c=>Array(3).fill(c.name));
const normalDeck=n=>[...deck().slice(0,n-6),...Array(3).fill(C.ALL.find(c=>c.rar==2).name),...Array(3).fill(C.ALL.find(c=>c.rar==3).name)];
const auth=(uid,name)=>()=>({uid,tok:uid,name});
const client=(db,uid)=>({T:N.create({db:'https://x',fetch:db.fetch,now:clk.now,auth:auth(uid,uid)})});
const step=async(cs,ms=1000)=>{clk.t+=ms;for(const c of cs)await c.T.tick()};
const later=()=>new Promise(resolve=>setImmediate(resolve));
function gateQueueRead(db,uid,occurrence){
 const base=db.fetch;let count=0,enteredResolve,releaseResolve;
 const entered=new Promise(r=>enteredResolve=r),gate=new Promise(r=>releaseResolve=r);
 db.fetch=async(url,opt={})=>{
  const u=new URL(url);
  if((opt.method||'GET')=='GET'&&u.pathname=='/queue.json'&&u.searchParams.get('auth')==uid&&++count==occurrence){
   enteredResolve();await gate;
  }
  return base(url,opt)
 };
 return{entered,release:releaseResolve}
}

(async()=>{
 assert(P.validRanked(deck()));
 assert.strictEqual(N.BOT_WAIT_MS,20000);

 // No bot before 20 seconds; at the boundary, a labelled synthetic opponent is created.
 {
  clk.t=20_000_000;const db=makeDb(),a=client(db,'uA'),d=normalDeck(20);
  await a.T.join(d);await step([a],N.BOT_WAIT_MS-1);
  assert.strictEqual(a.T.st,'queue');assert.strictEqual(a.T.botAvailable,false);
  await step([a],1);
  assert.strictEqual(a.T.st,'match');assert.strictEqual(a.T.botAvailable,true);
  assert(a.T.opp.bot&&a.T.opp.label=='BOT'&&a.T.opp.name.startsWith('BOT ·'));
  assert(a.T.meta.bot&&a.T.meta.bot.v==1&&a.T.meta.bot.uid==a.T.opp.uid);
  assert(P.validRanked(a.T.meta.bot.uid==a.T.meta.p?a.T.meta.deckP:a.T.meta.deckE));
  assert.deepStrictEqual(Object.keys(db.root.ratings),['uA'],'synthetic opponents never get rating accounts');
  assert(db.get('ratings/uA').from.mid==a.T.mid,'ranked loss is booked once at match start');

  // A new client can resume from the active match marker without booking another loss.
  const before=JSON.stringify(db.get('ratings/uA')),resumed=client(db,'uA');
  assert(await resumed.T.reconnect(),'active ranked match is discoverable after restart');
  assert.strictEqual(JSON.stringify(db.get('ratings/uA')),before,'resume does not duplicate the booked loss');
  assert.strictEqual(resumed.T.st,'match');assert(resumed.T.isBot);
  await step([a,resumed],1000);
  assert.strictEqual(P.hash(a.T.G),P.hash(resumed.T.G),'bot turns replay identically after restart');
  const lossRating=db.get('ratings/uA').r;
  resumed.T.resign();await later();await later();
  assert.strictEqual(resumed.T.st,'over');assert.strictEqual(resumed.T.why,'loss');
  assert.strictEqual(db.get('ratings/uA').l,1,'quitting is one loss, including after restart');
  assert.strictEqual(db.get('ratings/uA').r,lossRating,'quit does not apply the loss twice');
  assert(!db.get('ratings/uA').from,'finished loss clears its pending marker');
  await step([resumed]);await later();
  assert.strictEqual(db.get('ratings/uA').l,1,'repeated ticks cannot book another result');
  console.log('PASS 20s fallback, bot label, synthetic rating treatment, restart, quit loss exactly once');
 }

 // Human pairing wins at the 20-second boundary when already queued.
 {
  clk.t+=100_000;const db=makeDb(),a=client(db,'uA'),b=client(db,'uB');
  await a.T.join(normalDeck(29));await step([a],N.BOT_WAIT_MS-1);await b.T.join(normalDeck(20));
  await step([a,b],1);
  assert.strictEqual(a.T.st,'match');assert.strictEqual(b.T.st,'match');
  assert(!a.T.opp.bot&&!b.T.opp.bot,'a queued human takes priority over bot fallback');
  assert.deepStrictEqual([a.T.meta.deckP.length,a.T.meta.deckE.length].sort((a,b)=>a-b),[20,29]);
  console.log('PASS human pairing takes priority at fallback threshold');
 }

 // A human appearing during the fallback recheck is paired instead of losing the race to a bot.
 {
  clk.t+=100_000;const db=makeDb(),g=gateQueueRead(db,'uA',2),a=client(db,'uA'),b=client(db,'uB'),d=deck();
  await a.T.join(d);clk.t+=N.BOT_WAIT_MS;
  const pending=a.T.tick();await g.entered;
  await b.T.join(d);g.release();await pending;await b.T.tick();
  assert.strictEqual(a.T.st,'match');assert.strictEqual(b.T.st,'match');
  assert(!a.T.opp.bot&&!b.T.opp.bot,'late human queue entrant wins the final recheck');
  console.log('PASS human arrival race at threshold');
 }

 // Cancel while the fallback is rechecking; its generation guard prevents a late match.
 {
  clk.t+=100_000;const db=makeDb(),g=gateQueueRead(db,'uA',2),a=client(db,'uA');
  await a.T.join(deck());clk.t+=N.BOT_WAIT_MS;
  const pending=a.T.tick();await g.entered;
  await a.T.leave();g.release();await pending;
  assert.strictEqual(a.T.st,'idle');assert(!db.get('queue/uA'));
  assert.deepStrictEqual(Object.keys(db.root.matches||{}),[],'cancelled queue creates no match metadata');
  assert.strictEqual(a.T.mid,null);assert(!db.get('ratings/uA'),'cancelled queue has no rating effect');
  console.log('PASS cancel at fallback threshold creates no match');
 }
 // If the result reached Firebase but the rating update did not, restart settles it once.
 {
  clk.t+=100_000;const db=makeDb(),base=db.fetch;let failRating=false;
  db.fetch=async(url,opt={})=>{
   const u=new URL(url);
   if(failRating&&opt.method=='PATCH'&&u.pathname=='/ratings/uA.json'){
    failRating=false;return{ok:false,status:503,json:async()=>null}
   }
   return base(url,opt)
  };
  const a=client(db,'uA');await a.T.join(deck());await step([a],N.BOT_WAIT_MS);
  const mid=a.T.mid;failRating=true;a.T.resign();await later();await later();
  assert(db.get(`matches/${mid}/res/uA`),'match result is durable before rating finalization');
  assert(db.get('ratings/uA').from,'failed rating write leaves the pending marker');
  const restarted=client(db,'uA');
  assert(await restarted.T.reconnect(),'restart finds and finalizes a saved result');
  assert.strictEqual(db.get('ratings/uA').l,1);assert(!db.get('ratings/uA').from);
  console.log('PASS restart repairs a saved result without duplicate rating');
 }
 console.log('ALL RANKED BOT NETWORK TESTS PASSED');
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
