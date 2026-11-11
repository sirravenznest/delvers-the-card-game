// Real tutorial interactions, including a missed attack; no live services.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:568,height:320},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await p.goto(url);await p.locator('.titleActions .pri').click();await p.click('[data-a="tutskipmenu"]');
 for(const [width,height] of [[568,320],[640,360],[844,390],[1280,720]])for(const column of [0,1,2,3]){
  await p.setViewportSize({width,height});
  const saved=await p.evaluate(()=>{const s=JSON.stringify(S);V.tutPrompt=true;setupLesson(6);G.rs=7;return s});
  const fits=async()=>assert(await p.locator('#tutorialObjective').evaluate(e=>{
   const r=e.getBoundingClientRect();
   return r.top>=0&&r.bottom<=innerHeight+1&&e.scrollWidth<=e.clientWidth+1&&e.querySelector('.bar').getBoundingClientRect().bottom<=innerHeight;
  }),'ability objective fits '+width+'x'+height);
  await fits();await p.click('[data-a="tutpromptclose"]');
  await p.click('[data-a="hand"][data-i="0"]');await p.click(`[data-a="cell"][data-i="${16+column}"]`);
  assert.equal(await p.evaluate(()=>G.lesson.done),false,'summoning alone cannot complete the ability lesson');
  assert.equal(await p.evaluate(()=>G.lesson.phase),'move');
  assert.match(await p.locator('#tutorialObjective').textContent(),/ready immediately.*Haste/);
  await fits();await p.click('[data-a="tutpromptclose"]');
  await p.click('[data-a="end"]');
  assert.equal(await p.evaluate(()=>G.turn),'p','lesson never requires or allows an intervening turn');
  await p.click(`[data-a="cell"][data-i="${16+column}"]`);
  const sideways=16+(column+1)%4;
  await p.click(`[data-a="cell"][data-i="${sideways}"]`);
  assert.equal(await p.evaluate(i=>G.b[i]?.mv,16+column),2,'irrelevant movement cannot consume the demonstration movement');
  await p.click(`[data-a="cell"][data-i="${12+column}"]`);
  assert.equal(await p.evaluate(()=>G.lesson.phase),'attack');
  assert.equal(await p.evaluate(()=>G.lesson.done),false,'moving alone cannot finish');
  await fits();await p.click('[data-a="tutpromptclose"]');
  await p.click(`[data-a="cell"][data-i="${12+column}"]`);
  assert.equal(await p.evaluate(()=>G.lesson.done),false,'selecting is not an attack');
  await p.click(`[data-a="cell"][data-i="${8+column}"]`);
  assert.equal(await p.evaluate(()=>G.lesson.done),true,'an actual summon-turn attack completes Haste');
  assert.equal(await p.evaluate(()=>G.turnNo),1,'all three actions occurred on the summon turn');
  assert(await p.evaluate(()=>G.history.some(e=>e.kind==='roll'&&e.text.includes('miss'))),'a missed attack still demonstrates the ability');
  assert.match(await p.locator('#tutorialObjective').textContent(),/Haste demonstrated.*Potion of Speed is different/);
  await fits();await p.click('[data-a="lessonnext"]');
  assert.equal(await p.evaluate(()=>G.lesson.step),7);
  assert.equal(await p.evaluate(()=>JSON.stringify(S)),saved,'ability lesson grants no cards, currency or progression');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS Haste requires summon, forward movement and attack in one turn; all four spawn columns, misses, no softlocks or rewards');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
