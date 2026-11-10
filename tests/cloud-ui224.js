// Same local-server and Playwright setup as ui224.js. Never contacts live Firebase.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const url=process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html';
const clone=x=>JSON.parse(JSON.stringify(x));
let browser,baseline;
async function player({local,cloud,signed=true,failWrite=false,raceSave=null,continueBeforeSync=false}={}){
 const context=await browser.newContext({viewport:{width:844,height:390}});
 await context.addInitScript(({local,signed})=>{
  if(localStorage.getItem('test_initialized'))return;
  localStorage.setItem('test_initialized','1');
  localStorage.setItem('delvers_mute','1');localStorage.setItem('delvers_mus','1');
  localStorage.setItem('delvers_consent','2026-11-09');
  if(local)localStorage.setItem('delvers2',JSON.stringify(local));
  if(signed)localStorage.setItem('delvers_auth',JSON.stringify({uid:'tester',idToken:'fake-token',refresh:'fake-refresh',exp:Date.now()+1e10,base:0}));
 },{local,signed});
 const state={doc:cloud?clone(cloud):null,writes:[],reads:0,failWrite,raceSave,otherRequests:[]};
 let releaseRead;
 const readGate=continueBeforeSync?new Promise(resolve=>{releaseRead=resolve}):null;
 await context.route(/googleapis\.com|firebaseio\.com/,async route=>{
  const request=route.request(),address=new URL(request.url()),method=request.method();
  const respond=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(address.hostname!=='firestore.googleapis.com'){
   state.otherRequests.push(request.url());return respond(404,{});
  }
  assert(address.pathname.endsWith('/documents/users/tester'),'only own save document is accessed');
  if(method==='GET'){state.reads++;if(readGate)await readGate;return respond(state.doc?200:404,state.doc||{})}
  assert.equal(method,'PATCH');
  const fields=request.postDataJSON().fields,version=address.searchParams.get('currentDocument.updateTime');
  if(state.raceSave){state.doc=documentFor(state.raceSave,true);state.doc.updateTime='2026-11-10T16:00:00.000001Z';state.raceSave=null}
  if(version&&version!==state.doc.updateTime)return respond(409,{error:{message:'FAILED_PRECONDITION'}});
  if(state.failWrite)return respond(403,{error:{message:'Permission denied'}});
  assert.deepEqual(address.searchParams.getAll('updateMask.fieldPaths').sort(),['resetEpoch','save','updated']);
  state.writes.push(clone(fields));
  state.doc={fields:{...(state.doc?.fields||{}),...fields},updateTime:'2026-11-10T16:00:01.000001Z'};
  return respond(200,state.doc);
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 if(continueBeforeSync){
  await page.click('[data-a="titlecontinue"]');
  state.beforeSync=await page.evaluate(()=>({packs:S.packs,tutorialMenus:S.tutorialMenus}));
  releaseRead();
 }
 if(signed)await page.waitForFunction(()=>['ok','err','conf'].includes(V.cloud.st));
 return{context,page,state,errors};
}
function documentFor(save,reset=false){
 return{fields:{save:{stringValue:JSON.stringify(save)},updated:{integerValue:String(save.ts||1)},...(reset?{resetEpoch:{integerValue:'1'}}:{}),untouched:{stringValue:'keep me'}},updateTime:'2026-11-10T15:00:00.000001Z'};
}
function oldSave(){
 const save=clone(baseline);delete save.saveEpoch;
 save.gold=950;save.prog=12;save.sp='done';save.sd=['iron','arcane','shadow'];
 save.col.Squire=99;save.builds=[{name:'Old deck',deck:save.deck}];
 save.packs={std:4,t2:3,t3:2};save.stars={0:3};save.ts=123;
 save.cosmetics={avatars:['phoenix'],backgrounds:['crystal-cavern'],scene:'crystal-cavern',emotes:['ember','heart']};
 save.avatar='phoenix';save.ms={d:{k:'2026-11-10',p:{win:3},c:{win:1}},w:{k:'2026-11-09',p:{win:5},c:{}}};
 return save;
}
async function checkReset(x){
 const actual=await x.page.evaluate(()=>S);
 assert.deepEqual({...actual,ts:0},baseline,'all store ownership, cards, decks, currency, missions and progress return to defaults');
 assert.equal(x.state.doc.fields.resetEpoch.integerValue,'1');
 assert.equal(x.state.doc.fields.untouched.stringValue,'keep me','other Firestore fields survive');
 assert.equal(x.state.writes.length,1);
 assert.equal(await x.page.evaluate(()=>V.cloud.conf),null,'legacy saves do not offer a restore choice');
 assert.match(await x.page.locator('.titleStatus').innerText(),/One-time testing reset complete/);
 assert.equal(x.state.otherRequests.length,0,'ranked/social data is not accessed');
 assert.deepEqual(x.errors,[]);
}
async function run(){
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const seed=await player({signed:false});
 baseline=await seed.page.evaluate(()=>freshSave());await seed.context.close();
 const legacy=oldSave(),x=await player({local:legacy,cloud:documentFor(legacy)});
 await checkReset(x);
 await x.page.evaluate(async()=>{
  S.gold=400;buyStarter('iron');S.gold=321;S.prog=1;S.sp='done';
  grantTutorialPack();
  S.dust=1000;CF.unlock(S,S.deckCopies[0],'foil','foil');CF.unlock(S,S.deckCopies[0],'frame','gold');
  const [id]=CF.add(S,'Squire');CF.grantPack(S,id,1,()=>0);S.lastPack={ids:[id]};
  S.builds.push({name:'Finished deck',deck:S.deck.slice(),copyIds:S.deckCopies.slice()});
  sv();await cloudPush();
 });
 const earned=await x.page.evaluate(()=>S),writes=x.state.writes.length;
 assert.deepEqual(earned.sd,['iron'],'starter decks can be bought again after reset');
 assert.equal(earned.tutorialMenus.stage,'pack','the one-time tutorial pack marker uploads with the reward');
 assert.equal(earned.packs.std,1,'the completed account receives one tutorial pack');
 assert.equal(earned.dust,625,'cosmetic purchases deduct Dust before cloud upload');
 assert(earned.copies[earned.deck[0]].find(c=>c.id===earned.deckCopies[0]).purchased,'purchased-copy protection is saved');
 assert.equal(earned.lastPack.ids.length,1,'last pack receipt is saved');
 await x.page.reload();await x.page.waitForFunction(()=>V.cloud.st==='ok');
 assert.deepEqual(await x.page.evaluate(()=>S),earned,'new testing progress and purchases survive reload and sync');
 assert.equal(x.state.writes.length,writes,'reset is not repeated on relaunch');
 const otherDevice=await player({local:legacy,cloud:x.state.doc});
 assert.deepEqual(await otherDevice.page.evaluate(()=>S),earned,'a second device restores Dust, exact deck copies, purchases, pack provenance, receipt and saved builds');
 await otherDevice.page.evaluate(()=>grantTutorialPack());
 assert.equal(await otherDevice.page.evaluate(()=>S.packs.std),1,'another device cannot reclaim the synced tutorial reward');
 assert.equal(otherDevice.state.writes.length,0,'second device does not repeat the reset or upload old progress');
 await otherDevice.context.close();
 const pendingPack={...clone(earned),tutorialMenus:undefined,ts:earned.ts};
 pendingPack.ms=await x.page.evaluate(()=>({d:{k:dayK(),p:{},c:{}},w:{k:weekK(),p:{},c:{}}}));
 const waiting=await player({local:pendingPack,cloud:documentFor(pendingPack,true),continueBeforeSync:true});
 assert.equal(waiting.state.beforeSync.packs.std,earned.packs.std,'the reward waits for the account save before granting');
 assert.equal(waiting.state.beforeSync.tutorialMenus.stage,'claim');
 assert.equal(await waiting.page.evaluate(()=>S.packs.std),earned.packs.std+1,'an accepted legacy account receives the missing pack after sync');
 await waiting.page.evaluate(()=>cloudPush());
 const restored=await player({local:pendingPack,cloud:waiting.state.doc,continueBeforeSync:true});
 assert.equal(restored.state.beforeSync.packs.std,pendingPack.packs.std,'a stale device does not grant before reading the reward marker');
 // Simulate resolving the existing timestamp conflict in favour of the current account save.
 if(await restored.page.evaluate(()=>!!V.cloud.conf)){
  await restored.page.evaluate(()=>{V.v='profile';render()});
  await restored.page.click('[data-a="cuse"]');
 }
 assert.equal(await restored.page.evaluate(()=>S.packs.std),earned.packs.std+1,'restoring the account marker cannot duplicate its tutorial pack');
 await restored.context.close();await waiting.context.close();
 x.state.doc.fields.save.stringValue=JSON.stringify(legacy);
 await x.page.evaluate(()=>cloudSync());
 assert.equal(await x.page.evaluate(()=>V.cloud.st),'err');
 assert.match(await x.page.evaluate(()=>V.cloud.msg),/older app/);
 assert.deepEqual(await x.page.evaluate(()=>S),earned,'old-app upload is not adopted');
 assert.equal(x.state.writes.length,writes,'old-app upload does not repeat the reset');
 await x.context.close();
 const failed=await player({local:legacy,cloud:documentFor(legacy),failWrite:true});
 assert.equal(await failed.page.evaluate(()=>S.gold),legacy.gold,'failed reset preserves the local save');
 assert.equal(failed.state.writes.length,0);
 assert.equal(await failed.page.evaluate(()=>V.cloud.ready),false,'uploads stay disabled after a failed reset');
 assert.match(await failed.page.evaluate(()=>V.cloud.msg),/permission denied/i);
 failed.state.failWrite=false;await failed.page.evaluate(()=>cloudSync());await checkReset(failed);await failed.context.close();
 const progressed={...clone(baseline),gold:411,sp:'none',ts:777};
 const raced=await player({local:legacy,cloud:documentFor(legacy),raceSave:progressed});
 assert.deepEqual(await raced.page.evaluate(()=>S),progressed,'a concurrent reset cannot overwrite another device’s new progress');
 assert.equal(raced.state.writes.length,0);
 assert.equal(raced.state.reads,2,'precondition failure reloads the winning save');
 await raced.context.close();
 const offline=await player({local:legacy,signed:false});
 assert.equal(await offline.page.evaluate(()=>S.gold),legacy.gold,'offline-only saves are not reset');
 assert.equal(offline.state.writes.length,0);
 await offline.page.evaluate(async()=>{
  let blocked=false;try{await cloudPut()}catch(e){blocked=/predates/.test(e.message)}if(!blocked)throw new Error('Legacy upload was not blocked');
 });
 offline.state.doc=documentFor(legacy);
 await offline.page.evaluate(async()=>{
  AU={uid:'tester',idToken:'fake-token',refresh:'fake-refresh',exp:Date.now()+1e10,base:0};saveAuth();await cloudSync();
 });
 await checkReset(offline);await offline.context.close();
 const newAccount=await player();
 assert.equal(newAccount.state.writes.length,1,'a new account starts with a current-epoch save');
 await newAccount.page.evaluate(async()=>{S.gold=222;sv();await cloudPush()});
 await newAccount.page.evaluate(()=>cloudSync());
 assert.equal(await newAccount.page.evaluate(()=>S.gold),222,'new-account testing progress is not reset');
 await newAccount.context.close();
 console.log('PASS one-time account reset, repeat sync, stale devices, old-app rejection, failure recovery, concurrent reset, offline saves and new accounts');
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
