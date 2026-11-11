// Local browser fixtures only; no production services.
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
 const fixture=await p.evaluate(()=>{
  S.col.Squire=6;S.deck=STARTERS[0].list.slice();for(const n of S.deck)S.col[n]=Math.max(3,S.col[n]||0);
  CF.normalize(S);S.dust=1000;
  const id=S.copies.Squire[3].id;CF.unlock(S,id,'foil','foil');sv();V.v='deck';render();
  return{id,positions:S.deck.map((name,i)=>name==='Squire'?i:-1).filter(i=>i>=0).slice(0,2),count:S.deck.filter(name=>name==='Squire').length};
 });
 assert(fixture.positions.length>=2);
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]]){
  await p.setViewportSize({width,height});
  assert.equal(await p.locator('.deckCopyRow').count(),0,'no duplicate slot list');
  assert.equal(await p.locator('.dlist .deckCopyAction').count(),await p.evaluate(()=>new Set(S.deck).size),'one cosmetic action per grouped card');
  const issues=await p.evaluate(()=>[...document.querySelectorAll('.dlist .dlr')].filter(row=>{
   const r=row.getBoundingClientRect(),els=[...row.children].map(e=>e.getBoundingClientRect());
   return row.scrollWidth>row.clientWidth+1||els.some(e=>e.left<r.left-1||e.right>r.right+1)||els.some((a,i)=>els.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1));
  }).length);
  assert.equal(issues,0,'deck rows do not overlap or clip '+width+'x'+height);
 }
 await p.setViewportSize({width:568,height:320});
 await p.locator('.dlist [data-a="copies"][data-k="Squire"]').click();
 assert.equal(await p.locator('.copyDeck [data-a="copydeck"]').count(),fixture.count);
 assert((await p.locator('#copySelect option:checked').textContent()).includes('In deck'));
 await p.selectOption('#copySelect',fixture.id);
 assert.equal(await p.locator('.copyPreview .cc-foil-foil').count(),1,'purchased appearance is previewed');
 await p.locator(`[data-a="copydeck"][data-i="${fixture.positions[1]}"]`).click();
 assert.equal(await p.evaluate(i=>S.deckCopies[i],fixture.positions[1]),fixture.id);
 assert.equal(await p.locator(`[data-a="copydeck"][data-i="${fixture.positions[1]}"]`).getAttribute('aria-pressed'),'true');
 const old=await p.evaluate(i=>S.deckCopies[i],fixture.positions[0]);
 await p.locator(`[data-a="copydeck"][data-i="${fixture.positions[0]}"]`).click();
 assert.deepEqual(await p.evaluate(ids=>ids.map(i=>S.deckCopies[i]),fixture.positions),[fixture.id,old],'assigning an in-deck copy swaps without losing either copy');
 await p.click('[data-a="copyclose"]');
 await p.evaluate(()=>{V.bo=true;render()});
 await p.fill('#bn','Cosmetic build');await p.click('[data-a="bsave"]');
 await p.reload();await p.locator('.titleActions .pri').click();
 assert.deepEqual(await p.evaluate(ids=>ids.map(i=>S.deckCopies[i]),fixture.positions),[fixture.id,old],'selected copies survive reload');
 assert.deepEqual(await p.evaluate(ids=>ids.map(i=>S.builds.find(b=>b.name==='Cosmetic build').copyIds[i]),fixture.positions),[fixture.id,old],'saved build retains exact copies');
 await p.evaluate(({positions,old})=>{CF.select(S,positions[0],old);sv();V.v='deck';V.bo=true;render()},{positions:fixture.positions,old});
 await p.locator('[data-a="bload"]').click();
 assert.deepEqual(await p.evaluate(ids=>ids.map(i=>S.deckCopies[i]),fixture.positions),[fixture.id,old],'loading a saved build restores exact purchased and plain copies');
 await p.evaluate(()=>{V.v='cards';V.fo=true;V.fs={};V.q='';render()});
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]]){
  await p.setViewportSize({width,height});
  const layout=await p.evaluate(()=>{
   const tools=document.querySelector('.collectionWorkspace .deckTools'),panel=tools.querySelector('.collectionFilterPanel');
   return {arrows:tools.querySelectorAll('.sar').length,nestedScroll:getComputedStyle(panel).overflowY,toolsHorizontal:tools.scrollWidth>tools.clientWidth+1,panelHorizontal:panel.scrollWidth>panel.clientWidth+1,
    overlaps:[...panel.querySelectorAll('.chips')].some(group=>{const children=[...group.children].map(e=>e.getBoundingClientRect());return children.some((a,i)=>children.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1))})};
  });
  assert.deepEqual(layout,{arrows:0,nestedScroll:'visible',toolsHorizontal:false,panelHorizontal:false,overlaps:false},'collection filters fit without overlapping controls '+width+'x'+height);
 }
 await p.locator('.collectionFilterPanel [data-a="ftog"][data-g="r"][data-k="0"]').click();
 assert.equal(await p.locator('.collectionFilterPanel [data-a="ftog"][data-g="r"][data-k="0"]').getAttribute('aria-pressed'),'true');
 assert(await p.evaluate(()=>[...document.querySelectorAll('.collectionWorkspace .grid .card:not(.dim)')].every(e=>BN[e.dataset.z]?.rar===0)),'rarity filter affects displayed cards');
 await p.locator('.collectionFilterPanel [data-a="ftog"][data-g="a"]').last().scrollIntoViewIfNeeded();
 await p.locator('.collectionFilterPanel [data-a="ftog"][data-g="a"]').last().click();
 assert.equal(await p.locator('.collectionFilterPanel [data-a="ftog"][data-g="a"]').last().getAttribute('aria-pressed'),'true','lower filters remain usable after scrolling');
 await p.locator('[data-a="fclr"]').click();
 assert.equal(await p.evaluate(()=>Object.values(V.fs).flat().length),0,'clear all resets filters');
 assert.deepEqual(errors,[]);
 console.log('PASS grouped deck cosmetics, swap and saved copies; collection filter layout and controls at seven sizes');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
