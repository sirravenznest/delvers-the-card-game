// Real single-player turns; shorten presentation delays, not game rules.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:568,height:320},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await p.goto(process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html');
 await p.locator('.titleActions .pri').click();
 await p.click('[data-a="tutskipmenu"]');
 await p.evaluate(()=>{const timeout=window.setTimeout.bind(window);window.setTimeout=(fn,ms,...a)=>timeout(fn,Math.min(ms,2),...a);S.sp='done';S.deck=STARTERS[0].list.slice();for(const n of S.deck)S.col[n]=Math.max(3,S.col[n]||0)});
 for(const [oi,tier] of [[0,1],[2,1],[29,3],[59,1]]){
  const before=await p.evaluate(({oi,tier})=>{S.prog=oi;S.stars[oi]=tier-1;newGame(oi,tier);V.intro=null;render();return{gold:S.gold,win:rew(CAMP[oi],oi,tier),loss:Math.round(lossG(CAMP[oi])*TM[tier])}},{oi,tier});
  await p.click('[data-a="auto"]',{force:true});
  await p.waitForFunction(()=>G&&G.over&&G.fin,{timeout:60000});
  const after=await p.evaluate(()=>({winner:G.over,gold:S.gold,ms:JSON.stringify(S.ms),result:G.res}));
  assert.equal(after.gold,before.gold+(after.winner=='p'?before.win:before.loss),'actual battle pays exact reward');
  await p.evaluate(()=>{for(let i=0;i<5;i++)render()});
  assert.deepEqual(await p.evaluate(()=>({gold:S.gold,ms:JSON.stringify(S.ms)})),{gold:after.gold,ms:after.ms},'result renders never repeat rewards');
  if(after.winner=='e'){await p.click('[data-a="retry"]',{force:true});assert.deepEqual(await p.evaluate(()=>({oi:G.oi,tier:G.tier,over:G.over,gold:S.gold})),{oi,tier,over:null,gold:after.gold})}
  console.log('PASS actual campaign battle and persistent rewards',oi,tier,after.winner);
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
