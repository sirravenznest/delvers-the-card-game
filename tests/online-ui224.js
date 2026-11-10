// Same local-server and Playwright setup as ui224.js. Uses only the simulated DB.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const {makeDb,clk}=require('./fakedb');
const db=makeDb(),url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
async function player(uid,name){
 const context=await browser.newContext({viewport:{width:568,height:320},hasTouch:true});
 await context.addInitScript(({uid,name})=>{
  localStorage.setItem('delvers_auth',JSON.stringify({uid,idToken:uid,refresh:'x',exp:Date.now()+1e10,email:uid+'@test.invalid',name}));
  localStorage.setItem('delvers_user_'+uid,name);localStorage.setItem('delvers_mute','1');localStorage.setItem('delvers_consent','2026-11-09');
 },{uid,name});
 await context.route(/firebaseio\.com/,async route=>{
  clk.t=Date.now();const rq=route.request(),r=await db.fetch(rq.url(),{method:rq.method(),body:rq.postData()||undefined});
  await route.fulfill({status:r.status,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(await r.json())});
 });
 await context.route(/googleapis\.com/,route=>route.fulfill({status:404,headers:{'access-control-allow-origin':'*'},body:'{}'}));
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.click('[data-a="titlecontinue"]');
 await p.click('[data-a="tutskipmenu"]');
 await p.evaluate(({uid})=>{
  const n=uid=='landBob'?29:20;
  S.deck=[...ALL.filter(c=>c.rar==0).slice(0,10).flatMap(c=>Array(3).fill(c.name)).slice(0,n-6),...Array(3).fill(ALL.find(c=>c.rar==2).name),...Array(3).fill(ALL.find(c=>c.rar==3).name)];
  for(const name of S.deck)S.col[name]=Math.max(3,S.col[name]||0);
  CF.normalize(S);
  for(const id of S.deckCopies){const {copy}=CF.find(S,id);copy.look={frame:uid==='landAlice'?'gold':'blue',lettering:'silver',background:'holographic',foil:'foil'};for(const slot of CF.SLOTS)copy.unlocked[slot]=[copy.look[slot]];copy.purchased=true}
  S.sp='done';sv();V.v='ranked';render();
 },{uid});
 assert(await p.locator('[data-a="rfind"]').isEnabled(),'normal deck with three Rares and Legendaries is ranked legal');
 assert(!(await p.locator('#app').innerText()).includes('Needs exactly 30 cards'));
 return {p,context,errors};
}
async function enter(p){await p.waitForFunction(()=>G&&G.pvp,{timeout:35000});assert.equal(await p.locator('#intro .introPlayer').count(),2);
 await p.waitForTimeout(650);
 const stableIntro=await p.evaluate(()=>{
  const intro=document.querySelector('#intro'),box=intro.querySelector('.introBox'),button=intro.querySelector('[data-a="battleintro"]');
  button.focus();box.scrollTop=5;
  const scroll=box.scrollTop,animations=box.getAnimations(),time=animations[0]?.currentTime;
  for(let i=0;i<3;i++)pvSync();
  return{same:intro===document.querySelector('#intro'),focus:document.activeElement===button,scroll:box.scrollTop===scroll,animation:box.getAnimations()[0]===animations[0]&&box.getAnimations()[0]?.currentTime===time,count:document.querySelectorAll('#intro').length};
 });
 assert.deepEqual(stableIntro,{same:true,focus:true,scroll:true,animation:true,count:1},'ranked polling preserves intro node, completed animation, focus and scroll without flicker');
 const bounds=await p.locator('.introBox').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=p.viewportSize().height+1,'intro fits landscape');await p.click('[data-a="battleintro"]');assert.equal(await p.locator('#intro').count(),0,'Begin battle dismisses preserved intro');assert(await p.locator('.turnClock').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().right<=innerWidth),'turn timer remains readable');
 assert(await p.evaluate(()=>document.querySelector('.hw').getBoundingClientRect().top>=document.querySelector('.board').getBoundingClientRect().bottom),'online hand is below the board');
 assert.equal(await p.locator('.hand .card.cc-foil-foil.cc-background-holographic').count(),await p.evaluate(()=>G.p.hand.length),'ranked, friendly and bot hands show every selected copy style');
 assert.equal(await p.locator('.hand .card.cc-frame-gold').count(),await p.evaluate(()=>UN()==='Alice'?G.p.hand.length:0),'styles remain attached to the correct online player');
 assert.equal(await p.locator('.combatActions [data-a="quit"]').count(),0,'online combat has Resign, not a redundant inactive Quit');
 assert.equal(await p.locator('.turn .turnState').textContent(),await p.evaluate(()=>G.turn=='p'?'YOUR TURN':'FOE’S TURN'),'turn banner is relative to the online viewer');
 assert.equal(await p.locator('.battleIdentity.you .battlePlayerName').textContent(),await p.evaluate(()=>UN()),'online player is identified by their own username');
 assert.equal(await p.locator('.battleIdentity.foe .battlePlayerName').textContent(),await p.evaluate(()=>G.opp.n),'opponent name is identified independently of host seat');
 assert(await p.locator('body').evaluate(e=>e.classList.contains('turnHighlight')),'online match begins with a visual turn notification');
 assert.equal(await p.evaluate(()=>G.turnNo),await p.evaluate(()=>NET.G.turnNo),'online view retains the actual turn sequence');
 const ownership=await p.evaluate(()=>{
  const saved=NET.G.b;
  NET.G.b=Array(NT).fill(null);
  const a=mk({...BN.Squire,look:NET.G.p.hand[0].look}),b=mk({...BN['Town Guard'],look:NET.G.e.hand[0].look});a.o='p';b.o='e';NET.G.b[0]=a;NET.G.b[19]=b;
  G=pvView();render();
  const result=[...document.querySelectorAll('.tile.u')].map(tile=>({name:tile.dataset.z,owner:tile.querySelector('.tileOwner').textContent,foil:tile.classList.contains('cc-foil-foil'),frame:tile.classList.contains('cc-frame-gold')?'gold':tile.classList.contains('cc-frame-blue')?'blue':null}));
  zoomShow(document.querySelector('.tile.u'));const zoom=document.querySelector('#zm .card');const zoomLook=zoom.classList.contains('cc-foil-foil');document.getElementById('zm').remove();zAt=0;
  NET.G.b=saved;G=pvView();DelversEngine.use(G);render();
  return{seat:NET.seat,units:result,zoomLook};
 });
 assert.deepEqual(ownership.units.map(u=>u.owner).sort(),['FOE','YOU']);
 assert.equal(ownership.units.find(u=>u.name=='Squire').owner,ownership.seat=='p'?'YOU':'FOE','owner is relative to the viewer, not board row or host seat');
 assert.equal(ownership.zoomLook,ownership.units[0].foil,'unit zoom retains the exact online finish');
 assert(ownership.units.find(u=>u.owner==='YOU').foil,'player unit keeps its finish in every online mode');
 if(!await p.evaluate(()=>NET.isBot)){
  assert(ownership.units.every(u=>u.foil),'both seats see the same human unit finishes');
  const myFrame=await p.evaluate(()=>UN()==='Alice'?'gold':'blue');
  assert.equal(ownership.units.find(u=>u.owner==='YOU').frame,myFrame,'online mirroring preserves own frame');
  assert.equal(ownership.units.find(u=>u.owner==='FOE').frame,myFrame==='gold'?'blue':'gold','online mirroring preserves opponent frame');
 }
}
async function run(){
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const A=await player('landAlice','Alice'),B=await player('landBob','Bob');
 await A.p.click('[data-a="rfind"]',{force:true});await B.p.click('[data-a="rfind"]',{force:true});
 await enter(A.p);await enter(B.p);
 await A.p.click('[data-a="emotetoggle"]',{force:true});await A.p.click('[data-a="emotesend"][data-k="hello"]',{force:true});
 await B.p.waitForSelector('.emoteBubble.e');assert((await B.p.locator('.emoteBubble.e').innerText()).includes('Hello, Delver!'),'online emote delivered');
 const first=await A.p.evaluate(()=>G.turn=='p')?A:B,second=first===A?B:A;
 await first.p.click('[data-a="end"]');await second.p.waitForFunction(()=>G.turn=='p');
 assert.equal(await second.p.locator('.turn .turnState').textContent(),'YOUR TURN','online end-turn updates the other player banner');
 assert(await second.p.locator('body').evaluate(e=>e.classList.contains('turnHighlight')),'online turn arrival highlights the screen');
 await second.p.click('[data-a="logtoggle"]');
 assert((await second.p.locator('.logTurn').last().innerText()).includes('Your turn'),'second seat sees its own turn correctly in combat history');
 assert(await second.p.evaluate(()=>G.history.every((h,i)=>h.side==(NET.G.history[i].side==NET.seat?'p':'e'))),'combat log seat labels are mirrored correctly');
 await second.p.keyboard.press('Escape');
 await second.p.click('[data-a="resign"]');await second.p.click('[data-a="resign"]');
 await first.p.waitForFunction(()=>G&&G.over=='p');
 const missions=await first.p.evaluate(()=>JSON.stringify(S.ms));await first.p.waitForTimeout(2100);
 assert.equal(await first.p.evaluate(()=>JSON.stringify(S.ms)),missions,'repeated result updates never duplicate missions');
 assert.equal(await first.p.locator('[data-a="retry"]').count(),0,'no campaign retry in ranked');
 for(const x of [A,B]){await x.p.click('#ov [data-a="quit"]',{force:true});await x.p.evaluate(()=>{V.v='friends';render()})}
 await B.p.waitForFunction(()=>SOC&&SOC.code);
 const code=await B.p.evaluate(()=>SOC.code);
 await A.p.fill('#fc',code);await A.p.click('[data-a="fadd"]',{force:true});
 await B.p.waitForSelector('[data-a="facc"]',{timeout:15000});await B.p.click('[data-a="facc"]',{force:true});
 await A.p.waitForSelector('[data-a="finv"]',{timeout:15000});await A.p.click('[data-a="finv"]',{force:true});
 await B.p.waitForSelector('[data-a="iacc"]',{timeout:15000});await B.p.click('[data-a="iacc"]',{force:true});
 await enter(A.p);await enter(B.p);
 await A.p.click('[data-a="resign"]');await A.p.click('[data-a="resign"]');
 await B.p.waitForFunction(()=>G&&G.over=='p');
 assert((await B.p.locator('#ov').innerText()).includes('no rating change'),'friendly results not rated');
 for(const x of [A,B]){assert.deepEqual(x.errors,[]);await x.context.close()}
 console.log('PASS landscape human ranked and friend invitation/match');
 const C=await player('landSolo','SoloTester');
 await C.p.click('[data-a="rfind"]',{force:true});
 await enter(C.p);
 assert((await C.p.locator('[data-a="ehero"]').innerText()).includes('BOT'),'opponent labelled BOT');
 await C.p.waitForFunction(()=>G.turn=='p'||G.over,{timeout:15000});
 if(!await C.p.evaluate(()=>G.over)){await C.p.click('[data-a="end"]');await C.p.waitForFunction(()=>G.turn=='p'||G.over,{timeout:20000})}
 await C.p.click('[data-a="resign"]');await C.p.click('[data-a="resign"]');
 await C.p.waitForFunction(()=>G.over&&NET.rec&&NET.rec.l==1,{timeout:15000});
 const record=await C.p.evaluate(()=>({r:NET.rec.r,l:NET.rec.l}));
 assert(record.r<1000&&record.l==1,'rated bot loss persisted');
 await C.p.reload();await C.p.click('[data-a="titlecontinue"]');await C.p.evaluate(()=>{V.v='ranked';render()});
 await C.p.waitForFunction(()=>NET&&NET.rec&&NET.rec.l==1,{timeout:15000});
 assert.deepEqual(C.errors,[]);
 await C.context.close();console.log('PASS automatic 20-second rated bot, AI turn, loss rating and reload');
 await browser.close();
}
run().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
