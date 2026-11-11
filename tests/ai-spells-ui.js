// Local browser fixtures exercise the actual campaign and Auto-play decision loop.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await p.goto(url);await p.locator('.titleActions .pri').click();await p.click('[data-a="tutskipmenu"]');
 await p.evaluate(()=>{const timeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...a)=>timeout(fn,Math.min(ms,2),...a)});
 for(const side of ['p','e'])for(const level of [0,1,2]){
  for(const count of [5,6,7]){
   const result=await p.evaluate(async({side,level,count})=>{
    newGame(0,1);V.intro=null;G.auto=side==='p';G.turn=side;G.ev=[];
    G[side].mp=2;G[side].deck=Array.from({length:5},()=>mk(BN['Red Dragon']));
    G[side].hand=[mk(BN['Arcane Insight']),...Array.from({length:count-1},()=>mk(BN['Red Dragon']))];
    render();const target=aiT(G[side].hand[0],side);
    await aiPlay(side,level);
    return{target,hand:G[side].hand.length,mana:G[side].mp,cast:G.history.some(h=>h.kind==='spell'&&h.text.includes('Arcane Insight'))};
   },{side,level,count});
   assert.deepEqual(result,{target:true,hand:Math.min(7,count+1),mana:0,cast:true},'draw without creatures: '+side+' level '+level+' hand '+count);
  }
  const refresh=await p.evaluate(async({side,level})=>{
   newGame(0,1);V.intro=null;G.auto=side==='p';G.turn=side;G.ev=[];
   G[side].mp=2;G[side].hand=[mk(BN['Potion of Speed'])];
   G[opp(side)].hp=G[opp(side)].mx=100;
   const u=mk(BN.Squire);u.o=side;u.ready=true;u.mv=u.init;G.b[side==='p'?0:16]=u;
   render();const early=aiT(G[side].hand[0],side);
   await aiPlay(side,level);
   const events=G.history.filter(h=>h.kind==='attack'||h.kind==='spell');
   return{early,order:events.map(h=>h.kind),hand:G[side].hand.length,mana:G[side].mp};
  },{side,level});
  assert.deepEqual(refresh,{early:null,order:['attack','spell','attack'],hand:0,mana:0},'Speed follows initial attack and grants another: '+side+' level '+level);
 }
 const holds=await p.evaluate(()=>{
  newGame(0,1);V.intro=null;G.p.hand=[mk(BN['Potion of Speed']),mk(BN['Arcane Insight'])];G.p.deck=[];
  const u=mk(BN.Squire);u.o='p';u.ready=true;u.mv=u.init;G.b[16]=u;render();
  return{speed:aiT(G.p.hand[0],'p'),draw:aiT(G.p.hand[1],'p')};
 });
 assert.deepEqual(holds,{speed:null,draw:null},'hold unused Speed and empty-deck draw');
 assert.deepEqual(errors,[]);
 await browser.close();console.log('PASS Auto-play/campaign at every skill: five-to-seven-card draws and attack → Speed → attack');
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
