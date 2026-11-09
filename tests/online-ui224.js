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
 await p.evaluate(()=>{S.sp='done';sv();V.v='ranked';render()});
 return {p,context,errors};
}
async function enter(p){await p.waitForFunction(()=>G&&G.pvp,{timeout:35000});assert.equal(await p.locator('#intro .introPlayer').count(),2);const bounds=await p.locator('.introBox').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=p.viewportSize().height+1,'intro fits landscape');await p.click('[data-a="battleintro"]');assert(await p.locator('.turnClock').evaluate(e=>e.scrollWidth<=e.clientWidth+1&&e.getBoundingClientRect().right<=innerWidth),'turn timer remains readable')}
async function run(){
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const A=await player('landAlice','Alice'),B=await player('landBob','Bob');
 await A.p.click('[data-a="rfind"]',{force:true});await B.p.click('[data-a="rfind"]',{force:true});
 await enter(A.p);await enter(B.p);
 await A.p.click('[data-a="emotetoggle"]',{force:true});await A.p.click('[data-a="emotesend"][data-k="hello"]',{force:true});
 await B.p.waitForSelector('.emoteBubble.e');assert((await B.p.locator('.emoteBubble.e').innerText()).includes('Hello, Delver!'),'online emote delivered');
 const first=await A.p.evaluate(()=>G.turn=='p')?A:B,second=first===A?B:A;
 await first.p.click('[data-a="end"]');await second.p.waitForFunction(()=>G.turn=='p');
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
 await C.p.reload();await C.p.evaluate(()=>{V.v='ranked';render()});
 await C.p.waitForFunction(()=>NET&&NET.rec&&NET.rec.l==1,{timeout:15000});
 assert.deepEqual(C.errors,[]);
 await C.context.close();console.log('PASS automatic 20-second rated bot, AI turn, loss rating and reload');
 await browser.close();
}
run().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
