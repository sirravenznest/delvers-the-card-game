// Local fixtures verify persisted story outcomes and navigation without live services.
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
 await p.evaluate(()=>{S.sp='done';S.deck=STARTERS[0].list.slice();for(const n of S.deck)S.col[n]=Math.max(3,S.col[n]||0);sv()});
 const enter=async()=>p.locator('[data-a="nav"][data-v="duel"]:visible').first().click({force:true});
 const visible=async index=>{
  assert.equal(await p.locator(`.bookPages [data-a="fight"][data-i="${index}"]`).count(),1,'book opens on encounter '+index+' '+JSON.stringify(await p.evaluate(()=>({prog:S.prog,chapter:V.chapter,page:V.bookPage,view:V.v,game:!!G,brief:V.brief,tutorial:V.menuTutorial}))));
  assert.equal(await p.locator('.storyContinue').getAttribute('data-i'),String(index));
 };
 // Check every saved campaign position, not only chapter starts.
 for(let progress=0;progress<60;progress++){
  await p.evaluate(progress=>{S.prog=progress;V.v='hub';render()},progress);await enter();await visible(progress);
 }
 await p.evaluate(()=>{S.prog=17;S.stars={0:3,15:1,16:2};sv();V.v='hub';render()});
 await p.reload();await p.click('[data-a="titlecontinue"]');await enter();await visible(17);
 assert.equal(await p.locator('.bookPages [role="img"][aria-label="2 of 3 stars"]').count(),1,'saved two-star encounter is shown');
 await p.locator('[aria-label="Previous encounter page"]').click({force:true});
 assert.equal(await p.locator('.bookPages [data-i="17"]').count(),0,'manual browsing works');
 await p.evaluate(()=>render());
 assert.equal(await p.locator('.bookPages [data-i="17"]').count(),0,'background renders preserve manual browsing');
 await p.locator('[data-a="nav"][data-v="hub"]:visible').first().click({force:true});await enter();await visible(17);
 // Winning the final encounter of a chapter must move to the next chapter/page.
 await p.evaluate(()=>{S.prog=8;S.stars={};newGame(8,1);V.intro=null;G.over='p';render()});
 const persisted=await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return{prog:s.prog,stars:s.stars,gold:s.gold,packs:s.packs}});
 assert.equal(persisted.prog,9);assert.equal(persisted.stars[8],1);
 const once=await p.evaluate(()=>{for(let i=0;i<5;i++)render();return{gold:S.gold,packs:S.packs}});
 assert.deepEqual(once,{gold:persisted.gold,packs:persisted.packs},'result renders never repeat rewards');
 await p.click('#ov [data-a="quit"]');await visible(9);
 await p.reload();await p.click('[data-a="titlecontinue"]');await enter();await visible(9);
 assert.equal(await p.evaluate(()=>S.stars[8]),1,'star and chapter progress survive reload');
 await p.locator('[aria-label="Previous encounter page"]').click();
 await p.locator('.bookPages [data-a="fight"][data-i="8"]').click();
 assert.equal(await p.locator('[data-a="tier"][data-i="3"]').isDisabled(),true,'three stars stay locked until two stars are earned');
 assert.equal(await p.locator('[data-a="tier"][data-i="2"]').isEnabled(),true,'next star is unlocked after the first clear');
 await p.click('[data-a="back"]');
 // Upgrade a boss from one to three stars, never advancing the main story twice.
 for(const tier of [2,3]){
  await p.evaluate(tier=>{newGame(8,tier);V.intro=null;G.over='p';render()},tier);
  assert.equal(await p.evaluate(()=>S.prog),9);
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).stars[8]),tier);
  const packs=await p.evaluate(()=>({...S.packs}));
  await p.click('#ov [data-a="quit"]');
  await p.locator('[aria-label="Previous encounter page"]').click({force:true});
  const row=p.locator('.bookPages .op').filter({has:p.locator('[data-a="fight"][data-i="8"]')});
  assert.equal(await row.locator(`[aria-label="${tier} of 3 stars"]`).count(),1,'book shows newly earned tier');
  await row.locator('[data-a="fight"]').click({force:true});
  assert((await p.locator(`[data-a="tier"][data-i="${tier}"]`).getAttribute('aria-label')).includes('cleared'));
  if(tier===2)assert((await p.locator('[data-a="tier"][data-i="3"]').getAttribute('aria-label')).includes('next challenge'));
  await p.click(`[data-a="tier"][data-i="${tier}"]`,{force:true});
  assert.equal(await p.locator(`[data-a="tier"][data-i="${tier}"]`).getAttribute('aria-pressed'),'true');
  assert((await p.locator('.storyBrief').textContent()).includes(tier===2?'×1.35':'×1.75'),'tier text matches reward multipliers');
  await p.click('[data-a="begin"]',{force:true});await p.evaluate(()=>{V.intro=null;G.over='p';render()});
  assert.deepEqual(await p.evaluate(()=>({...S.packs})),packs,'repeating a cleared tier never awards another boss pack');
  await p.click('#ov [data-a="quit"]');
 }
 await p.reload();await p.click('[data-a="titlecontinue"]');await enter();
 assert.equal(await p.evaluate(()=>S.stars[8]),3,'three-star upgrade survives reload');
 const storage=await p.evaluate(()=>{
  const before=localStorage.getItem(SAVE_KEY),set=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(key===SAVE_KEY)throw new Error('test storage full');return set.call(this,key,value)};
  newGame(9,1);V.intro=null;G.over='p';render();
  const result={warning:V.saveMsg,unchanged:localStorage.getItem(SAVE_KEY)===before};
  Storage.prototype.setItem=set;sv();render();return result;
 });
 assert(storage.warning.includes('Progress could not be saved'),'failed story saves show an explicit error');
 assert(storage.unchanged,'failed writes never corrupt the previous save');
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).prog),10,'retry persists the earned progression');
 // Arrange the next uncleared fight for the loss check.
 await p.evaluate(()=>{G=null;S.prog=9;delete S.stars[9];sv()});
 await p.evaluate(()=>{newGame(9,1);V.intro=null;G.over='e';render()});
 await p.click('#ov [data-a="quit"]');await visible(9);
 assert.equal(await p.evaluate(()=>S.stars[9]||0),0,'loss does not award a star');
 // Cloud adoption follows the restored campaign position rather than stale book state.
 await p.evaluate(()=>{
  AU={uid:'fixture',base:0};V.chapter=0;V.bookPage=0;
  const restored=clean({...S,prog:38,stars:{37:3},ts:123});
  adopt(restored);AU=null;V.v='duel';render();
 });
 await visible(38);
 assert.equal(await p.locator('.bookPages [aria-label="3 of 3 stars"]').count(),1,'restored cloud stars render');
 await p.evaluate(()=>{S.prog=59;S.stars={58:2};newGame(59,1);V.intro=null;G.over='p';render()});
 await p.click('#ov [data-a="quit"]');
 assert.equal(await p.locator('.storyComplete').count(),1);
 assert.equal(await p.locator('.bookPages [data-a="fight"][data-i="59"]').count(),1,'completed story opens on its ending');
 await p.reload();await p.click('[data-a="titlecontinue"]');await enter();
 assert.equal(await p.evaluate(()=>S.prog),60);assert.equal(await p.evaluate(()=>S.stars[59]),1);
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS all 60 resume positions, reload, chapter transitions, wins/losses, 1–3 stars, repeat rewards and cloud adoption');
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
