// Dynamic odds, new-card acquisition, keyword search and real campaign builder wiring.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:844,height:390},hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await p.goto(url);await p.locator('.titleActions .pri').click();await p.click('[data-a="tutskipmenu"]');
 const odds=await p.evaluate(()=>{
  V.v='packs';V.rates=true;render();
  return [...document.querySelectorAll('table.rates')].map((table,i)=>{
   const slots=packSlots(i+1),chance=k=>100*(1-slots.reduce((v,s)=>v*(1-s[k]/100/ALL.filter(c=>c.rar===k).length),1));
   return{shown:table.nextElementSibling.textContent,legend:pct(chance(3)),rare:pct(chance(2))};
  });
 });
 assert.equal(odds.length,3);
 for(const x of odds){assert(x.shown.includes('specific Legendary: '+x.legend));assert(x.shown.includes('specific Rare: '+x.rare))}
 assert.match(await p.locator('#app').textContent(),/130 cards: 30 Common · 55 Uncommon · 35 Rare · 10 Legendary/);
 assert.equal(await p.locator('.packCardPool').count(),3,'all pack tiers list their actual card pools');
 assert(await p.locator('.packCardPool').evaluateAll(pools=>pools.every(pool=>ALL.every(c=>pool.querySelector(`[data-rarity="${c.rar}"]`).textContent.includes(c.name)))),'every card, including all eight additions, appears under its correct rarity in every pack');
 const acquisition=await p.evaluate(()=>{
  const saved=JSON.stringify(S),original=Math.random,found=new Set(),counts=[0,0,0,0];let seed=224;
  try{
   Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   for(let i=0;i<10000;i++)for(const c of packRoll(1)){found.add(c.name);counts[c.rar]++}
  }finally{Math.random=original}
  return{all:ALL.every(c=>found.has(c.name)),unchanged:JSON.stringify(S)===saved,counts};
 });
 assert(acquisition.all,'all 130 cards, including the eight additions, are reachable through real packRoll');
 assert(acquisition.unchanged,'checking odds cannot grant collection progress');
 for(const [i,expected] of [56,36,7,1].entries())assert(Math.abs(acquisition.counts[i]/500-expected)<.8,'Standard rarity pacing unchanged');
 await p.evaluate(()=>{for(const n of ['Lanternbound Adept','Deep Anvil Charm','Sister Cera, Last Candle','Nim, Gatemarket Guide'])CF.add(S,n,1);V.v='cards';V.fs={};V.q='Warded';render()});
 assert.deepEqual((await p.locator('.main .cardName').allTextContents()).sort(),['Deep Anvil Charm','Lanternbound Adept'],'ability search finds natural and gear-granted Warded');
 await p.evaluate(()=>{V.q='Regenerate';render()});
 assert((await p.locator('.main .cardName').allTextContents()).includes('Sister Cera, Last Candle'),'secondary ability is searchable by its display name');
 await p.evaluate(()=>{V.q='';V.fs={a:['ward']};render()});
 assert.deepEqual((await p.locator('.main .cardName').allTextContents()).sort(),['Deep Anvil Charm','Lanternbound Adept'],'ability filter includes equipment grants');
 const enemy=await p.evaluate(()=>{
  const build=DelversCampaignDecks.build;let call;
  try{DelversCampaignDecks.build=(i,r)=>{call={i,r};return Array(30).fill('Lanternbound Adept')};newGame(20,2);V.intro=null}
  finally{DelversCampaignDecks.build=build}
  return{call,names:[...G.e.deck,...G.e.hand].map(c=>c.name)};
 });
 assert.deepEqual(enemy.call,{i:20,r:3},'actual campaign newGame passes the tier-adjusted rarity cap');
 assert.equal(enemy.names.length,30);assert(enemy.names.every(n=>n==='Lanternbound Adept'),'real AI uses the new-card deck built for this encounter');
 await p.evaluate(()=>{G=null;V.v='guide';render()});
 assert.equal(await p.locator('.rules').first().locator('summary').textContent(),'Glossary of game terms','glossary is the first guide section');
 assert.match(await p.locator('.glossary').textContent(),/Warded \(keyword\).*Deep Anvil Charm/);
 assert.match(await p.locator('#app').textContent(),/including ranged attackers/,'guide and glossary describe actual Thorns behaviour');
 assert.deepEqual(errors,[]);
 console.log('PASS exact dynamic pull guide, all 130 real drops, unchanged odds, searchable abilities and new-card campaign AI wiring');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
