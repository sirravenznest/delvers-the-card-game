// All story scenes and PvP ranks must fit without scrolling to Roll or Begin.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_mus='1'});
 await p.goto(url);await p.addStyleTag({content:'.introBox{animation:none!important}'});
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]]){
  await p.setViewportSize({width,height});
  const issues=await p.evaluate(()=>{
   V.title=false;const issues=[];
   function check(label){
    const box=document.querySelector('.introBox'),r=box.getBoundingClientRect();
    if(box.scrollHeight>box.clientHeight+1||box.scrollWidth>box.clientWidth+1)issues.push(label+' scrolls '+box.scrollHeight+'/'+box.clientHeight);
    if(r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)issues.push(label+' outside viewport');
    for(const el of box.querySelectorAll('button,.introScene h2,.introPlayer .portrait,.introPlayer strong,.rankBadge,.introRecord')){
     const q=el.getBoundingClientRect();
     if(q.top<r.top||q.bottom>r.bottom+1||q.left<r.left||q.right>r.right+1||el.scrollWidth>el.clientWidth+1)issues.push(label+' clips '+el.className+' '+el.textContent);
    }
   }
   for(let i=0;i<CAMP.length;i++){
    G=null;V.intro=null;V.brief=null;V.v='duel';V.bookIndex=false;S.prog=i;render();
    const start=document.querySelector('.storyContinue'),r=start.getBoundingClientRect();
    if(start.disabled||Number(start.dataset.i)!==i||r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)issues.push('Story '+i+' Continue requires scrolling');
    for(const tier of [1,2,3]){
     G=null;V.intro=null;V.brief=i;V.tier=tier;S.prog=60;S.stars[i]=tier-1;render();
     const app=document.getElementById('app');
     if(app.scrollHeight>app.clientHeight+1||app.scrollWidth>app.clientWidth+1)issues.push('Story briefing '+i+' tier '+tier+' scrolls');
     for(const button of app.querySelectorAll('button')){
      const r=button.getBoundingClientRect();
      if(r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1)issues.push('Story briefing '+i+' tier '+tier+' hides '+button.textContent);
     }
    }
    V.brief=null;
    newGame(i,1);check('Story '+i+' unrolled');
    G.opening.rolled={p:true,e:true};render();check('Story '+i+' rolled');
   }
   for(const rank of [0,1000,1200,1400,1600,1800,2000]){
    newGame(0,1);
    V.intro={label:'Ranked match',scene:'test',player:{name:'Delver Long Name',avatar:'vanguard',r:rank,w:rank?12345:0,l:rank?12345:0},opponent:{name:'OpponentLongName',avatar:'vanguard',r:2000,w:9999,l:9999}};
    render();check('PvP '+rank+' unrolled');
    const ranks=[...document.querySelectorAll('.introPlayer .rankBadge')].map(e=>e.getAttribute('aria-label'));
    if(ranks[0]!==rankFor(rank,rank?12345:0,rank?12345:0).name+' rank'||ranks[1]!=='Mythic rank')issues.push('PvP rank lost');
    G.opening.rolled.p=true;render();check('PvP '+rank+' waiting');
    G.opening.rolled.e=true;render();check('PvP '+rank+' rolled');
   }
   return issues;
  });
  assert.deepEqual(issues,[],width+'x'+height+' all scenes, ranks and roll states');
  console.log('PASS no intro scrolling or clipped controls; all 60 Story scenes and all PvP ranks',width,height);
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
