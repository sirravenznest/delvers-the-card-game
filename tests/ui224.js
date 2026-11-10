// PLAYWRIGHT_MODULE=/path/to/playwright-core node tests/ui224.js
// Serve the repository at http://127.0.0.1:8765 before running.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const URL=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
const sizes=[[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]];
const tabs=['hub','duel','ranked','cards','deck','store','packs','missions','friends','profile','lore','guide'];
let browser;
async function pageFor(w,h){
 const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:true});
 await context.addInitScript(()=>{localStorage.setItem('delvers_mute','1');if(!localStorage.getItem('delvers_consent'))localStorage.setItem('delvers_consent','2026-11-09')});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL);await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 return {page,context,errors};
}
async function run(){
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const [w,h] of sizes){
  const {page:p,context,errors}=await pageFor(w,h);
  assert.equal(await p.evaluate(()=>V.saveMsg),'','new save has no false storage warning');
  assert.equal(await p.locator('.hubTile').count(),11);
  assert.equal(await p.locator('.hubHeader').count(),1,'one combined hub header');
  assert.equal(await p.locator('[data-a="tutstart"]').count(),1,'no duplicate tutorial prompts');
  for(const tab of tabs){
   await p.evaluate(tab=>{V.v=tab;V.fo=false;render()},tab);
   assert(await p.locator(`[data-v="${tab}"].on`).count(),`${w} ${tab} selected`);
   const dims=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,app:document.getElementById('app').getBoundingClientRect().right>innerWidth+1}));
   assert(!dims.overflow&&!dims.app,`${w}x${h}: ${tab} fits horizontally`);
   if(tab=='cards')assert(await p.locator('.main .card').first().evaluate(e=>e.getBoundingClientRect().top<innerHeight-60),'cards immediately visible beside tools');
   if(tab=='deck'){
    const layout=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:r.height}};return{workspace:box('.deckWorkspace'),status:box('.dkbar'),search:box('#fq'),sort:box('[data-f="so"]'),filters:box('[data-a="fopen"]'),gallery:box('.deckCardGrid'),cards:box('.deckCardGrid .cc'),list:box('.dlist'),overflow:document.getElementById('app').scrollHeight>document.getElementById('app').clientHeight+1}});
    assert(!layout.overflow,`${w}x${h}: deck workspace fits without page scrolling`);
    assert(layout.gallery.height>=(h<=340?95:h<=380?135:h<=420?165:340),`${w}x${h}: gallery has usable height: ${JSON.stringify(layout)}`);
    assert(layout.cards.top>=layout.gallery.top&&layout.cards.bottom<=layout.gallery.bottom+1,`${w}x${h}: first deck card and controls fit in gallery`);
    assert(['status','search','sort','filters','list'].every(k=>layout[k].height>0&&layout[k].top>=layout.workspace.top&&layout[k].bottom<=h+1),`${w}x${h}: deck controls and list stay visible`);
   }
   if(tab=='duel')assert(await p.locator('.book').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}),'open book fits landscape');
  }
  await p.evaluate(()=>{V.v='cards';render()});
  const collectionCard=p.locator('.main .card').first(),name=await collectionCard.getAttribute('data-z');
  await collectionCard.dispatchEvent('pointerdown',{pointerType:'touch',clientX:220,clientY:100});
  await p.waitForSelector('#zm[role="dialog"]');
  assert((await p.locator('#zm').innerText()).includes(name),'touch hold opens card details');
  await collectionCard.dispatchEvent('pointerup',{pointerType:'touch'});
  await p.keyboard.press('Escape');assert.equal(await p.locator('#zm').count(),0);
  await collectionCard.dispatchEvent('contextmenu');
  assert.equal(await p.locator('#zm .card .stat').count(),6);
  await p.click('#zm',{force:true});assert.equal(await p.locator('#zm').count(),0);
  await collectionCard.hover();await p.waitForSelector('#zm.hover');
  await p.mouse.move(1,1);await p.waitForSelector('#zm',{state:'detached'});
  await p.evaluate(()=>{V.v='store';render()});
  await p.click('[data-a="storecategory"][data-k="cosmetics"]');
  assert.equal(await p.locator('.sceneThumb').count(),12);
  assert(await p.evaluate(()=>[...document.querySelectorAll('.sceneThumb')].every(e=>getComputedStyle(e).backgroundImage.startsWith('url'))),'store preview source');
  await p.evaluate(()=>{V.v='packs';V.rates=true;render()});
  assert.equal(await p.locator('table.rates').count(),3);
  assert((await p.locator('table.rates').first().innerText()).includes('Legendary'));
  const clipping=await p.evaluate(()=>{
   const bad=[],original=document.getElementById('app').innerHTML;
   for(const c of ALL){
    for(const mode of ['pack','zoom']){
     document.getElementById('app').innerHTML=mode=='pack'?(()=>{V.pk={c:[c],i:0,sh:1,ph:2,n:1};return pkHTML()})():`<div id="zm">${zoomHTML(c,false)}</div>`;
     const el=document.querySelector('.card'),r=el.getBoundingClientRect();
     if(r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)bad.push(c.name+' '+mode+' bounds');
     for(const e of el.querySelectorAll('.cardName,.identity,.abilities,.effect,.stats'))if(e.scrollHeight>e.clientHeight+1)bad.push(c.name+' '+mode+' clipped '+e.className);
     if(c.t=='c'&&[...el.querySelectorAll('.stat b')].map(e=>e.textContent).join()!=statDefs.map(x=>x[0]).join())bad.push(c.name+' stat order');
    }
   }
   V.pk=null;document.getElementById('app').innerHTML=original;return bad;
  });
  assert.deepEqual(clipping,[],`${w}x${h}: all 122 cards visible`);
  await p.evaluate(()=>{V.v='duel';newGame(0,1);V.intro=null;G.p.hand=['Squire','Archmage','Goblin Skulker','Dagger'].map(n=>mk(BN[n]));render()});
  const battle=await p.evaluate(()=>{const app=document.getElementById('app'),hand=document.querySelector('.hand'),end=document.querySelector('[data-a="end"]').getBoundingClientRect(),card=hand.querySelector('.card').getBoundingClientRect(),tray=document.querySelector('.hw').getBoundingClientRect(),board=document.querySelector('.board').getBoundingClientRect();return {overflow:app.scrollHeight>app.clientHeight+1,cardTop:card.top,cardBottom:card.bottom,hand:hand.getBoundingClientRect().bottom,end:end.bottom,vh:innerHeight,trayTop:tray.top,trayBottom:tray.bottom,trayWidth:tray.width,boardBottom:board.bottom,appWidth:app.clientWidth}});
  assert(!battle.overflow&&battle.cardTop>=0&&battle.cardBottom<=h+1&&battle.end<=h+1,`${w}x${h} battle fit: ${JSON.stringify(battle)}`);
  assert(battle.trayTop>=battle.boardBottom&&battle.trayBottom>=h-8,'hand stays below the battlefield at the bottom');
  assert(battle.trayWidth>=battle.appWidth-20,'hand spans the combat screen, not a side column');
  const crowded=await p.evaluate(()=>{
   const creatures=ALL.filter(c=>c.t=='c').sort((a,b)=>b.hp-a.hp);
   G.b=Array.from({length:NT},(_,i)=>{const u=mk(creatures[i%creatures.length]);u.o=i%2?'e':'p';u.sP=1;u.sA=1;u.sI=1;u.k2='tough thorns lifelink';return u});
   G.p.hand=Array.from({length:7},(_,i)=>mk(creatures[i]));render();
   const bad=[];
   if(document.querySelector('.nav,.hubGrid'))bad.push('menu navigation leaked into battle');
   for(const tile of document.querySelectorAll('.tile.u')){
    const r=tile.getBoundingClientRect();
    const mine=G.b[+tile.dataset.i].o=='p',style=getComputedStyle(tile);
    if(tile.querySelector('.tileOwner').textContent!=(mine?'YOU':'FOE'))bad.push('wrong owner badge');
    if(!tile.getAttribute('aria-label').startsWith(mine?'Your unit:':'Opponent unit:'))bad.push('wrong accessible owner');
    if(style.borderLeftStyle!=(mine?'solid':'dashed'))bad.push('ownership border lost');
    if(style.borderLeftColor!=(mine?'rgb(114, 198, 255)':'rgb(245, 155, 137)'))bad.push('ownership colour lost');
    for(const e of tile.querySelectorAll('.stats,.stat b,.stat strong')){
     const x=e.getBoundingClientRect();
     if(x.top<r.top||x.bottom>r.bottom||e.scrollWidth>e.clientWidth+1)bad.push(tile.dataset.i+' clipped '+e.className+': '+e.textContent);
    }
   }
   for(const e of document.querySelectorAll('.hand .card .stats,.hand .card .abilities')){
    if(e.scrollHeight>e.clientHeight+1)bad.push('hand '+e.className);
   }
   return bad;
  });
  assert.deepEqual(crowded,[],`${w}x${h}: full board, equipped units and seven-card hand`);
  const highlights=await p.evaluate(()=>{
   const own=document.querySelector('.tile.p'),foe=document.querySelector('.tile.e'),out=[];
   for(const cls of ['ready','done','sel','tgt']){
    own.classList.add(cls);foe.classList.add(cls);
    for(const [tile,label] of [[own,'YOU'],[foe,'FOE']]){
     const style=getComputedStyle(tile);
     if(tile.querySelector('.tileOwner').textContent!=label||style.borderLeftColor!=(label=='YOU'?'rgb(114, 198, 255)':'rgb(245, 155, 137)'))out.push(cls+' hides '+label);
    }
    own.classList.remove(cls);foe.classList.remove(cls);
   }
   return out;
  });
  assert.deepEqual(highlights,[],'selection, readiness, exhaustion and targeting preserve ownership');
  await p.evaluate(()=>{G.b=Array(NT).fill(null);render()});
  await p.evaluate(()=>{document.querySelector('.hand').scrollLeft=150});
  const left=await p.evaluate(()=>document.querySelector('.hand').scrollLeft);
  await p.evaluate(()=>render());
  assert.equal(await p.evaluate(()=>document.querySelector('.hand').scrollLeft),left,'hand position preserved');
  const logState=await p.evaluate(()=>{DelversEngine.use(G);for(let i=0;i<90;i++)DelversEngine.log('Review event '+i,i%2?'damage':'roll',i%2?'e':'p');DelversEngine.log('<img src=x onerror=alert(1)>','info','p');render();return DelversPvp.hash(G)});
  await p.click('[data-a="logtoggle"]');
  assert.equal(await p.locator('#battleLog .logEvent').count(),92,'history retains more than three entries');
  assert.equal(await p.locator('#battleLog .logEvent img').count(),0,'log text is escaped');
  assert(await p.locator('#battleLog').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth+1}),'combat review fits landscape');
  assert.equal(await p.locator('.logEvent').first().evaluate(e=>getComputedStyle(e).display),'grid','turn events do not inherit battlefield turn-banner styling');
  await p.keyboard.press('Shift+Tab');
  assert(await p.locator('.logEntries').evaluate(e=>e===document.activeElement),'keyboard focus stays inside review');
  await p.keyboard.press('Tab');
  assert(await p.locator('#battleLog [data-a="logtoggle"]').evaluate(e=>e===document.activeElement),'keyboard focus wraps back to Close');
  await p.locator('.logEntries').evaluate(e=>e.scrollTop=0);await p.waitForTimeout(80);
  assert.equal(await p.evaluate(()=>V.logFollow),false,'scrolling back suspends following');
  await p.evaluate(()=>{DelversEngine.log('New live event','damage','e');render()});
  assert.equal(await p.locator('.logEntries').evaluate(e=>e.scrollTop),0,'new events do not interrupt review');
  await p.click('[data-a="logfilter"][data-k="roll"]');
  assert.equal(await p.locator('#battleLog .logEvent:not(.event-roll)').count(),0,'roll filter excludes other events');
  await p.click('[data-a="logfilter"][data-k="all"]');
  await p.click('[data-a="loglatest"]');
  assert(await p.locator('.logEntries').evaluate(e=>e.scrollHeight-e.scrollTop-e.clientHeight<8),'follow latest reaches newest event');
  await p.keyboard.press('Escape');
  assert.equal(await p.locator('#battleLog').count(),0);
  assert.equal(await p.evaluate(()=>DelversPvp.hash(G)),logState,'review never changes rules or randomness');
  await p.mouse.move(1,1);
  await p.evaluate(()=>{
   G.b=Array(NT).fill(null);G.sel=null;
   const own=mk(BN['Goblin Skulker']),foe=mk(BN['Goblin Skulker']);
   own.o='p';own.mv=2;own.ready=true;foe.o='e';
   G.b[8]=own;G.b[16]=foe;render();
  });
  await p.click('.tile[data-i="8"]');
  await p.click('.tile[data-i="4"]');
  assert.equal(await p.locator('.tile[data-i="4"] .tileOwner').innerText(),'YOU','a real move into the opposing half preserves your ownership');
  assert.equal(await p.locator('.tile[data-i="16"] .tileOwner').innerText(),'FOE','an opponent in your deployment row is still labelled FOE');
  await p.evaluate(()=>{G.b=Array(NT).fill(null);G.sel=null;render()});
  await p.evaluate(()=>{const u=mk(BN['Goblin Skulker']);u.o='p';u.atk+=1;u.mhp+=2;u.hp=1;u.mv=0;u.sP=1;u.k2='tough';G.b[16]=u;render()});
  const tile=p.locator('.tile.u');
  assert.equal(await tile.locator('.stat').count(),6,'all six board stats retained');
  const handBefore=await p.evaluate(()=>G.p.hand.length);
  await tile.dispatchEvent('pointerdown',{pointerType:'touch',clientX:30,clientY:200});
  await p.waitForSelector('#zm');
  assert.equal(await p.locator('#zm .stat.changed').count(),2,'zoom uses modified attack and health');
  assert((await p.locator('#zm').innerText()).includes('Weapon'),'live equipment details retained');
  assert((await p.locator('#zm .abilities').innerText()).includes('Tough'),'live extra abilities retained');
  await tile.dispatchEvent('pointerup',{pointerType:'touch'});await p.keyboard.press('Escape');
  assert.equal(await p.evaluate(()=>G.p.hand.length),handBefore,'inspection does not play a card');
  await p.evaluate(()=>{G.p.hp=0;G.over='e';render()});
  await p.click('#ov [data-a="logtoggle"]');
  assert(await p.locator('#battleLog').isVisible(),'combat history remains accessible from results');
  await p.click('#battleLog [data-a="logtoggle"]');
  const beforeRetry=await p.evaluate(()=>({gold:S.gold,tier:G.tier,oi:G.oi,missions:JSON.stringify(S.ms)}));
  assert.equal(await p.locator('[data-a="retry"]').count(),1);
  await p.click('[data-a="retry"]',{force:true});
  const afterRetry=await p.evaluate(()=>({gold:S.gold,tier:G.tier,oi:G.oi,missions:JSON.stringify(S.ms),over:G.over,hp:G.p.hp}));
  assert.equal(afterRetry.gold,beforeRetry.gold);assert.equal(afterRetry.missions,beforeRetry.missions);
  assert.equal(afterRetry.tier,beforeRetry.tier);assert.equal(afterRetry.oi,beforeRetry.oi);assert(!afterRetry.over&&afterRetry.hp==20,'retry resets fight');
  await p.click('[data-a="battleintro"]',{force:true});
  const beforeEmote=await p.evaluate(()=>({hp:G.p.hp,mp:G.p.mp,hand:G.p.hand.length,gold:S.gold}));
  await p.click('[data-a="emotetoggle"]',{force:true});
  await p.click('[data-a="emotesend"][data-k="hello"]',{force:true});
  await p.waitForSelector('.emoteBubble');
  assert.deepEqual(await p.evaluate(()=>({hp:G.p.hp,mp:G.p.mp,hand:G.p.hand.length,gold:S.gold})),beforeEmote,'emotes are cosmetic');
  await p.click('[data-a="emotetoggle"]',{force:true});await p.click('[data-a="emotemute"]',{force:true});
  assert(await p.evaluate(()=>S.emotesMuted),'opponent emotes can be muted');
  await p.click('[data-a="emotetoggle"]',{force:true});
  await p.evaluate(()=>startTut());
  assert(await p.locator('.lessonCoach').evaluate(e=>{
   const r=e.getBoundingClientRect();
   return r.top>=document.querySelector('.board').getBoundingClientRect().bottom&&r.bottom<=innerHeight+1&&[...e.querySelectorAll('button')].every(b=>{const x=b.getBoundingClientRect();return x.top>=r.top&&x.bottom<=r.bottom});
  }),'tutorial instructions and navigation fit beside the bottom hand');
  assert.deepEqual(errors,[],`${w}x${h} JS errors`);
  console.log('PASS menus, all-card template, pack/zoom, battle, scrolling, retry',w,h);
  await context.close();
 }
 const {page:deckPage,context:deckContext}=await pageFor(844,390);
 await deckPage.evaluate(()=>{V.v='deck';V.q='';V.fs={};V.fo=false;V.fd=false;V.un=false;V.bo=false;S.deck=[];S.builds=[];render()});
 await deckPage.fill('#fq','Squire');
 assert.deepEqual(await deckPage.locator('.deckCardGrid .cardName').allTextContents(),['Squire'],'deck search narrows the card gallery');
 await deckPage.click('[data-a="fopen"]');
 assert(await deckPage.locator('.deckFilterPanel').isVisible(),'deck filter panel opens');
 await deckPage.click('[data-a="ftog"][data-g="t"][data-k="c"]');
 assert(await deckPage.locator('.deckCardGrid .cardName').count()>0,'deck type filter retains matching cards');
 assert(await deckPage.locator('.deckCardGrid .cardName').evaluateAll(es=>es.every(e=>ALL.some(c=>c.name==e.textContent&&c.t=='c'))),'deck type filter excludes other card types');
 await deckPage.click('[data-a="fclr"]');
 await deckPage.fill('#fq','Squire');
 await deckPage.locator('.deckCardGrid .stp [data-a="dp"]').click();
 assert.deepEqual(await deckPage.evaluate(()=>S.deck),['Squire'],'deck card add control adds a card');
 await deckPage.locator('.dlist [data-a="dm"]').click();
 assert.deepEqual(await deckPage.evaluate(()=>S.deck),[],'deck list remove control removes a card');
 await deckPage.locator('.deckCardGrid .stp [data-a="dp"]').click();
 await deckPage.click('.rules summary');
 await deckPage.fill('#bn','UI test build');
 await deckPage.click('[data-a="bsave"]');
 assert.deepEqual(await deckPage.evaluate(()=>S.builds.map(b=>b.name)),['UI test build'],'saved-build control saves the current deck');
 await deckPage.click('[data-a="clear"]');
 assert.deepEqual(await deckPage.evaluate(()=>S.deck),[],'clear deck control clears the current deck');
 await deckPage.click('.rules [data-a="bload"]');
 assert.deepEqual(await deckPage.evaluate(()=>S.deck),['Squire'],'saved build restores the deck');
 await deckContext.close();
 const {page:p,context,errors}=await pageFor(844,390);
 await p.evaluate(()=>startTut());
 const perform=async actions=>{for(const [a,i] of actions){const selector=`[data-a="${a}"]${i==null?'':`[data-i="${i}"]`}`;await p.click(selector,{force:true})}assert(await p.evaluate(()=>G.lesson.done),'lesson action completed');await p.click('[data-a="lessonnext"]')};
 await perform([['hand',0],['cell',16]]);
 await perform([['end']]);
 await perform([['cell',16],['cell',12]]);
 await perform([['cell',12],['cell',8]]);
 await perform([['hand',0],['cell',8]]);
 await perform([['hand',0],['cell',16]]);
 await perform([['hand',0],['cell',16]]);
 await perform([['cell',0],['ehero']]);
 assert(await p.evaluate(()=>G.tut&&!G.lesson),'lessons lead to practice');
 const beforePractice=await p.evaluate(()=>({gold:S.gold,prog:S.prog,ms:JSON.stringify(S.ms)}));
 await p.evaluate(()=>{G.over='p';render()});
 assert.equal(await p.locator('[data-a="retry"]').count(),0,'no retry after victory');
 assert.deepEqual(await p.evaluate(()=>({gold:S.gold,prog:S.prog,ms:JSON.stringify(S.ms)})),beforePractice,'tutorial rewards no gold or missions');
 await p.click('#ov [data-a="quit"]',{force:true});
 assert.equal(await p.locator('[data-a="pickst"]').count(),3);
 await p.click('[data-a="pickst"][data-id="iron"]',{force:true});
 assert(await p.evaluate(()=>S.sp=='done'&&S.deck.length==30));
 const saved=await p.evaluate(()=>({col:S.col,gold:S.gold,deck:S.deck,stars:S.stars,packs:S.packs,sp:S.sp}));
 await p.reload();
 assert.deepEqual(await p.evaluate(()=>({col:S.col,gold:S.gold,deck:S.deck,stars:S.stars,packs:S.packs,sp:S.sp})),saved,'save reload');
 await p.evaluate(()=>{S.packs.std=1;V.v='packs';sv();render()});
 const owned=await p.evaluate(()=>ALL.reduce((n,c)=>n+own(c.name),0));
 await p.click('[data-a="open"]');await p.click('[data-a="pks"]',{force:true});
 assert.equal(await p.evaluate(()=>ALL.reduce((n,c)=>n+own(c.name),0)),owned+5,'skip keeps cards');
 await p.reload();assert.equal(await p.evaluate(()=>ALL.reduce((n,c)=>n+own(c.name),0)),owned+5,'pack save persists');
 await p.evaluate(()=>{V.v='store';V.storeTab='emotes';S.gold=400;render()});
 assert(await p.evaluate(()=>DelversEmotes.defaults.every(id=>S.cosmetics.emotes.includes(id))),'base text emotes are included automatically');
 assert.equal(await p.locator('[data-a="emoteunlock"][data-k="wellplayed"]').count(),0,'base text is not a Store purchase');
 await p.click('[data-a="emoteunlock"][data-k="ember"]',{force:true});
 assert.equal(await p.evaluate(()=>S.gold),50,'graphic emote costs gold');
 assert(await p.locator('[data-a="emoteunlock"][data-k="ember"]').isDisabled(),'owned graphics cannot be bought twice');
 assert(await p.locator('[data-a="emoteunlock"][data-k="heart"]').isDisabled(),'cannot buy graphics without enough gold');
 await p.reload();assert(await p.evaluate(()=>S.cosmetics.emotes.includes('ember')),'emote purchase saved');
 await p.evaluate(()=>{S.prog=0;S.stars={};S.sp='done';V.v='duel';newGame(0,1);V.intro=null;G.over='p';render()});
 assert.equal(await p.locator('[data-a="nextstory"]').count(),1,'victory offers next story encounter');
 await p.click('[data-a="nextstory"]',{force:true});
 assert.equal(await p.evaluate(()=>V.brief),1);
 assert((await p.locator('.storyBrief').innerText()).includes(await p.evaluate(()=>STORY[0].after)),'next scene follows the discovery');
 await p.click('[data-a="begin"]',{force:true});
 assert((await p.locator('.storyIntro').innerText()).includes(await p.evaluate(()=>STORY[1].line)),'story intro has text dialogue');
 await p.click('[data-a="battleintro"]',{force:true});
 await p.evaluate(()=>{G=null;V.v='duel';V.brief=null;render()});
 assert.equal(await p.locator('.bookChapter').count(),1);assert.equal(await p.locator('.bookPages').count(),1);
 await p.locator('.storyContinue').click({force:true});assert.equal(await p.evaluate(()=>V.brief),1,'book resumes the next uncleared encounter');
 await p.click('[data-a="back"]',{force:true});
 for(let i=0;i<3;i++)await p.click('[aria-label="Next pages"]',{force:true});
 assert.equal(await p.evaluate(()=>V.chapter),1,'turning pages crosses into the next chapter');
 assert.equal(await p.locator('.pageFolio').first().innerText(),'Vaelmark\n7','page numbers continue across chapters');
 for(const tier of [2,3]){
  await p.evaluate(tier=>{S.stars[0]=tier-1;newGame(0,tier);V.intro=null;G.over='e';render()},tier);
  const gold=await p.evaluate(()=>S.gold);await p.click('[data-a="retry"]',{force:true});
  assert.equal(await p.evaluate(()=>G.tier),tier,'retry retains higher difficulty');
  assert.equal(await p.evaluate(()=>S.gold),gold,'higher-tier retry does not repeat payout');
 }
 await p.evaluate(()=>{G=null;V.intro=null;S.prog=59;newGame(59,1);V.intro=null;G.over='p';render()});
 assert.equal(await p.locator('[data-a="nextstory"]').count(),0,'last story battle is an ending, not an invalid next battle');
 assert((await p.locator('#ov').innerText()).includes('Your legend is written'),'campaign ending shown');
 const legacy=await p.evaluate(()=>{
  const old={...S,gold:731,prog:17,ver:2,stars:{0:3,16:2},sp:'done',sd:['iron'],avatar:'phoenix',
   cosmetics:{avatars:['phoenix'],backgrounds:['ashen-road'],scene:'ashen-road'},packs:{std:3,t2:2,t3:1}};
  for(const n of ['Sister Cera, Last Candle','Nim, Gatemarket Guide','Ashen Road Escort','Hollow Seal Scribe','Gloamwood Lookout','Rustfang Runner','Emberwatch Vigil','Deep Anvil Charm'])delete old.col[n];
  localStorage.setItem(SAVE_KEY,JSON.stringify(old));return old;
 });
 await p.reload();
 const migrated=await p.evaluate(()=>({gold:S.gold,prog:S.prog,deck:S.deck,stars:S.stars,packs:S.packs,avatar:S.avatar,cosmetics:S.cosmetics,sd:S.sd,col:S.col}));
 for(const key of ['gold','prog','deck','stars','packs','avatar','sd'])assert.deepEqual(migrated[key],legacy[key],'old save retains '+key);
 for(const key of ['avatars','backgrounds','scene'])assert.deepEqual(migrated.cosmetics[key],legacy.cosmetics[key],'old cosmetic ownership retained');
 for(const [name,n] of Object.entries(legacy.col))assert.equal(migrated.col[name],n,'old collection retained '+name);
 assert.equal(Object.keys(migrated.col).length,122);
 await p.evaluate(()=>{localStorage.setItem('delvers_consent','2026-11-04')});await p.reload();
 assert(await p.evaluate(()=>!agreed()),'new ranked bot terms require renewed agreement');
 assert.equal(await p.evaluate(()=>S.gold),731,'consent renewal does not reset progress');
 assert.deepEqual(errors,[]);
 await context.close();console.log('PASS all tutorial actions, starter reward, saves and packs');
 await browser.close();
}
run().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
