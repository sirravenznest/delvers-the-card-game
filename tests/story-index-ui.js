// Local browser fixtures only; never connects to production services.
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
 await p.evaluate(()=>{S.sp='done';S.prog=17;S.stars={0:3,15:1,16:2};V.v='duel';render()});
 const chapters=await p.evaluate(()=>[...new Set(CAMP.map(o=>o[8]))]);
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]]){
  await p.setViewportSize({width,height});await p.click('[data-a="bookindex"]');
  assert.equal(await p.locator('.indexEntry').count(),9,'all chapters appear');
  assert.equal(await p.locator('.indexEntry[aria-current="location"]').count(),1,'one current chapter');
  assert(await p.locator('.indexEntry[aria-current="location"]').textContent().then(s=>s.includes('Continue here')));
  const layout=await p.evaluate(()=>{
   const book=document.querySelector('.storyIndex'),r=book.getBoundingClientRect(),scroll=document.querySelector('.indexChapters');
   return{fits:r.top>=0&&r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,
    horizontal:scroll.scrollWidth<=scroll.clientWidth+1,
    singleScroll:book.querySelectorAll('.sc.v').length===1,
    text:[...book.querySelectorAll('.indexTitle,.indexEntry,.pageFolio')].every(e=>e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1),
    noDesktopScroll:innerHeight<600||scroll.scrollHeight<=scroll.clientHeight+1};
  });
  assert.deepEqual(layout,{fits:true,horizontal:true,singleScroll:true,text:true,noDesktopScroll:true},`index ${width}x${height}`);
  for(let i=0;i<chapters.length;i++){
   await p.locator(`.indexEntry[data-i="${i}"]`).click();
   assert.equal(await p.locator('.bookChapter h2').textContent(),chapters[i]);
   assert(await p.evaluate(()=>[...document.querySelectorAll('.bookPages [data-a="fight"]')].every(e=>+e.dataset.i<=S.prog||e.disabled)),'future encounters stay locked');
   await p.click('[data-a="bookindex"]');
  }
  await p.locator('.indexEntry[aria-current="location"]').click();
  assert.equal(await p.locator('.bookPages [data-a="fight"][data-i="17"]').count(),1,'current chapter opens at the next fight');
  const location=await p.evaluate(()=>({chapter:V.chapter,page:V.bookPage}));
  await p.click('[data-a="bookindex"]');await p.click('[data-a="bookreturn"]');
  assert.deepEqual(await p.evaluate(()=>({chapter:V.chapter,page:V.bookPage})),location,'Return preserves the book page');
 }
 await p.evaluate(()=>{S.prog=60;S.stars=Object.fromEntries(CAMP.map((_,i)=>[i,3]));V.v='duel';render()});
 await p.click('[data-a="bookindex"]');
 assert.match(await p.locator('.storyToolbar').textContent(),/180 \/ 180 stars/);
 assert.match(await p.locator('.storyToolbar').textContent(),/60 \/ 60 cleared/);
 assert.equal(await p.locator('.indexEntry').evaluateAll(es=>es.reduce((sum,e)=>sum+Number(e.querySelector('small').textContent.match(/· (\d+) \//)[1]),0)),180);
 await p.locator('.indexEntry').last().click();
 assert.equal(await p.locator('.bookPages [data-a="fight"][data-i="59"]').count(),1,'completed campaign resumes at the final page');
 assert.deepEqual(errors,[]);
 console.log('PASS nine-chapter index, seven landscape sizes, one scroll surface, navigation, locks and 180 stars');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
