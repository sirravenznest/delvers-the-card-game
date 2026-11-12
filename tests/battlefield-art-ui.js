// Verify artwork is actually visible without displacing battlefield information.
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
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [width,height] of [[568,320],[640,360],[844,390],[1024,600],[1280,720]]){
  await page.setViewportSize({width,height});
  for(const look of [{},{frame:'gold',lettering:'blue',background:'gold-holographic',foil:'foil'}]){
   await page.evaluate(look=>{
    if(!G)newGame(0,1,true);V.intro=null;G.ev=[];G.b=Array(NT).fill(null);
    for(const [i,name,owner] of [[0,'Squire','e'],[16,'Town Guard','p']]){
     const u=mk(BN[name]);u.o=owner;u.ready=true;u.mv=u.init;u.look=look;
     u.gear={P:'Dagger',A:'Shield',I:'Amulet of Health'};u.sP=u.sA=u.sI=1;u.k2='tough thorns lifelink';G.b[i]=u;
    }
    render();
   },look);
   assert.equal(await page.locator('.tile:not(.u) .unitArt').count(),0,'empty tiles have no art');
   for(const [index,name] of [[0,'Squire'],[16,'Town Guard']]){
    const tile=page.locator(`.tile.u[data-i="${index}"]`);
    const state=await tile.evaluate(e=>{
     const r=e.getBoundingClientRect(),sprite=e.querySelector('.unitSprite'),s=sprite.getBoundingClientRect();
     const labels=[...e.querySelectorAll('.stat b')];
     return {art:sprite.getAttribute('aria-label'),visible:s.width>=20&&s.height>=15&&s.left>=r.left&&s.right<=r.right&&s.top>=r.top&&s.bottom<=r.bottom,
      stats:labels.map(x=>x.textContent),fit:labels.concat([...e.querySelectorAll('.stat strong')]).every(x=>{const b=x.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom&&x.scrollWidth<=x.clientWidth+1}),
      owner:e.querySelector('.tileOwner').textContent,gear:e.querySelectorAll('.tileGear>span').length,tags:e.querySelectorAll('.ab .abilityTag').length};
    });
    assert(state.art.includes(name)&&state.visible,'correct visible sprite '+name);
    assert.deepEqual(state.stats,['ATK','HP','GRD','AIM','MOVE','SAVE']);
    assert(state.fit&&state.owner===(index===0?'FOE':'YOU')&&state.gear===3&&state.tags>=4,'stats, ownership, gear and abilities remain intact');
    const shown=(await tile.screenshot()).toString('base64');
    await tile.locator('.unitArt').evaluate(e=>e.style.visibility='hidden');
    const hidden=(await tile.screenshot()).toString('base64');
    const fraction=await page.evaluate(async({shown,hidden})=>{
     async function pixels(data){const img=new Image();img.src='data:image/png;base64,'+data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,c.width,c.height).data}
     const a=await pixels(shown),b=await pixels(hidden);let changed=0;
     for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>=18)changed++;
     return changed/(a.length/4);
    },{shown,hidden});
    assert(fraction>=.02,'art changes visible pixels '+JSON.stringify({width,height,name,look,fraction}));
    await tile.locator('.unitArt').evaluate(e=>e.style.removeProperty('visibility'));
   }
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS visible battlefield sprites, ownership, gear, abilities, stats and cosmetics');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
