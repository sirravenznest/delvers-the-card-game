// Battle hand artwork and class identity must survive play states and cosmetics.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await page.goto(url);await page.locator('.titleActions .pri').click();await page.click('[data-a="tutskipmenu"]');
 await page.evaluate(()=>{
  newGame(0,1,true);V.intro=null;G.p.mp=10;G.p.max=10;
  G.p.hand=['Squire','Sister Cera, Last Candle','Magic Missile','Dagger'].map(name=>mk(BN[name]));
  G.p.hand[0].look={frame:'gold',lettering:'blue',background:'gold-holographic',foil:'foil'};
  G.p.hand[0].k2='tough thorns lifelink';
  render();
 });
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]]){
  await page.setViewportSize({width,height});
  const issues=await page.evaluate(()=>{
   const bad=[],within=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
   for(const [i,card] of [...document.querySelectorAll('.hand .card')].entries()){
    const r=card.getBoundingClientRect(),frame=card.querySelector('.artFrame'),art=frame.querySelector('svg'),ar=art.getBoundingClientRect(),fr=frame.getBoundingClientRect();
    const identity=card.querySelector('.identity'),ir=identity.getBoundingClientRect();
    const color=document.createElement('span');color.style.color=card.style.getPropertyValue('--k');card.append(color);
    if(getComputedStyle(identity).backgroundColor!==getComputedStyle(color).color)bad.push(i+' class colour');
    color.remove();
    if(getComputedStyle(frame).display==='none'||getComputedStyle(art).display==='none'||ar.width<20||ar.height<15||!within(ar,fr)||!within(fr,r))bad.push(i+' artwork');
    if(!within(ir,r)||!identity.textContent.trim())bad.push(i+' identity');
    const stats=card.querySelector('.stats');
    if(stats){
     const labels=[...stats.querySelectorAll('.stat b')].map(e=>e.textContent);
     if(labels.join(',')!=='ATK,HP,GRD,AIM,MOVE,SAVE'||!within(stats.getBoundingClientRect(),r))bad.push(i+' stats');
     for(const e of stats.querySelectorAll('.stat b,.stat strong'))if(!within(e.getBoundingClientRect(),r))bad.push(i+' clipped stat');
    }
    if(i===0&&['tough','thorns','lifelink','reach'].some(k=>!card.querySelector('[data-ability="'+k+'"]')))bad.push('ability tags');
    const parts=[card.querySelector('.cardHead'),identity,frame,card.querySelector('.abilities'),card.querySelector('.stats')].filter(Boolean).map(e=>e.getBoundingClientRect());
    if(parts.some((a,n)=>parts.slice(n+1).some(b=>a.width&&a.height&&b.width&&b.height&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)))bad.push(i+' overlapping sections');
    if(card.classList.contains('can')&&getComputedStyle(card).borderTopColor!=='rgb(142, 228, 176)')bad.push(i+' playable border');
   }
   const styled=document.querySelector('.hand .card');
   if(!styled.matches('.cc-frame-gold.cc-lettering-blue.cc-background-gold-holographic.cc-foil-foil')||getComputedStyle(styled,'::after').content==='none'||getComputedStyle(styled.querySelector('.finishSurface')).backgroundImage==='none'||getComputedStyle(styled.querySelector('.cardName')).backgroundImage==='none')bad.push('cosmetics');
   return bad;
  });
  assert.deepEqual(issues,[],width+'x'+height+' hand artwork, class identity and cosmetics');
 }
 await page.evaluate(()=>{G.p.mp=0;render()});
 const blocked=page.locator('.hand .card').first();
 assert.equal(await blocked.evaluate(e=>getComputedStyle(e).borderTopStyle),'dashed','unplayable state remains distinct');
 assert.equal(await blocked.locator('.artFrame svg').evaluate(e=>getComputedStyle(e).display),'block','art remains visible when unplayable');
 assert.deepEqual(errors,[]);
 console.log('PASS hand artwork, class colours, play states and cosmetics across seven landscape sizes');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
