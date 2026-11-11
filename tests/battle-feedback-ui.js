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
 await p.evaluate(()=>{
  newGame(0,1);V.intro=null;G.ev=[];G.p.mp=10;
  const u=mk(BN['Town Guard']);u.o='p';u.ready=true;u.mv=u.init;G.b[16]=u;
  G.p.hand=[mk({...BN.Dagger,look:{frame:'gold',background:'holographic',foil:'foil'}}),mk(BN.Shield),mk(BN['Amulet of Health']),mk(BN['Magic Missile'])];
  render();
 });
 for(const name of ['Dagger','Shield','Amulet of Health']){
  await p.click('.hand [data-a="hand"][data-i="0"]',{force:true});
  await p.click('[data-a="cell"][data-i="16"]',{force:true});
  await p.waitForSelector('#battleNotices .card');
  assert.equal(await p.locator('#battleNotices .cardName').textContent(),name,'the actual equipped card is presented');
  assert.equal(await p.locator('#battleNotices .battleNotice>b').textContent(),'You equip');
  assert.equal(await p.locator('#battleNotices [role="dialog"],#battleNotices .btn').count(),0,'presentation has no modal or dismiss button');
  assert.equal(await p.locator('.tileGear').getAttribute('aria-label'),await p.evaluate(()=>gearSummary(G.b[16])));
  const stable=await p.evaluate(()=>{
   const card=document.querySelector('#battleNotices .card'),animation=card.parentElement.parentElement.getAnimations()[0];
   render();render();
   return card===document.querySelector('#battleNotices .card')&&animation===card.parentElement.parentElement.getAnimations()[0];
  });
  assert(stable,'background rendering never restarts the played card animation');
  if(name==='Dagger')assert.equal(await p.locator('#battleNotices .cc-frame-gold.cc-background-holographic.cc-foil-foil').count(),1,'played card keeps its cosmetics');
 }
 assert.equal(await p.locator('.tileGear>span').count(),3,'all equipped slots remain visible on the unit');
 const buffed=await p.evaluate(()=>{
  const u=G.b[16];u.look={frame:'gold',lettering:'blue',background:'gold-holographic',foil:'foil'};
  DelversEngine.use(G);DelversEngine.cast('p',BN.Bless,{side:'p',c:u});render();
  for(let i=0;i<5;i++)render();
  const tile=document.querySelector('.tile.u'),stats=[...tile.querySelectorAll('.stat')];
  return{
   labels:stats.map(e=>e.querySelector('b').textContent),
   values:stats.map(e=>e.querySelector('strong').textContent),
   changed:stats.filter(e=>e.classList.contains('changed')).map(e=>e.querySelector('b').textContent),
   markers:stats.filter(e=>e.classList.contains('changed')).every(e=>getComputedStyle(e.querySelector('strong'),'::after').content==='"*"'),
   tough:!!tile.querySelector('[data-ability="tough"]'),
   gear:tile.querySelector('.tileGear').getAttribute('aria-label')
  };
 });
 assert.deepEqual(buffed.labels,['ATK','HP','GRD','AIM','MOVE','SAVE']);
 assert.deepEqual(buffed.values,['4','7/7','4','19','1/1','15'],'real gear and Bless bonuses remain visible with all finishes');
 assert.deepEqual(buffed.changed,['ATK','HP','GRD']);
 assert(buffed.markers&&buffed.tough,'buff markers and inherent ability tags survive cosmetic refreshes');
 assert.equal(buffed.gear,'Weapon: Dagger; Armour: Shield; Magic item: Amulet of Health');
 await p.click('[data-a="cell"][data-i="16"]',{force:true});
 assert((await p.locator('.selectedGear').textContent()).includes('Weapon: Dagger; Armour: Shield; Magic item: Amulet of Health'),'selected unit names every equipped item');
 await p.locator('.tile.u').dispatchEvent('contextmenu');
 const detail=await p.locator('#zm .zr').textContent();
 for(const name of ['Dagger','Shield','Amulet of Health'])assert(detail.includes(name),'inspection identifies '+name);
 assert(detail.includes(await p.evaluate(()=>BN.Dagger.txt)),'inspection includes gear effects');
 await p.keyboard.press('Escape');await p.waitForTimeout(510);
 for(const [width,height] of [[568,320],[640,360],[844,390],[960,540],[1280,720]]){
  await p.waitForSelector('#battleNotices',{state:'detached'});
  await p.setViewportSize({width,height});
  await p.evaluate(()=>{
   G.p.mp=10;G.e.hp=G.e.mx=100;G.sel=null;G.p.hand=[mk(BN['Magic Missile'])];render();
  });
  await p.click('.hand [data-a="hand"]',{force:true});
  await p.click('[data-a="ehero"]',{force:true});
  await p.waitForFunction(()=>document.querySelector('#battleNotices .cardName')?.textContent==='Magic Missile');
  const fits=await p.evaluate(()=>{
   const popup=document.querySelector('#battleNotices'),rect=popup.getBoundingClientRect(),board=document.querySelector('.board').getBoundingClientRect();
   const actions=document.querySelector('.combatActions').getBoundingClientRect();
   const u=document.querySelector('.tile.u'),stats=[...u.querySelectorAll('.stat')];
   const centerY=Math.max(rect.height/2+8,Math.min(innerHeight-rect.height/2-8,board.top+board.height/2));
   return{
    centered:Math.abs(rect.left+rect.width/2-board.left-board.width/2)<2&&Math.abs(rect.top+rect.height/2-centerY)<2,
    fits:rect.top>=0&&rect.bottom<=innerHeight&&rect.right<=actions.left&&rect.left>=0,
    readable:parseFloat(getComputedStyle(popup.querySelector('.playedCard')).getPropertyValue('--played-scale'))>=.8,
    natural:getComputedStyle(popup).pointerEvents==='none'&&!popup.contains(document.activeElement),
    stats:stats.every(e=>{const r=e.getBoundingClientRect(),tile=u.getBoundingClientRect();return r.top>=tile.top&&r.bottom<=tile.bottom+1})
   };
  });
  assert.deepEqual(fits,{centered:true,fits:true,readable:true,natural:true,stats:true},'presentation and equipped stats fit '+width+'x'+height);
 }
 await p.waitForSelector('#battleNotices',{state:'detached'});
 assert.equal(await p.locator('#battleNotices').count(),0,'card presentation disappears automatically');
 await p.evaluate(()=>spellNotice({name:'Ashen Reprisal',kind:'chain',caster:'e',target:'Sister Cera, Last Candle'}));
 assert(await p.locator('.battleNotice').evaluate(e=>e.getAnimations().every(a=>a.effect.getKeyframes().every(f=>!f.transform||f.transform==='none'))),'presentation fades without bouncing, scaling or sliding');
 await p.waitForTimeout(1100);
 await p.evaluate(()=>spellNotice({name:'Deep Anvil Charm',kind:'gear',caster:'p',target:'Emberheart Confessor'}));
 await p.setViewportSize({width:568,height:320});
 await p.waitForTimeout(1000);
 assert.equal(await p.locator('#battleNotices .cardName').textContent(),'Deep Anvil Charm','latest rapid cast gets its own lifetime');
 assert.equal(await p.locator('.battleNotice').count(),1,'rapid casts never pile up cards');
 assert(await p.locator('#battleNotices').evaluate(e=>{const r=e.getBoundingClientRect(),a=document.querySelector('.combatActions').getBoundingClientRect();return r.top>=0&&r.left>=0&&r.bottom<=innerHeight&&r.right<=a.left&&[...e.querySelectorAll('b,span')].every(x=>x.scrollWidth<=x.clientWidth+1)}),'resizing an active card keeps captions and actions clear');
 await p.evaluate(()=>{G.over='e';render()});
 assert.equal(await p.locator('#battleNotices').count(),0,'results never sit behind a played card');
 await p.evaluate(()=>{G.over=null;G.fin=false;render()});
 // Spell attribution and target highlighting must be relative to either online seat.
 const mirrored=await p.evaluate(()=>{
  const oldNet=NET,oldPv=V.pv;
  const g=DelversPvp.newMatch(1,Array(20).fill('Squire'),Array(20).fill('Squire'));
  g.fx=true;DelversEngine.use(g);DelversEngine.cast('e',BN['Mana Potion'],null);
  NET={G:g,seat:'e',opp:{name:'Opponent'},timeLeft:()=>30000};V.pv={mid:'fixture'};
  const event=pvView().ev.find(x=>x.k==='spell');
  NET=oldNet;V.pv=oldPv;DelversEngine.use(G);
  return{caster:event.caster,side:event.s};
 });
 assert.deepEqual(mirrored,{caster:'p',side:'p'},'second online seat sees their own cast correctly');
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.evaluate(()=>{DelversEngine.use(G);DelversEngine.cast('e',BN['Mana Potion'],null);render()});
 await p.waitForSelector('#battleNotices');
 assert.equal(await p.locator('.battleNotice').evaluate(e=>getComputedStyle(e).animationName),'none','reduced motion presents a static card');
 await p.click('[data-a="quit"]',{force:true});
 assert.equal(await p.locator('#battleNotices').count(),0,'leaving clears the presentation');
 await p.evaluate(()=>{newGame(0,1);V.intro=null;G.ev=[{k:'spell',kind:'mana',name:'Mana Potion',caster:'e',target:'self',s:'e',i:-1}];render();G=null;render()});
 await p.waitForTimeout(300);
 assert.equal(await p.locator('#battleNotices').count(),0,'delayed effects do not leak after leaving a battle');
 assert.deepEqual(errors,[]);
 console.log('PASS clean fading cards, rapid casts, active resize, result cleanup, named gear and both online seats');
 await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
