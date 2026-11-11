// Real Web Audio output, with WebView-style touch activation restrictions.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:568,height:320},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.delvers_consent='2026-11-09';
  const NativeAudioContext=window.AudioContext;
  window.AudioContext=class extends NativeAudioContext{
   constructor(...args){super(...args);this.suspend()}
   resume(){return navigator.userActivation.hasBeenActive?super.resume():Promise.resolve()}
  };
 });
 await page.goto(process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html');
 assert.equal(await page.evaluate(()=>AC.state),'suspended','audio starts locked until a user gesture');
 await page.locator('.titlePanel h1').tap();
 await page.waitForFunction(()=>AC.state==='running'&&MUS.st>0);
 assert.equal(await page.evaluate(()=>MUS.mode),'title','a touch unlocks music without changing screens');
 await page.evaluate(()=>{window.musicAnalyser=AC.createAnalyser();MB.connect(window.musicAnalyser)});
 async function output(){
  return page.evaluate(async()=>{
   const data=new Float32Array(window.musicAnalyser.fftSize);let peak=0;
   for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,80));window.musicAnalyser.getFloatTimeDomainData(data);for(const x of data)peak=Math.max(peak,Math.abs(x))}
   return peak;
  });
 }
 for(const mode of ['title','hub','menu','battle','pack']){
  await page.evaluate(mode=>{musicSet(mode);musTick()},mode);
  assert(await output()>.0001,mode+' produces actual audible samples, not merely a running timer');
 }
 await page.evaluate(()=>musicSet('title'));
 await page.locator('[data-a="mus"]').tap();
 assert.equal(await page.evaluate(()=>MUS.mode),null,'music mute stops the scheduler');
 assert(await output()<.00001,'music mute silences actual output');
 await page.locator('[data-a="mus"]').tap();
 assert(await output()>.0001,'turning music on restores actual output');
 await page.locator('[data-a="snd"]').tap();
 assert(await output()<.00001,'global mute silences music');
 await page.locator('[data-a="snd"]').tap();
 assert(await output()>.0001,'global unmute restores music');
 await page.evaluate(async()=>{await AC.suspend()});
 await page.locator('.titlePanel h1').tap();
 await page.waitForFunction(()=>AC.state==='running');
 assert(await output()>.0001,'next touch recovers a suspended context even with the same music mode');
 await page.evaluate(async()=>{await AC.suspend();window.testHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.testHidden});document.dispatchEvent(new Event('visibilitychange'))});
 await page.waitForFunction(()=>AC.state==='running');
 assert(await output()>.0001,'returning to the app restores actual music output');
 await page.keyboard.press('Tab');
 await page.evaluate(async()=>{await AC.suspend()});
 await page.keyboard.press('ArrowRight');
 await page.waitForFunction(()=>AC.state==='running');
 assert(await output()>.0001,'keyboard interaction also unlocks audio');
 assert.deepEqual(errors,[]);
 console.log('PASS real title/hub/menu/battle/pack samples, touch unlock, music/global mute, suspend recovery and keyboard unlock');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
