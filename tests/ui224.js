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
 await page.goto(URL);await page.locator('.titleActions .pri').click();
 assert(await page.locator('[aria-labelledby="welcomeName"]').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&e.scrollWidth<=e.clientWidth+1}),'tutorial welcome fits landscape');
 await page.click('[data-a="tutskipmenu"]');await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 return {page,context,errors};
}
async function run(){
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const firstRun=await browser.newContext({viewport:{width:568,height:320},hasTouch:true});
 await firstRun.addInitScript(()=>{if(localStorage.getItem('delvers_mute')===null)localStorage.setItem('delvers_mute','1')});
 const intro=await firstRun.newPage();await intro.goto(URL);
 assert.equal(await intro.locator('.titleScreen').count(),1,'new players see the branded title screen');
 assert.equal(await intro.locator('.hubTile').count(),0,'new players do not skip the title screen');
 assert(await intro.evaluate(()=>{const r=document.querySelector('.titlePanel').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}),'title screen fits a short landscape viewport');
 await intro.click('[data-a="snd"]');
 assert.equal(await intro.evaluate(()=>MUS.mode),'title','title music starts after a user gesture');
 assert.equal(await intro.evaluate(()=>AC&&AC.state),'running','title sound effects can play after the same gesture');
 assert.equal(await intro.evaluate(()=>DelversMenuMusic.titleTheme.name),'Emberheart Awakening','title uses its own original song');
 await intro.click('[data-a="titlesign"]');
 assert.equal(await intro.locator('.gold').innerText(),'Privacy policy · 2026-11-09','Google sign-in opens privacy consent first');
 await intro.click('[data-a="agree"]');
 assert.equal(await intro.locator('.titleScreen').count(),1,'accepting privacy returns to the title screen');
 assert(await intro.evaluate(()=>agreed()),'online consent is recorded');
 await intro.click('[data-a="titleoffline"]');
 assert.equal(await intro.locator('#welcomeName').count(),1,'new players get the tutorial choice after the title');
 assert.equal(await intro.locator('.hubTile').count(),0,'welcome comes before the full hub');
 await intro.click('[data-a="tutstart"]');
 assert(await intro.evaluate(()=>G.tut&&G.lesson.step===0),'Learn to play starts the first guided lesson');
 await intro.click('[data-a="tutskip"]');
 assert.equal(await intro.locator('.hubTile').count(),11,'skipping the lesson enters the hub without an account');
 assert.equal(await intro.evaluate(()=>S.sp),'none','skip is saved for future launches');
 const returning=await intro.evaluate(()=>{S.gold=731;S.prog=4;sv();return S});
 await intro.evaluate(()=>{localStorage.setItem('delvers_mute','1');localStorage.setItem('delvers_mus','1');localStorage.setItem('delvers_title_seen','1')});
 await intro.reload();
 assert.equal(await intro.locator('.titleScreen').count(),1,'returning players see the title even with the legacy seen flag');
 assert.equal(await intro.locator('[data-a="titlecontinue"]').count(),1,'offline returning players get Continue');
 assert.deepEqual(await intro.evaluate(()=>S),returning,'opening the title preserves existing progress');
 assert(await intro.evaluate(()=>agreed()&&mute&&musOff&&MUS.mode===null),'consent and muted audio preferences survive launch');
 assert.equal(await intro.locator('[data-a="agree"]').count(),0,'returning players are not forced to repeat consent');
 await intro.click('[data-a="titlecontinue"]');
 assert.equal(await intro.locator('.hubTile').count(),11,'Continue immediately enters the hub without waiting for animation');
 await intro.locator('.hubTile[data-v="deck"]').click();
 assert.equal(await intro.locator('.titleScreen').count(),0,'normal menu navigation does not replay the title');
 await intro.evaluate(()=>{S.sp='done';sv()});await intro.reload();await intro.click('[data-a="titlecontinue"]');
 assert.equal(await intro.locator('#welcomeName').count(),0,'completed tutorials are not prompted again');
 await intro.evaluate(()=>{S.sp='ptut';sv()});await intro.reload();await intro.click('[data-a="titlecontinue"]');
 assert.equal(await intro.locator('[data-a="openpick"]').count(),1,'earned starter-deck choice is not replaced by onboarding');
 await firstRun.close();
 for(const [w,h] of sizes){
  const {page:p,context,errors}=await pageFor(w,h);
  assert.equal(await p.evaluate(()=>V.saveMsg),'','new save has no false storage warning');
  assert.equal(await p.locator('.hubTile').count(),11);
  assert.equal(await p.locator('.hubHeader').count(),1,'one combined hub header');
  assert.equal(await p.locator('[data-a="tutstart"]').count(),1,'no duplicate tutorial prompts');
  for(const tab of tabs){
   await p.evaluate(tab=>{V.v=tab;V.fo=false;render()},tab);
   assert(await p.locator(`[data-v="${tab}"].on`).count(),`${w} ${tab} selected`);
   assert.equal(await p.locator('small.set').count(),['cards','deck','packs'].includes(tab)?1:0,`${tab}: set text is limited to card-related screens`);
   const dims=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,app:document.getElementById('app').getBoundingClientRect().right>innerWidth+1}));
   assert(!dims.overflow&&!dims.app,`${w}x${h}: ${tab} fits horizontally`);
   if(tab=='cards')assert(await p.locator('.main .card').first().evaluate(e=>e.getBoundingClientRect().top<innerHeight-60),'cards immediately visible beside tools');
   if(tab=='deck'){
    const layout=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,width:r.width,height:r.height}};const list=document.querySelector('.dlist');return{workspace:box('.deckWorkspace'),status:box('.dkbar'),search:box('#fq'),sort:box('[data-f="so"]'),filters:box('[data-a="fopen"]'),gallery:box('.deckCardGrid'),cards:box('.deckCardGrid .cc'),controls:box('.deckCardGrid .cc .stp'),list:box('.dlist'),listNames:[...list.querySelectorAll('.dl span')].map(e=>({width:e.clientWidth,scroll:e.scrollWidth})),categoryPosition:getComputedStyle(list.querySelector('h4')).position,overflow:document.getElementById('app').scrollHeight>document.getElementById('app').clientHeight+1}});
    assert(!layout.overflow,`${w}x${h}: deck workspace fits without page scrolling`);
    assert(layout.gallery.height>=(h<=340?95:h<=380?135:h<=420?165:340),`${w}x${h}: gallery has usable height: ${JSON.stringify(layout)}`);
    assert(layout.cards.top>=layout.gallery.top&&layout.cards.top<layout.gallery.bottom&&layout.cards.height>=(h<=420?160:190),`${w}x${h}: detailed card is visible and scrollable in gallery`);
    assert(layout.controls.top>=layout.cards.top&&layout.controls.bottom<=layout.cards.bottom+1,`${w}x${h}: card controls remain attached to their card`);
    assert(layout.list.width>=160&&layout.categoryPosition!='sticky'&&layout.listNames.every(e=>e.scroll<=e.width+1),`${w}x${h}: deck list has readable names without overlapping sticky category headers`);
    assert(['status','search','sort','filters','list'].every(k=>layout[k].height>0&&layout[k].top>=layout.workspace.top&&layout[k].bottom<=h+1),`${w}x${h}: deck controls and list stay visible`);
    const cardInfo=await p.locator('.deckCardGrid .card').first().evaluate(e=>({name:e.querySelector('.cardName').textContent,sections:['.art','.identity','.abilities','.stats','.cardFoot'].map(s=>{const el=e.querySelector(s);return el&&getComputedStyle(el).display!='none'}),stats:[...e.querySelectorAll('.stat b')].map(x=>x.textContent)}));
    assert(cardInfo.sections.every(Boolean),`${w}x${h}: deck card retains its art, identity, rules, stats, and rarity`);
    assert.deepEqual(cardInfo.stats,['ATK','HP','GRD','AIM','MOVE','SAVE'],`${w}x${h}: deck creature shows every battle stat`);
    const overlaps=await p.locator('.deckCardGrid .card').evaluateAll(cards=>cards.filter(card=>{
     const parts=['.cardHead','.art','.identity','.abilities','.stats','.cardFoot'].map(s=>card.querySelector(s)).filter(Boolean).map(e=>e.getBoundingClientRect());
     const textRects=[],walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim())continue;const range=document.createRange();range.selectNode(node);for(const r of range.getClientRects())if(r.width&&r.height)textRects.push(r)}
     const textOverlap=textRects.some((r,i)=>textRects.slice(i+1).some(q=>r.left<q.right-1&&r.right>q.left+1&&r.top<q.bottom-1&&r.bottom>q.top+1));
     return textOverlap||parts.some((r,i)=>i>0&&r.top<parts[i-1].bottom-1)||parts.some(r=>r.top<card.getBoundingClientRect().top-1||r.bottom>card.getBoundingClientRect().bottom+1);
    }).map(card=>card.querySelector('.cardName').textContent));
    assert.deepEqual(overlaps,[],`${w}x${h}: deck card details do not overlap or escape the card`);
    const listControlOverlap=await p.locator('.dlist .dlr').evaluateAll(rows=>rows.some(row=>{const name=row.querySelector('.dl').getBoundingClientRect(),controls=row.querySelector('.dlc').getBoundingClientRect();return name.left<controls.right-1&&name.right>controls.left+1&&name.top<controls.bottom-1&&name.bottom>controls.top+1}));
    assert(!listControlOverlap,`${w}x${h}: deck-list text does not overlap copy controls`);
    const savedBuilds=await p.evaluate(()=>S.builds);
    for(const filters of [false,true])for(const builds of [false,true]){
     await p.evaluate(({filters,builds})=>{
      V.fo=filters;V.bo=builds;
      V.fs=filters?{t:['c','s','i'],r:['0','1','2','3'],c:['0','1','2','3']}:{};V.fd=filters;
      S.builds=Array.from({length:10},(_,i)=>({name:`Saved build number ${i}`,deck:[...S.deck]}));
      render();
     },{filters,builds});
     const issues=await p.evaluate(()=>{
      const bad=[],rect=e=>e.getBoundingClientRect(),overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
      const siblings=(root,selector)=>{const es=[...root.querySelectorAll(selector)].filter(e=>rect(e).width&&rect(e).height);for(let i=0;i<es.length;i++)for(let j=i+1;j<es.length;j++)if(overlap(rect(es[i]),rect(es[j])))bad.push(`${es[i].className} overlaps ${es[j].className}`)};
      const workspace=document.querySelector('.deckWorkspace'),browse=document.querySelector('.deckBrowse'),editor=document.querySelector('.deckEditor'),list=document.querySelector('.dlist'),gallery=document.querySelector('.deckCardGrid');
      if(rect(editor).width<rect(workspace).width*.42)bad.push('current deck receives less than 42% of workspace');
      if(list.clientHeight<70||gallery.clientHeight<70)bad.push('deck or gallery loses usable scrolling height');
      siblings(workspace,'.deckBrowse,.deckEditor');
      siblings(browse,'.deckBrowseTools,.deckCardGrid');
      siblings(editor,'.deckTools,.dlist');
      siblings(browse,'.deckFilterBar,.deckFilterPanel,.deckActiveFilters,.deckHint');
      siblings(browse,'.deckFilterBar>*');
      const panel=browse.querySelector('.deckFilterPanel');
      if(panel){siblings(panel,'.fg');for(const group of panel.querySelectorAll('.fg'))siblings(group,':scope>b,:scope>.chips')}
      for(const row of workspace.querySelectorAll('.dlr'))siblings(row,':scope>.dl,:scope>.dlc');
      for(const e of workspace.querySelectorAll('.deckFilterBar,.deckFilterPanel,.deckTools,.dlist,.deckCardGrid'))if(e.scrollWidth>e.clientWidth+1)bad.push(`${e.className} overflows horizontally`);
      if(document.getElementById('app').scrollHeight>document.getElementById('app').clientHeight+1)bad.push('page overflow');
      return bad;
     });
     assert.deepEqual(issues,[],`${w}x${h}: no overlap with filters=${filters}, saved builds=${builds}`);
     if(filters){
      await p.locator('.deckFilterPanel [data-a="fdk"]').evaluate(e=>e.scrollIntoView({block:'nearest'}));
      assert(await p.locator('.deckFilterPanel [data-a="fdk"]').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))}),'last filter remains reachable without covering other controls');
     }
    }
    await p.evaluate(builds=>{S.builds=builds;V.fo=false;V.bo=false;V.fs={};V.fd=false;render()},savedBuilds);
   }
   if(tab=='duel')assert(await p.locator('.book').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1}),'open book fits landscape');
  }
  await p.evaluate(()=>{V.v='cards';render()});
  const collectionCard=p.locator('.main .card').first(),name=await collectionCard.getAttribute('data-z');
  await collectionCard.dispatchEvent('pointerdown',{pointerType:'touch',clientX:220,clientY:100});
  await p.waitForSelector('#zm[role="dialog"][aria-modal="true"]');
  assert((await p.locator('#zm').innerText()).includes(name),'touch hold opens card details');
  await collectionCard.dispatchEvent('pointerup',{pointerType:'touch'});
  await p.keyboard.press('Escape');assert.equal(await p.locator('#zm').count(),0);
  await collectionCard.dispatchEvent('contextmenu');
  assert.equal(await p.locator('#zm .card .stat').count(),6);
  await p.click('#zm',{force:true});assert.equal(await p.locator('#zm').count(),0);
  await collectionCard.hover();await p.waitForSelector('#zm.hover');
  await p.mouse.move(1,1);await p.waitForSelector('#zm',{state:'detached'});
  await p.evaluate(()=>{V.v='profile';render()});
  assert(await p.locator('.backgroundChoice .sceneThumb').first().evaluate(e=>getComputedStyle(e).backgroundImage.startsWith('url')),'Story scene profile preview uses current chapter art');
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
  const turnBanner=await p.locator('.turn').evaluate(e=>{
   const r=e.getBoundingClientRect(),board=document.querySelector('.board').getBoundingClientRect(),rail=document.querySelector('.battleRail').getBoundingClientRect();
   return{text:e.querySelector('.turnState').textContent,width:r.width,bottom:r.bottom,boardTop:board.top,railTop:rail.top,font:parseFloat(getComputedStyle(e.querySelector('.turnState')).fontSize),highlight:document.body.classList.contains('turnHighlight')};
  });
  assert(turnBanner.text=='YOUR TURN'&&turnBanner.width>=w-20&&turnBanner.font>=16&&turnBanner.highlight,`${w}x${h}: prominent full-width turn notification`);
  assert(turnBanner.bottom<=turnBanner.boardTop&&turnBanner.bottom<=turnBanner.railTop,`${w}x${h}: turn banner does not cover battlefield or controls`);
  const heroLayout=await p.locator('.battleIdentity').evaluateAll(heroes=>heroes.map(hero=>{
   const r=hero.getBoundingClientRect(),parts=[...hero.querySelectorAll('.portrait,.battleProfile,.heroResources')].map(e=>e.getBoundingClientRect());
   return{inside:parts.every(x=>x.left>=r.left&&x.right<=r.right+1&&x.top>=r.top&&x.bottom<=r.bottom+1),overlap:parts.some((x,i)=>parts.slice(i+1).some(y=>x.left<y.right-1&&x.right>y.left+1&&x.top<y.bottom-1&&x.bottom>y.top+1)),hpSize:parseFloat(getComputedStyle(hero.querySelector('.heroHp b')).fontSize),hp:hero.querySelector('.heroHp b').textContent};
  }));
  assert(heroLayout.every(h=>h.inside&&!h.overlap&&h.hpSize>=17),`${w}x${h}: profile pictures, names, prominent HP and mana do not overlap`);
  const resourceClipping=await p.evaluate(()=>{
   const saved=[G.p.mp,G.p.max,G.e.mp,G.e.max];G.p.mp=G.p.max=G.e.mp=G.e.max=10;render();
   const bad=[...document.querySelectorAll('.heroResources b')].some(e=>{const r=e.getBoundingClientRect(),parent=e.parentElement.getBoundingClientRect();return r.left<parent.left||r.right>parent.right+1||e.scrollWidth>e.clientWidth+1});
   [G.p.mp,G.p.max,G.e.mp,G.e.max]=saved;render();return bad;
  });
  assert(!resourceClipping,`${w}x${h}: maximum mana values fit without clipping`);
  const battle=await p.evaluate(()=>{const app=document.getElementById('app'),hand=document.querySelector('.hand'),end=document.querySelector('[data-a="end"]').getBoundingClientRect(),card=hand.querySelector('.card').getBoundingClientRect(),tray=document.querySelector('.hw').getBoundingClientRect(),board=document.querySelector('.board').getBoundingClientRect();return {overflow:app.scrollHeight>app.clientHeight+1,cardTop:card.top,cardBottom:card.bottom,hand:hand.getBoundingClientRect().bottom,end:end.bottom,vh:innerHeight,trayTop:tray.top,trayBottom:tray.bottom,trayWidth:tray.width,boardBottom:board.bottom,appWidth:app.clientWidth}});
  assert(!battle.overflow&&battle.cardTop>=0&&battle.cardBottom<=h+1&&battle.end<=h+1,`${w}x${h} battle fit: ${JSON.stringify(battle)}`);
  assert(battle.trayTop>=battle.boardBottom&&battle.trayBottom>=h-8,'hand stays below the battlefield at the bottom');
  assert(Math.abs(battle.trayBottom-(h-(h<=360?4:6)))<=1,`${w}x${h}: hand is anchored to the bottom screen padding`);
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
  const liveBoardStats=await p.evaluate(()=>({hp:`${G.b[16].hp}/${G.b[16].mhp}`,move:`${G.b[16].mv}/${G.b[16].init}`}));
  assert.deepEqual(await tile.evaluate(e=>Object.fromEntries([...e.querySelectorAll('.stat')].filter(s=>['HP','MOVE'].includes(s.querySelector('b').textContent)).map(s=>[s.querySelector('b').textContent,s.querySelector('strong').textContent]))),{HP:liveBoardStats.hp,MOVE:liveBoardStats.move},'battlefield stats continue to show live health and movement');
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
  assert(await p.locator('#tutorialObjective').evaluate(e=>{
   const r=e.getBoundingClientRect();
   return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&[...e.querySelectorAll('button')].every(b=>{const x=b.getBoundingClientRect();return x.top>=r.top&&x.bottom<=r.bottom});
  }),'tutorial objective pop-up fits, catches attention, and keeps its controls visible');
  assert.equal(await p.locator('.lessonCoach').count(),0,'tutorial no longer crowds the practice board with a side panel');
  assert.equal(await p.locator('#tutorialObjective .btn').first().evaluate(e=>e===document.activeElement),true,'objective pop-up moves keyboard focus to its first action');
  await p.keyboard.press('Tab');assert.equal(await p.locator('#tutorialObjective').evaluate(e=>e.contains(document.activeElement)),true,'keyboard focus stays inside the objective pop-up');
  await p.click('#tutorialObjective [data-a="tutpromptclose"]');
  assert.equal(await p.locator('#tutorialObjective').count(),0,'player can confirm an objective and clear the board');
  assert.equal(await p.locator('[data-a="tutpromptopen"]').evaluate(e=>e===document.activeElement),true,'closing an objective restores focus to its reopen control');
  await p.click('[data-a="tutpromptopen"]');
  assert.equal(await p.locator('#tutorialObjective').count(),1,'objective can be reopened from battle controls');
  await p.click('#tutorialObjective [data-a="tutpromptclose"]');
  assert.deepEqual(errors,[],`${w}x${h} JS errors`);
  console.log('PASS menus, all-card template, pack/zoom, battle, scrolling, retry',w,h);
  await context.close();
 }
 const {page:deckPage,context:deckContext}=await pageFor(844,390);
 await deckPage.evaluate(()=>{V.v='deck';V.q='';V.fs={};V.fo=false;V.fd=false;V.un=false;V.bo=false;S.deck=[];S.builds=[];render()});
 await deckPage.fill('#fq','Squire');
 assert.deepEqual(await deckPage.locator('.deckCardGrid .cardName').allTextContents(),['Squire'],'deck search narrows the card gallery');
 const deckSquire=await deckPage.locator('.deckCardGrid .card').evaluate(e=>({name:e.querySelector('.cardName').textContent,abilities:e.querySelector('.abilities').textContent.replace(/\s+/g,' ').trim(),stats:[...e.querySelectorAll('.stat')].map(x=>[x.querySelector('b').textContent,x.querySelector('strong').textContent])}));
 await deckPage.evaluate(()=>{V.v='duel';V.q='';newGame(0,1);V.intro=null;G.p.hand=[mk(BN.Squire)];render()});
 const battleSquire=await deckPage.locator('.hand .card').first().evaluate(e=>({name:e.querySelector('.cardName').textContent,abilities:e.querySelector('.abilities').textContent.replace(/\s+/g,' ').trim(),stats:[...e.querySelectorAll('.stat')].map(x=>[x.querySelector('b').textContent,x.querySelector('strong').textContent])}));
 assert.deepEqual(deckSquire,battleSquire,'deck and battle show the same creature rules and stats');
 const handStates=await deckPage.evaluate(()=>{
  G.p.mp=10;G.p.max=10;render();const ready=document.querySelector('.hand .card');
  const noStatusText=card=>['none','normal','""'].includes(getComputedStyle(card,'::after').content)&&!card.textContent.includes(card.dataset.playState);
  const playable=ready.dataset.playState=='PLAYABLE'&&getComputedStyle(ready).borderTopStyle=='solid'&&getComputedStyle(ready).borderTopColor=='rgb(142, 228, 176)'&&ready.getAttribute('aria-disabled')=='false'&&noStatusText(ready);
  G.p.mp=0;render();const blocked=document.querySelector('.hand .card');
  const mana=blocked.dataset.playState.startsWith('Need ')&&getComputedStyle(blocked).borderTopStyle=='dashed'&&blocked.getAttribute('aria-disabled')=='true'&&noStatusText(blocked);
  G.turn='e';render();const foe=document.querySelector('.hand .card').dataset.playState=='Foe’s turn'&&noStatusText(document.querySelector('.hand .card'));
  G.turn='p';G.p.mp=10;G.b=Array(NT).fill(null);for(const i of BACK)G.b[i]=mk(BN.Squire);render();
  const full=document.querySelector('.hand .card').dataset.playState=='Back row full'&&noStatusText(document.querySelector('.hand .card'));
  G.b=Array(NT).fill(null);render();return{playable,mana,foe,full};
 });
 assert.deepEqual(handStates,{playable:true,mana:true,foe:true,full:true},'hand distinguishes playable cards, insufficient mana, foe turn and full deployment row');
 const combatFeedback=await deckPage.evaluate(()=>{
  const sounds=[],old={...SFX};for(const key of Object.keys(SFX))SFX[key]=()=>sounds.push(key);
  const u=mk(BN.Squire);u.o='p';G.b[16]=u;render();
  fxOne({k:'atk',f:16,i:-1,s:'e'});const attack=document.querySelector('[data-i="16"]').classList.contains('fx-atk');
  DelversEngine.dmg('e',null,1);fxRun();
  fxOne({k:'heal',i:-1,s:'p',n:1});
  fxOne({k:'spell',i:-1,s:'e'});
  fxOne({k:'sum',i:16,s:'p'});
  const heal=document.querySelector('[data-a="phero"]').classList.contains('fx-heal'),spell=document.querySelector('[data-a="ehero"]').classList.contains('fx-spell'),summon=document.querySelector('[data-i="16"]').classList.contains('fx-in');
  Object.assign(SFX,old);return{attack,heal,spell,summon,sounds};
 });
 assert(combatFeedback.attack&&combatFeedback.heal&&combatFeedback.spell&&combatFeedback.summon,'combat animations still target units and new hero panels');
 assert.deepEqual(combatFeedback.sounds,['heal','spell','sum'],'combat sounds remain enabled independently of visual-only turn announcements');
 await deckPage.waitForFunction(()=>document.querySelector('[data-a="ehero"]').classList.contains('fx-hit'));
 assert(await deckPage.locator('.fl.d').count()>0,'engine damage still produces hit animation and floating damage');
 const turnChecks=await deckPage.evaluate(()=>{
  const sounds=[],oldTurn=SFX.turn;SFX.turn=()=>sounds.push('turn');
  const before=DelversPvp.hash(G),arrival=turnNotice.at;
  render();const sameTurn=turnNotice.at===arrival;
  turnNotice.at=Date.now()-3000;render();
  const expired=!document.body.classList.contains('turnHighlight')&&!document.querySelector('.turn').classList.contains('turnArrival');
  const unchanged=DelversPvp.hash(G)===before;
  startTurn('e');G.turn='e';render();
  const foe=document.querySelector('.turnState').textContent=='FOE’S TURN'&&document.body.classList.contains('turnHighlight');
  startTurn('p');G.turn='p';render();
  const player=document.querySelector('.turnState').textContent=='YOUR TURN'&&document.querySelector('.turn').classList.contains('turnArrival');
  V.intro={player:{},opponent:{}};render();const deferred=!document.body.classList.contains('turnHighlight');
  V.intro=null;render();
  SFX.turn=oldTurn;
  return{sameTurn,expired,unchanged,foe,player,deferred,sounds};
 });
 assert.deepEqual(turnChecks,{sameTurn:true,expired:true,unchanged:true,foe:true,player:true,deferred:true,sounds:[]},'turn notifications trigger only on new turns without sound or gameplay changes');
 await deckPage.waitForTimeout(2750);
 assert(!await deckPage.locator('body').evaluate(e=>e.classList.contains('turnHighlight')),'turn highlight clears automatically');
 await deckPage.emulateMedia({reducedMotion:'reduce'});
 await deckPage.evaluate(()=>{startTurn('e');G.turn='e';render()});
 assert.equal(await deckPage.locator('.turn').evaluate(e=>getComputedStyle(e).animationName),'none','reduced motion keeps turn announcement static');
 await deckPage.emulateMedia({reducedMotion:'no-preference'});
 await deckPage.evaluate(()=>{G=null;V.v='deck';V.q='Cure Light Wounds';render()});
 const deckSpell=await deckPage.locator('.deckCardGrid .card .effect').textContent();
 await deckPage.evaluate(()=>{V.v='duel';V.q='';newGame(0,1);V.intro=null;G.p.hand=[mk(BN['Cure Light Wounds'])];render()});
 assert.equal((await deckPage.locator('.hand .card .effect').textContent()).trim(),deckSpell.trim(),'deck and battle show identical spell rules');
 await deckPage.evaluate(()=>{G=null;V.v='deck';V.q='Squire';render()});
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
 const perform=async actions=>{if(await p.locator('#tutorialObjective').count())await p.click('#tutorialObjective [data-a="tutpromptclose"]');for(const [a,i] of actions){const selector=`[data-a="${a}"]${i==null?'':`[data-i="${i}"]`}`;await p.click(selector,{force:true})}assert(await p.evaluate(()=>G.lesson.done),'lesson action completed');assert(await p.locator('#tutorialObjective').isVisible(),'completed objective reopens the guidance pop-up');await p.click('#tutorialObjective [data-a="lessonnext"]')};
 await perform([['hand',0],['cell',16]]);
 await perform([['end']]);
 await perform([['cell',16],['cell',12]]);
 await perform([['cell',12],['cell',8]]);
 await perform([['hand',0],['cell',8]]);
 await perform([['hand',0],['cell',16]]);
 await perform([['hand',0],['cell',16]]);
 await perform([['cell',0],['ehero']]);
 assert(await p.evaluate(()=>G.tut&&!G.lesson),'lessons lead to practice');
 assert(await p.locator('#tutorialObjective').isVisible(),'practice opens with a prominent objective');
 await p.click('#tutorialObjective [data-a="tutpromptclose"]');
 await p.click('[data-a="hand"][data-i="0"]',{force:true});
 assert.match(await p.locator('#tutorialObjective').innerText(),/glowing tile/,'practice shows the next objective after the player changes state');
 await p.click('#tutorialObjective [data-a="tutpromptclose"]');
 const beforePractice=await p.evaluate(()=>({gold:S.gold,prog:S.prog,ms:JSON.stringify(S.ms)}));
 await p.evaluate(()=>{G.over='p';render()});
 assert.equal(await p.locator('[data-a="retry"]').count(),0,'no retry after victory');
 assert.deepEqual(await p.evaluate(()=>({gold:S.gold,prog:S.prog,ms:JSON.stringify(S.ms)})),beforePractice,'tutorial rewards no gold or missions');
 await p.click('#ov [data-a="quit"]',{force:true});
 assert.equal(await p.locator('[data-a="pickst"]').count(),3);
 await p.click('[data-a="pickst"][data-id="iron"]',{force:true});
 assert(await p.evaluate(()=>S.sp=='done'&&S.deck.length==30));
 const saved=await p.evaluate(()=>({col:S.col,gold:S.gold,deck:S.deck,stars:S.stars,packs:S.packs,sp:S.sp}));
 await p.reload();await p.click('[data-a="titlecontinue"]');
 assert.deepEqual(await p.evaluate(()=>({col:S.col,gold:S.gold,deck:S.deck,stars:S.stars,packs:S.packs,sp:S.sp})),saved,'save reload');
 await p.evaluate(()=>{S.packs.std=1;V.v='packs';sv();render()});
 const owned=await p.evaluate(()=>ALL.reduce((n,c)=>n+own(c.name),0));
 await p.click('[data-a="open"]');await p.click('[data-a="pks"]',{force:true});
 assert.equal(await p.evaluate(()=>ALL.reduce((n,c)=>n+own(c.name),0)),owned+5,'skip keeps cards');
 await p.reload();await p.click('[data-a="titlecontinue"]');assert.equal(await p.evaluate(()=>ALL.reduce((n,c)=>n+own(c.name),0)),owned+5,'pack save persists');
 await p.evaluate(()=>{V.v='store';V.storeTab='emotes';S.gold=400;render()});
 assert(await p.evaluate(()=>DelversEmotes.defaults.every(id=>S.cosmetics.emotes.includes(id))),'base text emotes are included automatically');
 assert.equal(await p.locator('[data-a="emoteunlock"][data-k="wellplayed"]').count(),0,'base text is not a Store purchase');
 await p.click('[data-a="emoteunlock"][data-k="ember"]',{force:true});
 assert.equal(await p.evaluate(()=>S.gold),50,'graphic emote costs gold');
 assert(await p.locator('[data-a="emoteunlock"][data-k="ember"]').isDisabled(),'owned graphics cannot be bought twice');
 assert(await p.locator('[data-a="emoteunlock"][data-k="heart"]').isDisabled(),'cannot buy graphics without enough gold');
 await p.reload();await p.click('[data-a="titlecontinue"]');assert(await p.evaluate(()=>S.cosmetics.emotes.includes('ember')),'emote purchase saved');
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
 assert.deepEqual(await p.locator('.chapterControls button').allTextContents(),['Previous','Next'],'chapter navigation uses labeled controls');
 assert.equal(await p.locator('.storyProgress').innerText(),`${await p.evaluate(()=>S.prog)} / 60 encounters cleared`);
 assert.equal(await p.locator('.storyProgressTrack').getAttribute('aria-valuenow'),String(await p.evaluate(()=>S.prog)),'story progress is accessible');
 assert.deepEqual(await p.locator('.bookNav button').allTextContents(),['Previous','Next'],'encounter pages use labeled controls');
 assert.equal(await p.locator('.book .sar').count(),0,'story pages scroll without overlay arrow controls');
 await p.locator('.storyContinue').click({force:true});assert.equal(await p.evaluate(()=>V.brief),1,'book resumes the next uncleared encounter');
 await p.click('[data-a="back"]',{force:true});
 for(let i=0;i<3;i++)await p.click('[aria-label="Next encounter page"]',{force:true});
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
