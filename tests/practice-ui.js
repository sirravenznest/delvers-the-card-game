// Serve the repository locally, then run with Node and PLAYWRIGHT_MODULE if needed.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:568,height:320},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await p.goto(process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html');
 await p.locator('.titleActions .pri').click();
 await p.click('[data-a="tutskipmenu"]');
 await p.evaluate(()=>startPractice());
 assert.equal(await p.locator('[data-a="auto"]').count(),0,'practice has no Auto-play control');
 const dialog=p.locator('#tutorialObjective');
 const close=()=>p.click('#tutorialObjective [data-a="tutpromptclose"]');
 const hand=()=>p.click('[data-a="hand"][data-i="0"]',{force:true});
 assert.equal(await dialog.count(),1,'practice opens its initial objective');
 assert.equal(await p.evaluate(()=>tutorialGuide().key),'practice-summon');
 await close();
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.a='auto';document.getElementById('app').appendChild(b);b.click();b.remove()});
 assert.equal(await p.evaluate(()=>!!G.auto),false,'a stale Auto-play action cannot enable practice automation');
 assert(await p.evaluate(async()=>{G.auto=true;const before=JSON.stringify(G);await autoTurn();const unchanged=JSON.stringify(G)===before;G.auto=false;return unchanged}),'the Auto-play runner cannot play practice turns');
 await hand();
 assert.match(await dialog.innerText(),/glowing tile/,'a new placement objective opens once');
 await close();
 await hand();
 assert.equal(await dialog.count(),0,'deselecting a card does not repeat the summon objective');
 await hand();
 assert.equal(await dialog.count(),0,'reselecting a card does not repeat the placement objective');
 await p.click('[data-a="tutpromptopen"]');
 assert.equal(await dialog.count(),1,'seen objectives remain available for manual review');
 await p.keyboard.press('Escape');
 assert.equal(await dialog.count(),0,'Escape dismisses manual review');
 assert(await p.locator('[data-a="tutpromptopen"]').evaluate(e=>e===document.activeElement),'dismissal restores focus');
 for(let i=0;i<4;i++){await hand();assert.equal(await dialog.count(),0,'repeated card toggles do not interrupt play')}
 await p.evaluate(()=>{for(let i=0;i<5;i++)render()});
 assert.equal(await dialog.count(),0,'rendering does not repeat a dismissed objective');

 // Deterministic fixtures cover every contextual objective without relying on shuffled draws.
 const objectives=['summon','place','spell','unit','act','card','end','foe'];
 const setObjective=async key=>{
  await p.evaluate(key=>{
   G.b=Array(NT).fill(null);G.sel=null;G.turn='p';G.busy=false;G.p.hand=[];G.p.mp=3;
   const unit=()=>{const c=mk(BN.Squire);c.o='p';c.ready=true;c.mv=c.init;G.b[16]=c;return c};
   if(key=='summon')G.p.hand=[mk(BN.Squire)];
   if(key=='place'){const c=mk(BN.Squire);G.p.hand=[c];G.sel={m:'place',c}}
   if(key=='spell'){const c=mk(BN['Magic Missile']);G.p.hand=[c];G.sel={m:'spell',c}}
   if(key=='unit')G.sel={m:'unit',c:unit()};
   if(key=='act')unit();
   if(key=='card')G.p.hand=[mk(BN.Dagger)];
   if(key=='end')G.p.mp=0;
   if(key=='foe')G.turn='e';
   showPracticeObjective();render();
  },key);
  assert.equal(await p.evaluate(()=>tutorialGuide().key),'practice-'+key);
 };
 for(const key of objectives){
  await setObjective(key);
  if(key=='summon'||key=='place')assert.equal(await dialog.count(),0,'previously displayed '+key+' stays dismissed');
  else{assert.equal(await dialog.count(),1,'first '+key+' objective opens');await close()}
 }
 for(const key of objectives){await setObjective(key);assert.equal(await dialog.count(),0,'revisited '+key+' does not reopen')}
 await p.evaluate(()=>{G.turn='p';G.e.hand=[];G.e.deck=[];G.e.hp=8;G.e.max=G.e.mp=0;G.p.deck=Array.from({length:10},()=>mk(BN.Squire));G.p.max=0;G.p.mp=0;render()});
 await p.click('[data-a="end"]',{force:true});
 await p.waitForFunction(()=>G.turn=='p'&&!G.busy);
 assert.equal(await p.evaluate(()=>tutorialGuide().key),'practice-summon');
 assert.equal(await dialog.count(),0,'a real foe turn does not repeat the returning summon objective');
 await p.click('[data-a="tutpromptopen"]');
 assert.equal(await dialog.count(),1,'manual review still works after a turn change');
 await close();
 await p.evaluate(()=>startPractice());
 assert.equal(await dialog.count(),1,'a fresh practice fight gets its own initial guidance');
 await close();
 await hand();
 assert.equal(await dialog.count(),1,'a fresh practice fight gets its own placement guidance');
 await close();
 await p.evaluate(()=>{G.over='p';render()});
 assert.equal(await dialog.count(),0,'finished practice has no objective pop-up');
 await p.click('#ov [data-a="quit"]',{force:true});
 assert.equal(await dialog.count(),0,'leaving clears the objective');
 await p.evaluate(()=>startTut());
 assert.equal(await p.locator('[data-a="auto"]').count(),0,'guided lessons have no Auto-play control');
 assert.equal(await dialog.count(),1,'guided lessons still open normally');
 await close();
 await hand();
 await p.click('[data-a="cell"][data-i="16"]',{force:true});
 assert.equal(await dialog.count(),1,'lesson completion still opens Next');
 await p.click('#tutorialObjective [data-a="lessonnext"]');
 assert.equal(await p.evaluate(()=>G.lesson.step),1,'lesson progression is unchanged');
 assert.equal(await dialog.count(),1,'the next lesson opens normally');
 await p.evaluate(()=>{G=null;V.tutPrompt=false;newGame(0,1);V.intro=null;render()});
 assert.equal(await p.locator('[data-a="auto"]').count(),1,'campaign Auto-play remains available');
 assert.deepEqual(errors,[]);
 console.log('PASS practice objectives appear automatically once each, manual review, turn changes, replay and lessons');
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
