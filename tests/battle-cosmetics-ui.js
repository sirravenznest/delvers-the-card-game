// Metallic labels must stay mounted above an opaque backing and animated finishes.
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
 await p.evaluate(()=>{newGame(0,1);V.intro=null;G.ev=[];G.p.hand=[];render()});
 for(const [width,height] of [[568,320],[640,360],[844,390],[1024,600],[1280,720]]){
  await p.setViewportSize({width,height});
  const issues=await p.evaluate(()=>{
   const issues=[],names=['Sister Cera, Last Candle','Ashen Standard-Bearer','Emberheart Confessor','Nim, Gatemarket Guide'];
   for(const lettering of ['silver','red','blue','gold'])for(const background of ['holographic','gold-holographic'])for(const foil of [false,true]){
    G.b=Array.from({length:NT},(_,i)=>{
     const u=mk(BN[names[i%names.length]]);u.o=i%2?'e':'p';u.ready=i%3!==0;u.mv=u.ready?1:0;
     u.look={frame:lettering,lettering,background,...(foil?{foil:'foil'}:{})};
     u.gear={P:'Dagger',A:'Shield',I:'Deep Anvil Charm'};u.sP=u.sA=u.sI=1;
     return u;
    });render();
    const mounted=[...document.querySelectorAll('.tileName')];
    for(let n=0;n<3;n++){
     render();
     for(const tile of document.querySelectorAll('.tile.u')){
      const name=tile.querySelector('.tileName'),header=tile.querySelector('.tileHeader'),finish=tile.querySelector('.finishSurface');
      const text=getComputedStyle(name),head=getComputedStyle(header),r=name.getBoundingClientRect(),h=header.getBoundingClientRect();
      if(text.filter!=='none')issues.push('filtered label '+lettering);
      if(!tile.classList.contains('done')&&(text.backgroundImage==='none'||text.webkitTextFillColor!=='rgba(0, 0, 0, 0)'))issues.push('metallic lettering was removed');
      if(name!==mounted[+tile.dataset.i])issues.push('unchanged name remounted during refresh');
      if(head.backgroundColor!=='rgb(17, 22, 37)')issues.push('finish can bleed through label background');
      if(+head.zIndex<=+getComputedStyle(finish).zIndex||foil&&+head.zIndex<=+getComputedStyle(tile,'::before').zIndex)issues.push('finish paints above header');
      if(r.left<h.left-1||r.right>h.right+1||r.top<h.top-1||r.bottom>h.bottom+1)issues.push('name outside header');
      const parts=[...header.children].map(e=>e.getBoundingClientRect());
      if(parts.some((a,i)=>parts.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1)))issues.push('header controls overlap name');
      if(tile.classList.contains('done')&&text.color!=='rgb(190, 198, 210)')issues.push('exhausted label lost');
     }
    }
   }
   return [...new Set(issues)];
  });
  assert.deepEqual(issues,[],'stable battlefield names and finish layers '+width+'x'+height);
 }
 await p.emulateMedia({reducedMotion:'reduce'});
 assert(await p.locator('.tile.u').first().evaluate(e=>e.querySelector('.finishSurface').getAnimations().length===0&&getComputedStyle(e,'::before').animationName==='none'),'reduced motion stops battlefield finishes');
 assert.deepEqual(errors,[]);
 console.log('PASS preserved metallic lettering, stable name nodes, opaque backing and nonoverlapping finish layers across five sizes');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
