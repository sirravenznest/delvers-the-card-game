// Uses the same local server and Playwright setup as ui224.js.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
const sizes=[[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]];
let browser;
async function fits(p,selector){
 assert(await p.locator(selector).evaluate(el=>{
  const r=el.getBoundingClientRect();
  return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&el.scrollWidth<=el.clientWidth+1;
 }),selector+' fits landscape');
}
async function run(){
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const [width,height] of sizes){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true});
  await context.addInitScript(()=>{
   localStorage.setItem('delvers_mute','1');
   localStorage.setItem('delvers_consent','2026-11-09');
  });
  const p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);
  await p.click('.hubTile[data-v="emotes"]');
  assert.equal(await p.locator('.emoteProduct').count(),10);
  assert.equal(await p.locator('[data-a="emoteunlock"]').count(),0,'collection does not purchase implicitly');
  assert.equal(await p.locator('[data-a="emotesend"]').count(),0,'menu previews do not send');
  const original=await p.evaluate(()=>({gold:S.gold,owned:JSON.stringify(S.cosmetics.emotes)}));
  await p.click('[data-a="emotepreview"][data-k="ember"]');
  await fits(p,'#emoteDialog');
  assert.equal(await p.locator('#emoteDialog .emoteArt').count(),1);
  assert((await p.locator('#emoteDialog').innerText()).includes('350 gold'));
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.a),'emotepreviewclose','preview traps focus');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#emoteDialog').count(),0);
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.k),'ember','preview returns focus');
  assert.deepEqual(await p.evaluate(()=>({gold:S.gold,owned:JSON.stringify(S.cosmetics.emotes)})),original);
  await p.click('[data-a="emotemute"]');
  assert(await p.evaluate(()=>S.emotesMuted));
  await p.click('.emoteCollectionTools [data-a="emoteshop"]');
  assert.equal(await p.evaluate(()=>V.v),'store');
  assert(await p.locator('#emoteStore').evaluate(el=>el.getBoundingClientRect().top>=0&&el.getBoundingClientRect().top<innerHeight),'Store opens directly at emotes');
  await p.evaluate(()=>{S.gold=400;render()});
  await p.click('[data-a="emoteunlock"][data-k="thanks"]');
  assert.equal(await p.evaluate(()=>S.gold),400,'text is free');
  await p.click('[data-a="emotepreview"][data-k="ember"]');
  await p.click('[data-a="emotepreviewclose"]');
  assert.equal(await p.evaluate(()=>S.gold),400,'graphic preview spends nothing');
  await p.click('[data-a="emoteunlock"][data-k="ember"]');
  assert.equal(await p.evaluate(()=>S.gold),50,'graphic unlock costs 350');
  assert(await p.locator('[data-a="emoteunlock"][data-k="ember"]').isDisabled(),'no duplicate purchase');
  assert(await p.locator('[data-a="emoteunlock"][data-k="heart"]').isDisabled(),'insufficient gold blocks graphics');
  assert((await p.locator('[data-emote="heart"]').innerText()).includes('Need 300 more gold'));
  await p.reload();
  assert.deepEqual(await p.evaluate(()=>({gold:S.gold,owned:S.cosmetics.emotes.includes('ember'),muted:S.emotesMuted})),{gold:50,owned:true,muted:true});
  await p.click('.hubTile[data-v="profile"]');
  await p.click('section [data-a="nav"][data-v="emotes"]');
  assert((await p.locator('[data-emote="ember"]').innerText()).includes('Owned'));
  await p.evaluate(()=>{newGame(0,1);V.intro=null;render()});
  await p.click('[data-a="emotetoggle"]');
  await fits(p,'#emoteDialog');
  assert((await p.locator('[data-a="emotesend"][data-k="thanks"]').innerText()).includes('You have my thanks.'));
  assert.equal(await p.locator('[data-a="emotesend"][data-k="ember"]').count(),1);
  assert.equal(await p.locator('[data-a="emotesend"][data-k="heart"]').count(),0,'unowned graphics unavailable');
  assert.equal(await p.locator('#emoteDialog [data-a="emotemute"]').getAttribute('aria-pressed'),'true');
  await p.keyboard.press('Shift+Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.a),'emotemute','picker traps focus');
  await p.evaluate(()=>render());
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.a),'emotemute','rerenders preserve picker focus');
  await p.keyboard.press('Tab');
  assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Close emotes');
  await p.keyboard.press('Escape');
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.a),'emotetoggle');
  await p.click('[data-a="logtoggle"]');
  await p.evaluate(()=>document.querySelector('#battleLog [data-a="logtoggle"]').click());
  await p.click('[data-a="emotetoggle"]');
  const before=await p.evaluate(()=>({hp:G.p.hp,mp:G.p.mp,n:G.n,gold:S.gold}));
  await p.click('[data-a="emotesend"][data-k="ember"]');
  await p.waitForSelector('.emoteBubble.p');
  assert.deepEqual(await p.evaluate(()=>({hp:G.p.hp,mp:G.p.mp,n:G.n,gold:S.gold})),before,'sending remains cosmetic');
  assert.equal(await p.locator('#emoteDialog').count(),0);
  await p.click('[data-a="emotetoggle"]');
  await p.click('[data-a="emotesend"][data-k="thanks"]');
  assert((await p.locator('#emoteDialog [role="alert"]').innerText()).includes('3 seconds'),'cooldown error visible in picker');
  await p.keyboard.press('Escape');
  await p.evaluate(()=>{G.p.hp=0;G.over='e';render()});
  await p.click('#ov [data-a="emotetoggle"]');
  await fits(p,'#emoteDialog');
  await p.click('#emoteDialog [data-a="emotemute"]');
  assert(!await p.evaluate(()=>S.emotesMuted),'result-screen mute updates preference');
  await p.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log('PASS emote menu, Store, previews, purchases, saves, picker and result access',width,height);
  await context.close();
 }
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
