// Serve the repository locally; uses browser fixtures only, never production online services.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const URL=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:568,height:320},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await p.goto(URL);await p.locator('.titleActions .pri').click();await p.click('[data-a="tutskipmenu"]');
 const id=await p.evaluate(()=>{
  S.dust=4000;S.col.Squire=6;S.deck=STARTERS[0].list.slice();for(const n of S.deck)S.col[n]=Math.max(3,S.col[n]||0);
  CF.normalize(S);sv();V.v='cards';render();return S.copies.Squire[3].id;
 });
 await p.click('[data-a="copies"][data-k="Squire"]');
 await p.selectOption('#copySelect',id);
 assert.equal(await p.locator('#copySelect').inputValue(),id);
 const treatments=[['frame','gold',75],['lettering','blue',25],['background','gold-holographic',1200],['foil','foil',300]];
 let dust=4000;
 for(const [slot,treatment,cost] of treatments){
  await p.click(`[data-a="lookpreview"][data-slot="${slot}"][data-k="${treatment}"]`);
  assert.equal(await p.evaluate(()=>S.dust),dust,'preview spends no currency');
  assert(await p.locator(`.copyPreview .cc-${slot}-${treatment}`).count(),'preview has treatment');
  assert.equal(await p.evaluate(({id,slot})=>CF.find(S,id).copy.look[slot]||null,{id,slot}),null,'preview does not equip an unowned treatment');
  await p.click('[data-a="lookbuy"]');
  dust-=cost;assert.equal(await p.evaluate(()=>S.dust),dust);
  assert.equal(await p.evaluate(({id,slot})=>CF.find(S,id).copy.look[slot],{id,slot}),treatment);
 }
 await p.click('[data-a="lookdefault"][data-slot="foil"]');
 assert.equal(await p.evaluate(()=>S.dust),dust,'switching off is free');
 assert(await p.evaluate(id=>CF.protectedCopy(CF.find(S,id).copy),id),'default appearance retains purchase protection');
 await p.click('[data-a="lookpreview"][data-slot="foil"][data-k="foil"]');
 assert.equal(await p.evaluate(()=>S.dust),dust,'switching an unlocked effect on is free');
 const slot=await p.evaluate(()=>S.deck.indexOf('Squire'));
 await p.click(`[data-a="copydeck"][data-i="${slot}"]`);
 assert.equal(await p.evaluate(i=>S.deckCopies[i],slot),id);
 for(const size of [[568,320],[844,390],[1280,720]]){
  await p.setViewportSize({width:size[0],height:size[1]});
  const fits=await p.locator('#copyManager').evaluate(e=>{
   const r=e.getBoundingClientRect(),scroll=e.querySelector('.copyControls'),header=e.querySelector('header');
   return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&scroll.clientHeight>100&&scroll.scrollWidth<=scroll.clientWidth+1&&header.scrollWidth<=header.clientWidth+1;
  });
  assert(fits,'customization fits '+size.join('x'));
 }
 await p.keyboard.press('Tab');
 assert(await p.locator('#copyManager').evaluate(e=>e.contains(document.activeElement)),'focus stays in customization');
 await p.keyboard.press('Escape');
 assert.equal(await p.locator('#copyManager').count(),0);
 await p.evaluate(()=>{V.v='deck';V.bo=true;render()});
 await p.fill('#bn','Styled deck');await p.click('[data-a="bsave"]');
 assert.equal(await p.evaluate(i=>S.builds.find(b=>b.name==='Styled deck').copyIds[i],slot),id);
 const save=await p.evaluate(()=>({...S,ts:0}));
 await p.reload();await p.locator('.titleActions .pri').click();
 assert.deepEqual(await p.evaluate(()=>({...S,ts:0})),save,'reload preserves all per-copy ownership and deck selections');
 await p.evaluate(()=>{V.v='deck';render()});
 assert.equal(await p.locator(`[data-copy="${id}"].card.cc-frame-gold.cc-lettering-blue.cc-background-gold-holographic.cc-foil-foil`).count(),1,'collection/deck displays selected copy cosmetics');
 await p.locator(`[data-copy="${id}"].card`).dispatchEvent('contextmenu');
 assert.equal(await p.locator('#zm .card.cc-foil-foil.cc-background-gold-holographic').count(),1,'menu zoom retains exact look');
 await p.keyboard.press('Escape');await p.waitForTimeout(510);

 // Use real battle handlers after arranging a known card in hand.
 await p.evaluate(id=>{
  newGame(0,1);V.intro=null;
  const i=G.p.deck.findIndex(c=>c.copyId===id);if(i>=0)G.p.hand.push(G.p.deck.splice(i,1)[0]);
  G.p.mp=10;render();
 },id);
 const handIndex=await p.evaluate(id=>G.p.hand.findIndex(c=>c.copyId===id),id);
 assert(handIndex>=0);
 const dressed=p.locator(`.hand .card[data-i="${handIndex}"]`);
 assert(await dressed.evaluate(e=>e.classList.contains('cc-foil-foil')&&e.classList.contains('cc-background-gold-holographic')),'campaign hand shows cosmetics');
 assert(await dressed.evaluate(e=>getComputedStyle(e).borderTopColor==='rgb(142, 228, 176)'),'playable green border survives cosmetics');
 await dressed.click({force:true});await p.click('[data-a="cell"][data-i="16"]',{force:true});
 assert.equal(await p.locator('.tile.u.p.cc-frame-gold.cc-lettering-blue.cc-background-gold-holographic.cc-foil-foil').count(),1,'summoned campaign creature retains all treatments');
 assert.equal(await p.locator('.tile.u.p .tileOwner').textContent(),'YOU','ownership remains distinct');
 await p.locator('.tile.u.p').dispatchEvent('contextmenu');
 assert.equal(await p.locator('#zm .card.cc-frame-gold.cc-foil-foil').count(),1,'live battle zoom retains cosmetics');
 await p.keyboard.press('Escape');await p.waitForTimeout(510);
 await p.evaluate(()=>{const u=G.b[16];u.mv=2;u.ready=true;render()});
 await p.click('[data-a="cell"][data-i="16"]',{force:true});await p.click('[data-a="cell"][data-i="12"]',{force:true});
 assert.equal(await p.locator('.tile.u.cc-foil-foil[data-i="12"]').count(),1,'movement preserves copy appearance');
 for(const state of ['playable','blocked','selected','exhausted']){
  const signals=await p.evaluate(state=>{
   G.b=Array(NT).fill(null);G.sel=null;G.turn='p';G.busy=false;G.p.mp=state==='blocked'?0:10;
   const own=mk(BN.Squire),foe=mk(BN['Giant Rat']);own.o='p';foe.o='e';own.hp--;own.ready=state!=='exhausted';own.mv=state==='exhausted'?0:1;G.b[16]=own;G.b[12]=foe;
   G.p.hand=[mk(BN.Squire),mk(BN['Magic Missile'])];
   if(state==='selected')G.sel={m:'unit',c:own};
   const snapshot=()=>{
    const out={};
    for(const selector of ['.hand .card','.hand .cost','.tile.u','.tileOwner','.stat.changed strong','.rarityBadge','.identity','.tile.done .tileName']){
     out[selector]=[...document.querySelectorAll(selector)].map(e=>{const s=getComputedStyle(e);return{color:s.color,background:s.backgroundColor,border:s.borderColor,borderStyle:s.borderStyle,outline:s.outline,shadow:s.boxShadow,fill:s.webkitTextFillColor}});
    }
    return out;
   };
   render();const plain=snapshot();
   for(const c of [...G.p.hand,...G.b.filter(Boolean)])c.look={frame:'red',lettering:'gold',background:'gold-holographic',foil:'foil'};
   render();return{plain,cosmetic:snapshot()};
  },state);
  assert.deepEqual(signals.cosmetic,signals.plain,'cosmetics preserve all semantic colours for '+state);
 }
 await p.click('[data-a="quit"]',{force:true});
 await p.evaluate(()=>startTut());
 assert.equal(await p.locator('.hand [class*="cc-frame-"],.tile[class*="cc-foil-"]').count(),0,'tutorial uses plain fixtures');
 await p.click('[data-a="tutskip"]',{force:true});
 await p.evaluate(()=>startPractice());
 assert.equal(await p.locator('.hand [class*="cc-frame-"],.hand [class*="cc-background-"],.tile[class*="cc-foil-"]').count(),0,'guided practice uses plain starter copies');
 await p.click('[data-a="tutskip"]',{force:true});

 // Force known pack contents/drop rolls; normal reward/breakdown UI remains real.
 const receipt=await p.evaluate(()=>{
  V.v='packs';S.packs.std=1;CF.normalize(S);
  window.originalPackRoll=packRoll;window.originalGrant=CF.grantPack;
  packRoll=()=>Array(5).fill(BN.Squire);
  CF.grantPack=(s,id,t)=>{const copy=CF.find(s,id).copy;copy.unlocked.foil=['foil'];copy.earned.foil=['foil'];copy.look.foil='foil';CF.grantPack=()=>null;return CF.option('foil','foil')};
  render();return{gold:S.gold,dust:S.dust,oldIds:S.copies.Squire.map(c=>c.id)};
 });
 await p.click('[data-a="open"]');await p.click('.pkpack',{force:true});
 assert.equal(await p.locator('.pkflash').count(),0,'opening never paints the full-screen white flash');
 await p.waitForSelector('.pkback');
 await p.click('.pkback',{force:true});
 const reveal=await p.locator('.pkface').elementHandle();
 const stable=await p.evaluate(async()=>{
  const overlay=document.querySelector('.pkov'),face=document.querySelector('.pkface'),animation=face.getAnimations()[0];
  const samples=[];
  for(let i=0;i<45;i++){
   await new Promise(requestAnimationFrame);
   if(i%5===0)render();
   const style=getComputedStyle(face),matrix=new DOMMatrixReadOnly(style.transform);
   samples.push(overlay===document.querySelector('.pkov')&&face===document.querySelector('.pkface')&&matrix.m11>=.97&&style.opacity==='1');
  }
  return{stable:samples.every(Boolean),sameAnimation:animation===face.getAnimations()[0]};
 });
 assert(stable.stable&&stable.sameAnimation,'first card stays visible and its animation never restarts across background renders');
 assert(await reveal.evaluate(e=>e.isConnected),'first-card DOM remains attached');
 await p.click('[data-a="pks"]',{force:true});
 assert.equal(await p.locator('#packReview').count(),1,'Skip opens an explicit extras review');
 assert(await p.locator('#packReview [data-a="packextrasask"]').evaluate(e=>e===document.activeElement),'review action receives focus');
 assert.equal(await p.locator('#packReview .packReviewCards .card').count(),5,'all obtained cards appear together at the end');
 assert.equal(await p.locator('.main .packExtras,.main .grid .card').count(),0,'Packs menu never contains obtained-card review or breakdown');
 const packIds=await p.evaluate(()=>S.lastPack.ids.slice());
 assert.equal(packIds.length,5);
 assert.equal(await p.locator('.grid .card.cc-foil-foil').count(),1,'pack results show granted foil');
 const normal=packIds.slice(1);
 await p.click('[data-a="packextrasask"]');
 const quote=await p.evaluate(()=>V.packQuote);
 assert.deepEqual(quote.cards.map(c=>c.id),normal,'only plain copies from this pack are offered');
 assert.equal(await p.evaluate(()=>S.gold),receipt.gold,'asking does not destroy cards');
 assert(await p.locator('.packExtras .cosmeticConfirm').innerText().then(x=>x.includes('Arcane Dust')),'confirmation lists both currencies');
 assert(await p.locator('[data-a="packextrasconfirm"]').evaluate(e=>{
  const r=e.getBoundingClientRect();return e===document.activeElement&&r.top>=0&&r.bottom<=innerHeight&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===e;
 }),'destructive confirmation is focused and visible even on short screens');
 await p.click('[data-a="packextrascancel"]');
 assert.equal(await p.evaluate(()=>S.gold),receipt.gold,'cancelling preserves all rewards and cards');
 assert(await p.evaluate(ids=>ids.every(id=>CF.find(S,id)),packIds),'cancel never destroys a pack copy');
 await p.click('[data-a="packextrasask"]');
 await p.click('[data-a="packextrasconfirm"]');
 assert.equal(await p.evaluate(()=>S.gold),receipt.gold+quote.gold);
 assert.equal(await p.evaluate(()=>S.dust),receipt.dust+quote.dust);
 assert(await p.evaluate(ids=>ids.every(id=>CF.find(S,id)),receipt.oldIds),'older collection copies remain untouched');
 assert.equal(await p.locator('[data-a="packextrasask"]').isDisabled(),true,'no duplicate pack payout');
 await p.locator(`#packReview .packExtras [data-a="copies"][data-copy="${packIds[0]}"]`).click();
 await p.click('[data-a="salvageask"]');
 const salvage=await p.evaluate(()=>V.salvageQuote);
 assert.equal(salvage.cards[0].bonus,18,'foil pack copy has a 6% bonus, rounded down');
 await p.click('[data-a="salvagecancel"]');
 assert(await p.evaluate(id=>!!CF.find(S,id),packIds[0]),'cancel preserves cosmetic card');
 await p.click('[data-a="salvageask"]');await p.click('[data-a="salvageconfirm"]');
 assert.equal(await p.evaluate(id=>CF.find(S,id),packIds[0]),null);
 await p.keyboard.press('Escape');
 await p.click('[data-a="packreviewclose"]');
 assert.equal(await p.locator('.packExtras,.packReviewCards,[data-a="packextrasask"]').count(),0,'closing the summary leaves the Packs menu clean');
 await p.evaluate(()=>{V.v='cards';render();V.v='packs';render()});
 assert.equal(await p.locator('.packExtras,.packReviewCards,[data-a="packextrasask"]').count(),0,'returning to Packs does not reopen old results');
 assert(await p.evaluate(id=>!!CF.find(S,id),id),'purchased cosmetic copy survives every breakdown');
 await p.evaluate(()=>{packRoll=window.originalPackRoll;CF.grantPack=window.originalGrant;V.rates=true;render()});
 assert.match(await p.locator('#app').innerText(),/0\.25%/,'exact cosmetic odds are disclosed');
 const final=await p.evaluate(()=>({gold:S.gold,dust:S.dust,lastPack:S.lastPack}));
 await p.reload();await p.locator('.titleActions .pri').click();
 assert.deepEqual(await p.evaluate(()=>({gold:S.gold,dust:S.dust,lastPack:S.lastPack})),final,'reloading cannot replay consumed pack rewards');
 await p.evaluate(id=>{V.v='cards';render();V.copyName='Squire';V.copyId=id;render()},id);
 await p.click('[data-a="lookpreview"][data-slot="frame"][data-k="silver"]');
 const beforeFailure=await p.evaluate(()=>JSON.stringify(S));
 await p.evaluate(()=>{window.realSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===SAVE_KEY)throw new DOMException('Storage full','QuotaExceededError');return window.realSetItem.call(this,k,v)}});
 await p.click('[data-a="lookbuy"]');
 assert.equal(await p.evaluate(()=>JSON.stringify(S)),beforeFailure,'failed save rolls purchase and Dust back together');
 assert.match(await p.locator('#copyManager').innerText(),/not saved|could not be saved/i,'failure is visible');
 await p.evaluate(()=>{Storage.prototype.setItem=window.realSetItem});
 await p.click('[data-a="lookpreview"][data-slot="frame"][data-k="silver"]');await p.click('[data-a="lookbuy"]');
 assert.equal(await p.evaluate(()=>S.dust),JSON.parse(beforeFailure).dust-25,'retry charges once');
 assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(SAVE_KEY)).dust),JSON.parse(beforeFailure).dust-25,'retry persists successfully');
 await p.keyboard.press('Escape');

 // Every rarity and cosmetic reveal remains skippable, readable and reward-neutral.
 for(const [w,h] of [[568,320],[844,390],[1280,720]]){
  await p.setViewportSize({width:w,height:h});
  for(const rarity of [0,1,2,3])for(const cosmetic of [false,true]){
   const before=await p.evaluate(({rarity,cosmetic})=>{
    const c={...ALL.find(c=>c.rar===rarity),look:cosmetic?{foil:'foil',background:rarity===3?'gold-holographic':'holographic'}:{}};
    V.pk={c:[c],i:0,ph:2,sh:0,n:1};render();return{gold:S.gold,dust:S.dust,count:Object.values(S.col).reduce((a,b)=>a+b,0)};
   },{rarity,cosmetic});
   await p.click('.pkback',{force:true});
   assert.equal(await p.locator('.packCosmetic').count(),cosmetic?1:0,'cosmetic reveal is distinct from card rarity');
   assert.equal(await p.locator('.packLegendary').count(),rarity===3?1:0,'Legendary gets its own celebration');
   if(cosmetic)assert.match(await p.locator('.pkCosmeticLabel').innerText(),/COSMETIC DISCOVERY/);
   assert(await p.locator('.packSkip').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e===document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)}),'Skip stays reachable');
   assert(await p.locator('.pkface').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}),'revealed card fits '+w+'x'+h);
   const layout=await p.evaluate(()=>{const a=document.querySelector('.pkface').getBoundingClientRect(),b=document.querySelector('.pkn').getBoundingClientRect();return a.left>=b.right-1||a.right<=b.left+1||a.top>=b.bottom-1||a.bottom<=b.top+1});
   assert(layout,'celebration text does not cover card details');
   await p.click('[data-a="pks"]',{force:true});
   assert(await p.locator('#packReview').evaluate(e=>{
    const r=e.getBoundingClientRect(),body=e.querySelector('.packReviewBody'),button=e.querySelector('[data-a="packreviewclose"]'),b=button.getBoundingClientRect();
    return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&body.clientHeight>50&&body.scrollWidth<=body.clientWidth+1&&b.bottom<=innerHeight&&document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)===button;
   }),'post-pack review and keep button fit '+w+'x'+h);
   await p.click('[data-a="packreviewclose"]');
   assert.deepEqual(await p.evaluate(()=>({gold:S.gold,dust:S.dust,count:Object.values(S.col).reduce((a,b)=>a+b,0)})),before,'reveal and Skip cannot grant or remove rewards');
  }
  await p.evaluate(()=>{V.pk={c:[{...BN.Squire,look:{}}],i:0,ph:2,sh:1,n:1};render()});
  await p.click('.packNext',{force:true});
  assert.equal(await p.locator('#packReview').count(),1,'finishing the final card also opens extras review');
  assert.equal(await p.locator('#zm').count(),0,'stale hover previews cannot cover the extras review');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#packReview').count(),0,'Escape keeps cards and closes the review');
  const beforeAll=await p.evaluate(()=>{
   V.v='packs';V.rates=false;S.packs={std:2,t2:0,t3:0};
   packRoll=()=>Array(5).fill(BN.Squire);CF.grantPack=()=>null;render();
   return{gold:S.gold,dust:S.dust,count:S.col.Squire};
  });
  await p.click('[data-a="openall"]');await p.click('[data-a="pks"]',{force:true});
  assert.equal(await p.locator('#packReview .packReviewCards .card').count(),10,'Open all summary reveals every obtained card');
  await p.locator('#packReview .packReviewCards .card').first().dispatchEvent('contextmenu');
  assert.equal(await p.locator('#zm .card').count(),1,'obtained cards can be inspected from the summary');
  await p.keyboard.press('Escape');
  await p.click('#packReview [data-a="packextrasask"]');
  assert(await p.evaluate(()=>V.packQuote.cards.length===5&&V.packQuote.cards.every(c=>S.lastPack.ids.includes(c.id))),'Open all review includes only the final individual pack');
  assert.match(await p.locator('#packReview').innerText(),/Open all uses only its final pack/,'batch scope is disclosed before confirmation');
  await p.click('[data-a="packreviewclose"]');
  assert.deepEqual(await p.evaluate(()=>({gold:S.gold,dust:S.dust,count:S.col.Squire})),{...beforeAll,count:beforeAll.count+10},'keeping cards abandons pending breakdown without destroying anything');
  await p.evaluate(()=>{packRoll=window.originalPackRoll;CF.grantPack=window.originalGrant;S.lastPack={ids:[]};V.packReview=true;render()});
  assert.match(await p.locator('#packReview').innerText(),/No eligible plain extras/);
  assert(await p.locator('#packReview [data-a="packextrasask"]').isDisabled(),'no spare copies cannot be broken down');
  await p.keyboard.press('Tab');
  assert(await p.locator('#packReview').evaluate(e=>e.contains(document.activeElement)),'keyboard focus stays inside the review');
  await p.click('[data-a="packreviewclose"]');
 }
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.evaluate(()=>{V.pk={c:[{...BN.Squire,look:{foil:'foil'}}],i:0,ph:0,sh:0,n:1};render()});
 assert.equal(await p.locator('.packSkip').count(),1,'initial pack can always be skipped');
 assert.equal(await p.locator('.packSkip').innerText(),'Open all','quick reveal is labelled Open all, not Skip');
 await p.click('.pkpack',{force:true});
 await p.waitForSelector('.pkback');
 await p.click('.pkback',{force:true});
 const animations=await p.locator('.pkov').evaluate(e=>[...e.querySelectorAll('*')].flatMap(x=>[getComputedStyle(x).animationName,getComputedStyle(x,'::before').animationName,getComputedStyle(x,'::after').animationName]).filter(x=>x!=='none'));
 assert.deepEqual(animations,[],'reduced-motion disables foil, holographic and celebration movement');
 await p.click('[data-a="pks"]',{force:true});
 await p.click('[data-a="packreviewclose"]');
 assert.deepEqual(errors,[]);
 console.log('PASS cosmetic purchase/preview, copy selection, persistence, landscape UI, campaign hands/units/zoom, plain tutorials, pack drops and breakdown');
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
