// Ranked matchmaking and match transport over the Firebase Realtime Database REST API (free Spark plan, no server code).
// Both clients replay the same seeded engine, so every action is validated locally by the opponent.
(function(root){
const P=typeof require!=='undefined'?require('./pvp.js'):root.DelversPvp;
const B=typeof require!=='undefined'?require('./ranked-bots.js'):root.DelversRankedBots;
const EM=typeof require!=='undefined'?require('./emotes.js'):root.DelversEmotes;
const F=typeof require!=='undefined'?require('./card-cosmetics.js'):root.DelversCardCosmetics;
const SV={'.sv':'timestamp'};
// Bump when rules or the shared battle presentation contract changes.
const PROTO=6,VERR='You and your opponent are on different versions of the app. Please update to the latest version.';
const TURN_MS=75000,FRIENDLY_MS=120000,GRACE_MS=20000,STALE_MS=45000,BEAT_MS=10000,BOT_WAIT_MS=20000;

function create(o){
 const T={st:'idle',err:'',mid:null,seat:null,G:null,meta:null,over:null,why:'',rec:null,opp:null,lastT:0,idle:0,joinedAt:0,
  queueAge:0,botAvailable:false,queueGen:0,isBot:false,botSeat:null,botProfile:null,
  finished:false,outbox:[],sending:false,busy:false,emote:null,lastEmoteAt:-Infinity,lastEmoteKey:null};
 const now=()=>o.now?o.now():Date.now();
 const uid=()=>o.auth().uid;
 const deckLooks=deck=>{const looks=o.cardLooks?o.cardLooks():[];return deck.map((_,i)=>F.cleanLook(looks[i]))};
 async function rq(m,path,body,q){
  const a=o.auth(),u=`${o.db}/${path}.json?auth=${encodeURIComponent(a.tok)}${q?'&'+q:''}`;
  const r=await o.fetch(u,{method:m,body:body===undefined||m=='GET'||m=='DELETE'?undefined:JSON.stringify(body)});
  if(!r.ok){const e=new Error('db '+r.status);e.status=r.status;throw e}
  return r.json()}
 const changed=()=>{if(o.onChange)o.onChange(T)};
 const srv=()=>now()+(T.off||0);
 const emotePrefix=id=>'emote_'+id+'_';
 T.sendEmote=async id=>{
  if(T.st!='match'||!T.mid)throw new Error('No active match.');
  if(!EM.byId[id])throw new Error('Unknown emote.');
  if(now()-T.lastEmoteAt<EM.COOLDOWN_MS)throw new Error('Please wait 3 seconds between emotes.');
  const at=now(),previous=T.lastEmoteAt,key=emotePrefix(uid())+String(at).padStart(16,'0')+'_'+Math.random().toString(36).slice(2,8);
  T.lastEmoteAt=at;
  try{await rq('PUT',`matches/${T.mid}/log/${key}`,{u:uid(),emote:id,t:SV})}
  catch(e){T.lastEmoteAt=previous;throw e}
  T.emote={id,u:uid(),key};changed();
 };
 async function readEmote(){
  const prefix=emotePrefix(T.opp.uid),q='orderBy="$key"&startAt='+encodeURIComponent(JSON.stringify(prefix))+'&endAt='+encodeURIComponent(JSON.stringify(prefix+'\uf8ff'))+'&limitToLast=1';
  const messages=await rq('GET',`matches/${T.mid}/log`,null,q)||{};
  const key=Object.keys(messages).sort().pop(),x=key&&messages[key];
  if(!x||key==T.lastEmoteKey)return;
  T.lastEmoteKey=key;
  if(x.u!=T.opp.uid||!EM.byId[x.emote]||typeof x.t!='number'||srv()-x.t>10000||x.t>srv()+5000)return;
  T.emote={id:x.emote,u:x.u,key};changed();
 }

 T.getRating=async()=>{const r=await rq('GET','ratings/'+uid());T.rec=r&&typeof r.r=='number'?{r:r.r,w:r.w||0,l:r.l||0,from:r.from||null}:{r:1000,w:0,l:0,from:null};return T.rec};
 T.leaderboard=async()=>{const r=await rq('GET','ratings',null,'orderBy="r"&limitToLast=20')||{};return Object.keys(r).map(k=>({uid:k,n:r[k].n||'Delver',r:r[k].r,w:r[k].w||0,l:r[k].l||0})).sort((a,b)=>b.r-a.r)};

 T.join=async deck=>{
  if(!P.validRanked(deck))throw new Error('Your deck needs 20-30 cards, max 3 copies each.');
  if(!B)throw new Error('Ranked bot matching is unavailable. Please reload the app.');
  await T.getRating();
  // A prior pending result already booked its loss. A new queue entry commits that loss.
  if(T.rec.from){await rq('PATCH','ratings/'+uid(),{from:null});T.rec.from=null}
  const a=o.auth(),t0=now();
  await rq('PUT','queue/'+a.uid,{n:a.name||'Delver',av:o.avatar?o.avatar():'vanguard',r:T.rec.r,w:T.rec.w,l:T.rec.l,d:deck,looks:deckLooks(deck),pv:PROTO,t:SV,j:SV});
  const me=await rq('GET','queue/'+a.uid);
  T.queueGen++;T.off=me.t-t0;T.joinedAt=me.j;T.lastBeat=now();T.queueAge=0;T.botAvailable=false;
  T.deck=deck;T.st='queue';T.err='';T.finished=false;T.over=null;changed()};
 T.leave=async()=>{
  if(T.st!='queue')return;
  T.queueGen++;T.st='idle';T.queueAge=0;T.botAvailable=false;changed();
  // A write-once tombstone races atomically with another client's match claim.
  try{await rq('PUT','queue/'+uid()+'/m','cancelled')}catch(e){}
  try{await rq('DELETE','queue/'+uid())}catch(e){}
  changed()};

 async function beat(){if(now()-T.lastBeat<BEAT_MS)return;T.lastBeat=now();await rq('PATCH','queue/'+uid(),{t:SV})}
 const window_=(e)=>100+20*Math.floor(Math.max(0,srv()-e.j)/5000);
 function humanWaiting(q,mine){
  if(!mine)return false;
  for(const k of Object.keys(q||{})){const e=q[k];if(k==uid()||!e||e.m||e.pv!==PROTO||typeof e.r!='number'||!P.validRanked(e.d))continue;
   if(srv()-e.t>STALE_MS)continue;
   if(Math.abs(e.r-mine.r)<=Math.max(window_(mine),window_(e)))return true}
  return false}

 async function pair(q,gen){
  const me=uid(),mine=q[me];if(!mine)return false;
  let best=null;
  for(const k of Object.keys(q)){const e=q[k];if(k==me||!e||e.m||e.pv!==PROTO||typeof e.r!='number'||!P.validRanked(e.d))continue;
   if(srv()-e.t>STALE_MS)continue;
   const diff=Math.abs(e.r-mine.r);if(diff>Math.max(window_(mine),window_(e)))continue;
   if(!best||diff<best.diff)best={k,e,diff}}
  if(!best||me>best.k)return false;
  if(gen!==T.queueGen||T.st!='queue')return false;
  const mid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  try{await rq('PUT',`queue/${best.k}/m`,mid)}catch(e){return false}
  if(gen!==T.queueGen||T.st!='queue')return false;
  const seed=Math.floor(Math.random()*4294967296),meFirst=seed%2==0;
  const meta={p:meFirst?me:best.k,e:meFirst?best.k:me,seed,t0:SV,rk:1,tl:75,pv:PROTO,
   names:{[me]:mine.n||'Delver',[best.k]:best.e.n||'Delver'},avatars:{[me]:mine.av||'vanguard',[best.k]:best.e.av||'vanguard'},r:{[me]:mine.r,[best.k]:best.e.r},
   records:{[me]:{w:mine.w||0,l:mine.l||0},[best.k]:{w:best.e.w||0,l:best.e.l||0}},
   deckP:meFirst?mine.d:best.e.d,deckE:meFirst?best.e.d:mine.d,
   looksP:(meFirst?mine.looks:best.e.looks)||[],looksE:(meFirst?best.e.looks:mine.looks)||[]};
  await rq('PUT',`matches/${mid}/meta`,meta);
  if(gen!==T.queueGen||T.st!='queue')return false;
  T.mid=mid;return true}

 async function pairBot(q,gen){
  const me=uid(),mine=q&&q[me],age=mine&&typeof mine.j=='number'?srv()-mine.j:-1;
  if(!mine||mine.m||age<BOT_WAIT_MS||gen!==T.queueGen||T.st!='queue')return false;
  // Recheck immediately before the write-once claim. A human claim on this same
  // queue node wins the race; otherwise this reservation prevents double matching.
  const latestQueue=await rq('GET','queue')||{},latest=latestQueue[me];
  if(gen!==T.queueGen||T.st!='queue')return false;
  if(humanWaiting(latestQueue,latest))return await pair(latestQueue,gen);
  if(!latest||latest.m||latest.pv!==PROTO||latest.j!==mine.j)return false;
  const mid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  try{await rq('PUT',`queue/${me}/m`,mid)}catch(e){return false}
  const claimed=await rq('GET','queue/'+me);
  if(gen!==T.queueGen||T.st!='queue'||!claimed||claimed.m!==mid){
   if(claimed&&claimed.m==mid)try{await rq('DELETE','queue/'+me)}catch(e){}
   return false}
  const seed=Math.floor(Math.random()*4294967296),bot=B.forRating(mine.r,seed),botId='bot_'+mid;
  const meFirst=seed%2==0,p=meFirst?me:botId,e=meFirst?botId:me;
  const meta={p,e,seed,t0:SV,rk:1,tl:75,pv:PROTO,
   names:{[me]:mine.n||'Delver',[botId]:bot.name},avatars:{[me]:mine.av||'vanguard',[botId]:bot.avatar},
   r:{[me]:mine.r,[botId]:bot.r},
   records:{[me]:{w:mine.w||0,l:mine.l||0},[botId]:{w:0,l:0}},
   deckP:meFirst?mine.d:bot.deck,deckE:meFirst?bot.deck:mine.d,
   looksP:meFirst?mine.looks||[]:[],looksE:meFirst?[]:mine.looks||[],
   bot:{v:1,uid:botId,label:bot.label,name:bot.name,tier:bot.tier,r:bot.r,skill:bot.skill,theme:bot.theme,title:bot.title}};
  const still=await rq('GET','queue/'+me);
  if(gen!==T.queueGen||T.st!='queue'||!still||still.m!==mid){
   if(still&&still.m==mid)try{await rq('DELETE','queue/'+me)}catch(err){}
   return false}
  await rq('PUT',`matches/${mid}/meta`,meta);
  if(gen!==T.queueGen||T.st!='queue')return false;
  T.mid=mid;return true}

 async function begin(mid){
  const meta=await rq('GET',`matches/${mid}/meta`);if(!meta)return false;
  const me=uid();
  if(meta.p!=me&&meta.e!=me)return false;
  if(meta.pv!==PROTO){T.mid=null;T.st='over';T.err=VERR;changed();return true}
  T.meta=meta;T.mid=mid;T.seat=meta.p==me?'p':'e';T.emote=null;T.lastEmoteKey=null;
  const oid=T.seat=='p'?meta.e:meta.p;
  const meRecord=meta.records&&meta.records[me]||{w:T.rec&&T.rec.w||0,l:T.rec&&T.rec.l||0};
  const oppRecord=meta.records&&meta.records[oid]||{w:0,l:0};
  T.myRecord={r:(meta.r&&meta.r[me])||(T.rec&&T.rec.r)||1000,w:meRecord.w||0,l:meRecord.l||0};
  T.isBot=!!(meta.bot&&meta.bot.v==1&&meta.bot.uid==oid);
  T.botSeat=T.isBot?(T.seat=='p'?'e':'p'):null;
  T.botProfile=T.isBot?meta.bot:null;
  T.opp={uid:oid,name:(meta.names&&meta.names[oid])||'Opponent',avatar:meta.avatars&&meta.avatars[oid]||'vanguard',r:(meta.r&&meta.r[oid])||1000,w:oppRecord.w||0,l:oppRecord.l||0,
   bot:T.isBot,label:T.isBot?'BOT':null,tier:T.isBot?meta.bot.tier:null,theme:T.isBot?meta.bot.title:null};
  if(meta.rk&&!T.rec)await T.getRating();
  T.myR=(meta.r&&meta.r[me])||(T.rec&&T.rec.r)||1000;
  const okDeck=meta.rk?P.validRanked:P.validDeck;
  if(!okDeck(meta.deckP)||!okDeck(meta.deckE)){T.st='over';T.err='The match was invalid.';changed();return true}
  const mine=T.seat=='p'?meta.deckP:meta.deckE;
  if(JSON.stringify(mine)!=JSON.stringify(T.deck)){T.st='over';T.err='The match was invalid.';changed();return true}
  T.G=P.newMatch(meta.seed,meta.deckP,meta.deckE,{looksP:meta.looksP,looksE:meta.looksE});
  T.lastT=srv();T.idle=0;T.outbox=[];T.finished=false;T.over=null;
  try{await rq('DELETE','queue/'+me)}catch(e){}
  // The loss is booked up front so that quitting a ranked match costs rating; a win restores it.
  T.ranked=!!meta.rk;T.from=null;
  T.tl=meta.rk?TURN_MS:Math.min(300000,Math.max(30000,(meta.tl|0)*1000||FRIENDLY_MS));
  if(meta.rk){
   const pending=T.rec.from&&T.rec.from.mid==mid?T.rec.from:null;
   if(pending)T.from={mid,r:pending.r,w:pending.w,l:pending.l};
   else{
    if(T.rec.from){await rq('PATCH','ratings/'+me,{from:null});T.rec.from=null}
    const from={mid,r:T.rec.r,w:T.rec.w,l:T.rec.l};
    T.from=from;
    const loss=P.elo(T.rec.r,T.opp.r,0)[0];
    await rq('PUT','ratings/'+me,{n:o.auth().name||'Delver',r:loss,w:T.rec.w,l:T.rec.l+1,from});
    T.rec={r:loss,w:T.rec.w,l:T.rec.l+1,from};
   }}
  T.st='match';changed();return true}

 T.resume=async mid=>{
  if(!mid)throw new Error('A match id is required to resume.');
  const meta=await rq('GET',`matches/${mid}/meta`);
  if(!meta||(meta.p!=uid()&&meta.e!=uid()))throw new Error('That match is no longer available.');
  T.rec=null;await T.getRating();
  T.deck=meta.p==uid()?meta.deckP:meta.deckE;
  if(!(meta.rk?P.validRanked(T.deck):P.validDeck(T.deck)))throw new Error('The saved match deck is invalid.');
  T.finished=false;T.over=null;T.err='';
  const result=await rq('GET',`matches/${mid}/res/${uid()}`);
  if(result){
   const me=uid(),seat=meta.p==me?'p':'e',oid=seat=='p'?meta.e:meta.p,rec=meta.records&&meta.records[oid]||{};
   T.mid=mid;T.meta=meta;T.seat=seat;T.isBot=!!(meta.bot&&meta.bot.v==1&&meta.bot.uid==oid);
   T.botSeat=T.isBot?(seat=='p'?'e':'p'):null;T.botProfile=T.isBot?meta.bot:null;
   T.opp={uid:oid,name:(meta.names&&meta.names[oid])||'Opponent',avatar:meta.avatars&&meta.avatars[oid]||'vanguard',
    r:(meta.r&&meta.r[oid])||1000,w:rec.w||0,l:rec.l||0,bot:T.isBot,label:T.isBot?'BOT':null,
    tier:T.isBot?meta.bot.tier:null,theme:T.isBot?meta.bot.title:null};
   T.G=P.newMatch(meta.seed,meta.deckP,meta.deckE,{looksP:meta.looksP,looksE:meta.looksE});T.G.over=result.w;
   T.ranked=!!meta.rk;T.from=null;T.over=result.w;T.why=result.why;T.st='over';T.finished=true;
   // A previous client may have saved the result but lost its rating write. Finalize
   // only the matching pending marker; completed results are otherwise idempotent.
   if(meta.rk&&T.rec.from&&T.rec.from.mid==mid){
    const f=T.rec.from;
    if(result.w==seat)await rq('PUT','ratings/'+me,{n:o.auth().name||'Delver',r:P.elo(f.r,T.opp.r,1)[0],w:f.w+1,l:f.l});
    else await rq('PATCH','ratings/'+me,{from:null});
    T.rec=null;await T.getRating();
   }
   changed();return true}
  return begin(mid)};
 T.reconnect=async()=>{
  await T.getRating();
  return T.rec.from&&T.rec.from.mid?T.resume(T.rec.from.mid):false};

 async function flush(){
  if(T.sending)return;T.sending=true;
  try{while(T.outbox.length){const x=T.outbox[0];await rq('PUT',`matches/${T.mid}/log/${x.k}`,x.e);T.outbox.shift()}}
  catch(e){T.err='Connection problem, retrying...'}
  finally{T.sending=false}}

 function mine(a){ // apply my own action locally then queue it for upload
  const G=T.G,k=G.n,r=P.act(G,T.seat,a);
  if(!r.ok)return r;
  T.outbox.push({k,e:{u:uid(),a,t:SV}});
  if(a.a!='end')T.idle=0;
  T.lastT=srv();
  return r}
 T.act=a=>{
  if(T.st!='match'||T.finished)return{ok:false,err:'No active match.'};
  if(a&&a.a=='resign'){T.resign();return{ok:true}}
  const r=mine(a);
  if(r.ok){afterApply();flush();changed()}
  return r};
 T.resign=()=>{
  if(T.st!='match'||T.finished)return;
  const k=T.G.n;P.act(T.G,T.seat,{a:'resign'});
  T.outbox.push({k,e:{u:uid(),a:{a:'resign'},t:SV}});
  afterApply();flush();changed()};

 function afterApply(){if(T.G.over&&!T.finished)finish(T.G.over,T.opp&&T.G.over==T.seat?'win':'loss')}

 async function finish(winner,why){
  if(T.finished)return;T.finished=true;T.over=winner;T.why=why;T.st='over';changed();
  const me=uid();
  try{
   await flush();
   await rq('PUT',`matches/${T.mid}/res/${me}`,{w:winner,why});
   const f=T.from;
   if(f){
    if(winner==T.seat)await rq('PUT','ratings/'+me,{n:o.auth().name||'Delver',r:P.elo(f.r,T.opp.r,1)[0],w:f.w+1,l:f.l});
    else await rq('PATCH','ratings/'+me,{from:null});
    T.rec=null;await T.getRating()}
  }catch(e){T.err='Result could not be saved: '+e.message}
  changed()}

 async function matchTick(){
  const G=T.G,me=uid(),oid=T.opp.uid;
  await flush();
  await readEmote();
  // Bot turns are regenerated from the seed and current state. This keeps restart/reconnect
  // replay deterministic without writing synthetic bot actions as human log entries.
  if(T.isBot&&G.turn==T.botSeat&&!G.over){
   B.playTurn(G,T.botSeat,T.botProfile&&T.botProfile.skill||0);
   T.lastT=srv();changed();
   if(G.over){afterApply();return}
  }
  const lg=await rq('GET',`matches/${T.mid}/log`,null,`orderBy="$key"&startAt="${G.n}"&endAt="2147483647"`)||{};
  const keys=Object.keys(lg).filter(k=>/^(0|[1-9]\d*)$/.test(k)).map(Number).sort((a,b)=>a-b);
  for(const k of keys){
   if(k!=G.n)break;
   const e=lg[k],seat=e&&(e.u==T.meta.p?'p':e.u==T.meta.e?'e':null);
   if(!seat||!e.a){finish(T.seat,'cheat');return}
   if(seat==T.seat){if(!P.act(G,seat,e.a).ok){finish(T.seat,'cheat');return}continue}
   const r=P.act(G,seat,e.a);
   if(!r.ok){finish(T.seat,'cheat');return}
   if(typeof e.t=='number'){T.lastT=e.t;T.off=e.t-now()}
   changed()}
  if(G.over){afterApply();return}
  const res=await rq('GET',`matches/${T.mid}/res/${oid}`);
  if(res&&res.w==T.seat&&res.why=='resign'){finish(T.seat,'win');return}
  const idle=srv()-T.lastT;
  if(G.turn==T.seat){
   if(idle>T.tl){
    T.idle++;
    if(T.idle>=3){T.resign();return}
    const r=mine({a:'end'});if(r.ok){afterApply();flush();changed()}}}
  else if(idle>T.tl+GRACE_MS)finish(T.seat,'timeout')}

 T.tick=async()=>{
  if(T.busy)return;T.busy=true;
  try{
   if(T.st=='queue'){
    const gen=T.queueGen;
    await beat();
    if(gen!==T.queueGen||T.st!='queue')return;
    const q=await rq('GET','queue')||{};
    if(gen!==T.queueGen||T.st!='queue')return;
    const mine=q[uid()];
    if(mine&&mine.m&&mine.m!='cancelled'){await begin(mine.m);return}
    if(mine){
     T.queueAge=Math.max(0,srv()-(typeof mine.j=='number'?mine.j:T.joinedAt));
     T.botAvailable=T.queueAge>=BOT_WAIT_MS;
     if(await pair(q,gen)){if(gen===T.queueGen&&T.st=='queue')await begin(T.mid)}
     else if(T.botAvailable&&!humanWaiting(q,mine)&&await pairBot(q,gen)){if(gen===T.queueGen&&T.st=='queue')await begin(T.mid)}
    }else if(gen===T.queueGen){T.st='idle';T.queueAge=0;T.botAvailable=false}
   }else if(T.st=='invite'){
    const inv=await rq('GET',`invites/${T.inviteTo.uid}/${uid()}`);
    if(inv&&inv.m){const mid=inv.m;try{await rq('DELETE',`invites/${T.inviteTo.uid}/${uid()}`)}catch(e){}await begin(mid)}
    else if(!inv||now()-T.inviteAt>120000){T.st='idle';T.err=inv?'The invite expired.':'The invite was declined.';try{await rq('DELETE',`invites/${T.inviteTo.uid}/${uid()}`)}catch(e){}}
   }else if(T.st=='match')await matchTick();
   T.err=T.err&&T.err.startsWith('Connection')?'':T.err
  }catch(e){T.err='Connection problem, retrying...'}
  finally{T.busy=false;changed()}};
 // ---- Private (friendly, unranked) games between friends ----
 T.invite=async(fid,fname,deck)=>{
  if(!P.validDeck(deck))throw new Error('Your deck needs 20-30 cards, max 3 copies each.');
  await T.getRating();
  const a=o.auth();
  await rq('PUT',`invites/${fid}/${a.uid}`,{n:a.name||'Delver',av:o.avatar?o.avatar():'vanguard',r:T.rec.r,w:T.rec.w,l:T.rec.l,d:deck,looks:deckLooks(deck),pv:PROTO,t:SV});
  T.deck=deck;T.inviteTo={uid:fid,name:fname||'Friend'};T.inviteAt=now();T.st='invite';T.err='';T.finished=false;T.over=null;changed()};
 T.cancelInvite=async()=>{if(T.st!='invite')return;T.st='idle';const f=T.inviteTo;T.inviteTo=null;try{await rq('DELETE',`invites/${f.uid}/${uid()}`)}catch(e){}changed()};
 T.declineInvite=async from=>{await rq('DELETE',`invites/${uid()}/${from}`)};
 T.acceptInvite=async(from,deck)=>{
  if(!P.validDeck(deck))throw new Error('Your deck needs 20-30 cards, max 3 copies each.');
  const inv=await rq('GET',`invites/${uid()}/${from}`);
  if(!inv||!P.validDeck(inv.d))throw new Error('That invite is no longer available.');
  if(inv.pv!==PROTO)throw new Error(VERR);
  await T.getRating();
  const me=uid(),seed=Math.floor(Math.random()*4294967296),meFirst=seed%2==0;
  const meta={p:meFirst?me:from,e:meFirst?from:me,seed,t0:SV,rk:0,tl:120,pv:PROTO,names:{[me]:o.auth().name||'Delver',[from]:inv.n||'Friend'},avatars:{[me]:o.avatar?o.avatar():'vanguard',[from]:inv.av||'vanguard'},
   r:{[me]:T.rec.r,[from]:inv.r||1000},records:{[me]:{w:T.rec.w,l:T.rec.l},[from]:{w:inv.w||0,l:inv.l||0}},
   deckP:meFirst?deck:inv.d,deckE:meFirst?inv.d:deck,
   looksP:meFirst?deckLooks(deck):inv.looks||[],looksE:meFirst?inv.looks||[]:deckLooks(deck)};
  const mid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  await rq('PUT',`matches/${mid}/meta`,meta);
  await rq('PUT',`invites/${me}/${from}/m`,mid);
  T.deck=deck;await begin(mid)};

 T.timeLeft=()=>T.st=='match'?Math.max(0,(T.tl||TURN_MS)-(srv()-T.lastT)):0;
 return T}

const api={create,PROTO,TURN_MS,FRIENDLY_MS,GRACE_MS,BOT_WAIT_MS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversNet=api;
})(typeof self!=='undefined'?self:globalThis);
