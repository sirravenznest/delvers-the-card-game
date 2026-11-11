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
 await p.addStyleTag({content:'.finishPixelTest .finishSurface,.finishPixelTest::before{animation:none!important;background-position:var(--finish-test-position,50%) var(--finish-test-position,50%)!important}.finishPixelOff .finishSurface{visibility:hidden!important}.finishPixelOff::before{opacity:0!important}'});
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
  for(const look of [{foil:'foil'},{background:'holographic'},{background:'gold-holographic'},{background:'holographic',foil:'foil'}]){
   await p.evaluate(look=>{
    G.b=Array(NT).fill(null);const u=mk(BN['Town Guard']);u.o='p';u.ready=true;u.mv=u.init;
    G.b[16]=u;G.fx=false;DelversEngine.use(G);
    for(const name of ['Dagger','Shield','Amulet of Health','Bless'])DelversEngine.cast('p',BN[name],{side:'p',c:u});
    u.look={...look,lettering:'gold'};render();
    document.querySelector('.tile.u').classList.add('finishPixelTest');
   },look);
   const tile=p.locator('.tile.u');
   assert.equal(await tile.locator('.stat').count(),6);
   assert.deepEqual(await tile.locator('.stat strong').allTextContents(),['4','7/7','4','19','1/1','15'],'real gear and Bless retain all six live stats');
   assert.equal(await tile.locator('.stat.changed').count(),3,'ATK, HP and Guard buff markers remain');
   assert.equal(await tile.locator('.tileGear>span').count(),3);assert.equal(await tile.locator('.ab [aria-label^="Tough"]').count(),1);
   for(const phase of ['0%','50%','100%']){
   await tile.evaluate((e,phase)=>{e.classList.remove('finishPixelOff');e.style.setProperty('--finish-test-position',phase)},phase);
   const visible=(await tile.screenshot()).toString('base64');
   await tile.evaluate(e=>e.classList.add('finishPixelOff'));
   const hidden=(await tile.screenshot()).toString('base64');
   const difference=await p.evaluate(async({visible,hidden})=>{
    async function pixels(data){const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data}
    const a=await pixels(visible),b=await pixels(hidden);let changed=0,total=0;
    for(let i=0;i<a.length;i+=4){const delta=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);if(delta>=24)changed++;total++}
    return changed/total;
   },{visible,hidden});
   assert(difference>=.15,'finish must visibly affect at least 15% of actual unit pixels, not merely exist behind opaque panels: '+JSON.stringify({width,height,look,phase,difference}));
   }
   await tile.evaluate(e=>{e.classList.remove('finishPixelTest','finishPixelOff');e.style.removeProperty('--finish-test-position')});
  }
 }
 await p.emulateMedia({reducedMotion:'reduce'});
 assert(await p.locator('.tile.u').first().evaluate(e=>e.querySelector('.finishSurface').getAnimations().length===0&&getComputedStyle(e,'::before').animationName==='none'),'reduced motion stops battlefield finishes');
 assert.deepEqual(errors,[]);
 console.log('PASS actual foil/holo pixels at three shimmer phases, all six buffed stats, gear, abilities, metallic lettering and stable name layers across five sizes');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
