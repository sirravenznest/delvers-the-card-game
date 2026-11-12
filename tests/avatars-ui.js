const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await page.goto(process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html');
 await page.locator('.titleActions .pri').click();await page.click('[data-a="tutskipmenu"]');
 const distinct=await page.evaluate(async()=>{
  const seen=new Set();
  for(const avatar of AVATARS){
   const image=new Image();image.src='data:image/svg+xml,'+encodeURIComponent(DelversArt.portrait(avatar.id,'#111625','#ffffff'));await image.decode();
   const canvas=document.createElement('canvas');canvas.width=48;canvas.height=52;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,48,52);seen.add(canvas.toDataURL());
  }
  return seen.size===AVATARS.length;
 });
 assert(distinct,'every portrait has unique pixels even with identical background colours');
 await page.evaluate(()=>{S.cosmetics.avatars=AVATARS.filter(a=>a.price).map(a=>a.id);V.v='profile';render()});
 for(const [width,height] of [[568,320],[844,390],[1280,720]]){
  await page.setViewportSize({width,height});
  assert(await page.locator('.avatarChoice').evaluateAll(elements=>elements.every(e=>{
   const s=e.querySelector('svg').getBoundingClientRect(),r=e.getBoundingClientRect();
   return s.width>0&&s.height>0&&s.left>=r.left&&s.right<=r.right+1&&s.top>=r.top&&s.bottom<=r.bottom+1;
  })),'portrait artwork stays inside existing choices');
 }
 for(const [id,name] of [['dragon','Dragon'],['undead','Lich']]){
  await page.locator(`[data-a="avatar"][data-k="${id}"]`).click();
  assert.equal(await page.evaluate(()=>S.avatar),id);
  assert.equal(await page.locator(`[data-k="${id}"].avatarChoice`).getAttribute('aria-pressed'),'true');
  await page.reload();await page.locator('.titleActions .pri').click();
  assert.equal(await page.evaluate(()=>S.avatar),id,'saved selection survives reload');
  await page.evaluate(()=>{V.v='profile';render()});
  assert.equal(await page.locator('.profileHead .portrait').getAttribute('aria-label'),name+' portrait');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS distinct avatar pixels, existing layout, Dragon/Lich selection and persistence');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
