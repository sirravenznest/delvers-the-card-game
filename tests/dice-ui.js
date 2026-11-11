// Local browser fixtures only; no production services.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const [w,h] of [[568,320],[740,360],[915,412],[1280,720]]){
  const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:true}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_mus='1';localStorage.delvers_consent='2026-11-09'});
  await p.route(/firebaseio\.com|googleapis\.com/,route=>route.fulfill({status:403,body:'{}'}));
  await p.goto(url);await p.click('.titleActions .pri');await p.click('[data-a="tutskipmenu"]');
  await p.evaluate(()=>{S.gold=2000;sv();V.v='store';V.storeTab='dice';render()});
  assert.equal(await p.locator('.diceItem').count(),5);
  assert.equal(await p.locator('.diceItem [data-a="dieequip"][disabled]').count(),1);
  await p.click('[data-a="diebuy"][data-k="emberheart"]');
  assert.equal(await p.evaluate(()=>S.gold),1750);assert.equal(await p.evaluate(()=>S.cosmetics.die),'emberheart');
  await p.reload();await p.click('[data-a="titlecontinue"]');
  assert.deepEqual(await p.evaluate(()=>({owned:S.cosmetics.dice,equipped:S.cosmetics.die})),{owned:['emberheart'],equipped:'emberheart'});
  await p.evaluate(()=>{
   V.v='store';V.storeTab='dice';S.gold=100;sv();render();
  });
  assert(await p.locator('[data-a="diebuy"][data-k="starless"]').isDisabled());
  await p.click('[data-a="dieequip"][data-k="classic"]');assert.equal(await p.evaluate(()=>S.gold),100);
  await p.click('[data-a="dieequip"][data-k="emberheart"]');assert.equal(await p.evaluate(()=>S.gold),100);
  const rollback=await p.evaluate(()=>{
   S.gold=1000;sv();const snapshot=JSON.stringify(S),original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k===SAVE_KEY)throw new Error('test storage full');return original.call(this,k,v)};
   document.querySelector('[data-a="diebuy"][data-k="starless"]').disabled=false;
   document.querySelector('[data-a="diebuy"][data-k="starless"]').click();
   Storage.prototype.setItem=original;
   return{same:JSON.stringify(S)===snapshot,error:V.diceMsg};
  });
  assert(rollback.same);assert.match(rollback.error,/not saved/);
  assert(await p.locator('#app').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'Store has no horizontal clipping');
  for(const winner of ['p','e']){
   await p.evaluate(winner=>{
    const original=DelversEngine.rollFirst;
    DelversEngine.rollFirst=()=>({rounds:[{p:10,e:10},winner==='p'?{p:20,e:1}:{p:1,e:20}],winner,rolled:{p:false,e:false}});
    try{newGame(0,1)}finally{DelversEngine.rollFirst=original}
   },winner);
   assert(await p.locator('[data-a="battleintro"]').isDisabled());
   assert.equal(await p.locator('#openingDice .d20[aria-label*="Emberheart"]').count(),1,'Story uses equipped die');
   await p.evaluate(()=>{
    window.audioNodes=0;
    if(!window.originalOscillator){window.originalOscillator=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){window.audioNodes++;return window.originalOscillator.apply(this,args)}}
    mute=false;
   });
   await p.click('[data-a="diceroll"]');
   assert.equal(await p.evaluate(()=>AC.state),'running','rolling gesture unlocks real audio');
   assert(await p.evaluate(()=>window.audioNodes>=8),'dice generate real rolling and settling SFX');
   assert.equal(await p.locator('.d20Rolling').count(),2,'both dice visibly tumble');
   assert.equal(await p.locator('.d20Rolling').first().evaluate(e=>getComputedStyle(e).animationName),'d20Tumble');
   const stable=await p.evaluate(()=>{const dice=document.querySelectorAll('.d20Rolling'),nodes=[...dice];render();render();return nodes.every((n,i)=>n===document.querySelectorAll('.d20Rolling')[i])});
   assert(stable,'background refreshes never restart the roll');
   assert.match(await p.locator('.openingResult').innerText(),/Tie 10–10; rerolled/);
   assert.equal(await p.locator('[data-a="diceroll"]').count(),0,'cannot reroll for a better result');
   assert.equal(await p.evaluate(()=>G.turn),winner);
   await p.emulateMedia({reducedMotion:'reduce'});
   assert.equal(await p.locator('.d20Rolling').first().evaluate(e=>getComputedStyle(e).animationName),'none');
   await p.emulateMedia({reducedMotion:'no-preference'});
   assert(await p.locator('.introBox').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1}),'intro fits the viewport without scrolling');
   await p.click('[data-a="battleintro"]');
   await p.waitForFunction(()=>G&&!G.busy&&G.turn==='p',{timeout:15000});
   assert.equal(await p.evaluate(()=>G.turnNo),winner==='p'?1:2,'foe-first runs exactly one initial foe turn');
   await p.evaluate(()=>{G=null;V.intro=null;mute=true;render()});
  }
  await p.evaluate(()=>{newGame(0,1);window.beforeMutedAudio=window.audioNodes;mute=true});
  await p.click('[data-a="diceroll"]');
  assert.equal(await p.evaluate(()=>window.audioNodes),await p.evaluate(()=>window.beforeMutedAudio),'mute suppresses dice SFX');
  await p.evaluate(()=>{G.over='e';render()});
  assert.equal(await p.locator('#intro').count(),0,'results never trap a player behind an opening roll dialog');
  await p.evaluate(()=>{G=null;V.intro=null;startPractice()});
  assert.equal(await p.locator('#openingDice').count(),0);assert.equal(await p.evaluate(()=>G.turn),'p');assert.equal(await p.evaluate(()=>G.opening),undefined);
  assert.deepEqual(errors,[]);await context.close();
  console.log(`PASS ${w}x${h}: gold purchases/equip/reload/rollback, Story dice/ties/turns, real SFX/mute, animation/reduced-motion and fixed practice`);
 }
 await browser.close();
})().catch(async err=>{console.error(err);if(browser)await browser.close();process.exitCode=1});
