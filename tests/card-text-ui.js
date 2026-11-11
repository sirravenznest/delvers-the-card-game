// Check rendered text, not just container sizes, against the inside of card borders.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({hasTouch:true});
 await page.addInitScript(()=>{localStorage.delvers_mute='1';localStorage.delvers_consent='2026-11-09'});
 await page.goto(process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html');
 await page.locator('.titleActions .pri').click();await page.click('[data-a="tutskipmenu"]');
 for(const [width,height] of [[568,320],[640,360],[740,360],[844,390],[915,412],[1024,600],[1280,720]]){
  await page.setViewportSize({width,height});
  const issues=await page.evaluate(()=>{
   const issues=[];
   function check(label){
    for(const card of document.querySelectorAll('.card')){
     const r=card.getBoundingClientRect(),style=getComputedStyle(card);
     const left=r.left+parseFloat(style.borderLeftWidth)+2,right=r.right-parseFloat(style.borderRightWidth)-2;
     const top=r.top+parseFloat(style.borderTopWidth)+1,bottom=r.bottom-parseFloat(style.borderBottomWidth)-1;
     const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
     while(walker.nextNode()){
      const node=walker.currentNode;if(!node.textContent.trim())continue;
      const parent=node.parentElement;if(!parent.getClientRects().length)continue;
      const range=document.createRange();range.selectNodeContents(node);
      for(const q of range.getClientRects()){
       if(!q.width||!q.height)continue;
       // Only painted portions count when an intentional inner scroller clips text.
       let visible={left:q.left,right:q.right,top:q.top,bottom:q.bottom};
       for(let ancestor=parent;ancestor&&ancestor!==card;ancestor=ancestor.parentElement){
        const s=getComputedStyle(ancestor),a=ancestor.getBoundingClientRect();
        if(s.overflowX!=='visible'){visible.left=Math.max(visible.left,a.left);visible.right=Math.min(visible.right,a.right)}
        if(s.overflowY!=='visible'){visible.top=Math.max(visible.top,a.top);visible.bottom=Math.min(visible.bottom,a.bottom)}
       }
       if(visible.left>=visible.right||visible.top>=visible.bottom)continue;
       if(visible.left<left-.5||visible.right>right+.5||visible.top<top-.5||visible.bottom>bottom+.5)issues.push(label+' '+card.dataset.z+' '+parent.className+' '+node.textContent);
      }
     }
    }
   }
   G=null;V.intro=null;V.fo=false;V.fs={};V.q='';V.un=false;
   for(const c of ALL)S.col[c.name]=3;CF.normalize(S);
   for(const view of ['cards','deck']){V.v=view;render();check(view)}
   newGame(0,1,true);V.intro=null;G.p.hand=ALL.map(mk);render();check('hand');
   return [...new Set(issues)];
  });
  assert.deepEqual(issues,[],width+'x'+height+' card text stays clear of borders');
  console.log('PASS actual text stays inside card borders',width,height);
 }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
