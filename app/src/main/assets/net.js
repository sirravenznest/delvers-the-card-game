// Ranked matchmaking and match transport over the Firebase Realtime Database REST API (free Spark plan, no server code).
// Both clients replay the same seeded engine, so every action is validated locally by the opponent.
(function(root){
const P=typeof require!=='undefined'?require('./pvp.js'):root.DelversPvp;
const SV={'.sv':'timestamp'};
const TURN_MS=75000,FRIENDLY_MS=120000,GRACE_MS=20000,STALE_MS=45000,BEAT_MS=10000;

function create(o){
 const T={st:'idle',err:'',mid:null,seat:null,G:null,meta:null,over:null,why:'',rec:null,opp:null,lastT:0,idle:0,joinedAt:0,
  finished:false,outbox:[],sending:false,busy:false};
 const now=()=>o.now?o.now():Date.now();
 const uid=()=>o.auth().uid;
 async function rq(m,path,body,q){
  const a=o.auth(),u=`${o.db}/${path}.json?auth=${encodeURIComponent(a.tok)}${q?'&'+q:''}`;
  const r=await o.fetch(u,{method:m,body:body===undefined||m=='GET'||m=='DELETE'?undefined:JSON.stringify(body)});
  if(!r.ok){const e=new Error('db '+r.status);e.status=r.status;throw e}
  return r.json()}
 const changed=()=>{if(o.onChange)o.onChange(T)};
 const srv=()=>now()+(T.off||0);

 T.getRating=async()=>{const r=await rq('GET','ratings/'+uid());T.rec=r&&typeof r.r=='number'?{r:r.r,w:r.w||0,l:r.l||0}:{r:1000,w:0,l:0};return T.rec};
 T.leaderboard=async()=>{const r=await rq('GET','ratings',null,'orderBy="r"&limitToLast=20')||{};return Object.keys(r).map(k=>({uid:k,n:r[k].n||'Delver',r:r[k].r,w:r[k].w||0,l:r[k].l||0})).sort((a,b)=>b.r-a.r)};

 T.join=async deck=>{
  if(!P.validRanked(deck))throw new Error('Ranked decks need exactly 30 cards: max 3 copies, 2 of a Rare, 1 of a Legendary.');
  await T.getRating();
  const a=o.auth(),t0=now();
  await rq('PUT','queue/'+a.uid,{n:a.name||'Delver',r:T.rec.r,d:deck,t:SV,j:SV});
  const me=await rq('GET','queue/'+a.uid);
  T.off=me.t-t0;T.joinedAt=me.j;T.lastBeat=now();T.deck=deck;T.st='queue';T.err='';T.finished=false;T.over=null;changed()};
 T.leave=async()=>{if(T.st!='queue')return;T.st='idle';try{await rq('DELETE','queue/'+uid())}catch(e){}changed()};

 async function beat(){if(now()-T.lastBeat<BEAT_MS)return;T.lastBeat=now();await rq('PATCH','queue/'+uid(),{t:SV})}
 const window_=(e)=>100+20*Math.floor(Math.max(0,srv()-e.j)/5000);

 async function pair(q){
  const me=uid(),mine=q[me];if(!mine)return false;
  let best=null;
  for(const k of Object.keys(q)){const e=q[k];if(k==me||!e||e.m||typeof e.r!='number'||!P.validRanked(e.d))continue;
   if(srv()-e.t>STALE_MS)continue;
   const diff=Math.abs(e.r-mine.r);if(diff>Math.max(window_(mine),window_(e)))continue;
   if(!best||diff<best.diff)best={k,e,diff}}
  if(!best||me>best.k)return false;
  const mid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  try{await rq('PUT',`queue/${best.k}/m`,mid)}catch(e){return false}
  const seed=Math.floor(Math.random()*4294967296),meFirst=seed%2==0;
  const meta={p:meFirst?me:best.k,e:meFirst?best.k:me,seed,t0:SV,rk:1,tl:75,
   names:{[me]:mine.n||'Delver',[best.k]:best.e.n||'Delver'},r:{[me]:mine.r,[best.k]:best.e.r},
   deckP:meFirst?mine.d:best.e.d,deckE:meFirst?best.e.d:mine.d};
  await rq('PUT',`matches/${mid}/meta`,meta);
  T.mid=mid;return true}

 async function begin(mid){
  const meta=await rq('GET',`matches/${mid}/meta`);if(!meta)return false;
  const me=uid();
  if(meta.p!=me&&meta.e!=me)return false;
  T.meta=meta;T.mid=mid;T.seat=meta.p==me?'p':'e';
  const oid=T.seat=='p'?meta.e:meta.p;
  T.opp={uid:oid,name:(meta.names&&meta.names[oid])||'Opponent',r:(meta.r&&meta.r[oid])||1000};
  if(meta.rk&&!T.rec)await T.getRating();
  T.myR=(meta.r&&meta.r[me])||(T.rec&&T.rec.r)||1000;
  const okDeck=meta.rk?P.validRanked:P.validDeck;
  if(!okDeck(meta.deckP)||!okDeck(meta.deckE)){T.st='over';T.err='The match was invalid.';changed();return true}
  const mine=T.seat=='p'?meta.deckP:meta.deckE;
  if(JSON.stringify(mine)!=JSON.stringify(T.deck)){T.st='over';T.err='The match was invalid.';changed();return true}
  T.G=P.newMatch(meta.seed,meta.deckP,meta.deckE);
  T.lastT=srv();T.idle=0;T.outbox=[];T.finished=false;T.over=null;
  try{await rq('DELETE','queue/'+me)}catch(e){}
  // The loss is booked up front so that quitting a ranked match costs rating; a win restores it.
  T.ranked=!!meta.rk;T.from=null;
  T.tl=meta.rk?TURN_MS:Math.min(300000,Math.max(30000,(meta.tl|0)*1000||FRIENDLY_MS));
  if(meta.rk){
   const from={mid,r:T.rec.r,w:T.rec.w,l:T.rec.l};
   T.from=from;
   await rq('PUT','ratings/'+me,{n:o.auth().name||'Delver',r:P.elo(T.rec.r,T.opp.r,0)[0],w:T.rec.w,l:T.rec.l+1,from})}
  T.st='match';changed();return true}

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
  const lg=await rq('GET',`matches/${T.mid}/log`,null,`orderBy="$key"&startAt="${G.n}"`)||{};
  const keys=Object.keys(lg).map(Number).sort((a,b)=>a-b);
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
    await beat();
    const q=await rq('GET','queue')||{};
    const mine=q[uid()];
    if(mine&&mine.m){await begin(mine.m);return}
    if(mine&&await pair(q)){await begin(T.mid)}
    else if(!mine){T.st='idle'}
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
  const a=o.auth();
  await rq('PUT',`invites/${fid}/${a.uid}`,{n:a.name||'Delver',d:deck,t:SV});
  T.deck=deck;T.inviteTo={uid:fid,name:fname||'Friend'};T.inviteAt=now();T.st='invite';T.err='';T.finished=false;T.over=null;changed()};
 T.cancelInvite=async()=>{if(T.st!='invite')return;T.st='idle';const f=T.inviteTo;T.inviteTo=null;try{await rq('DELETE',`invites/${f.uid}/${uid()}`)}catch(e){}changed()};
 T.declineInvite=async from=>{await rq('DELETE',`invites/${uid()}/${from}`)};
 T.acceptInvite=async(from,deck)=>{
  if(!P.validDeck(deck))throw new Error('Your deck needs 20-30 cards, max 3 copies each.');
  const inv=await rq('GET',`invites/${uid()}/${from}`);
  if(!inv||!P.validDeck(inv.d))throw new Error('That invite is no longer available.');
  const me=uid(),seed=Math.floor(Math.random()*4294967296),meFirst=seed%2==0;
  const meta={p:meFirst?me:from,e:meFirst?from:me,seed,t0:SV,rk:0,tl:120,names:{[me]:o.auth().name||'Delver',[from]:inv.n||'Friend'},
   deckP:meFirst?deck:inv.d,deckE:meFirst?inv.d:deck};
  const mid=Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  await rq('PUT',`matches/${mid}/meta`,meta);
  await rq('PUT',`invites/${me}/${from}/m`,mid);
  T.deck=deck;await begin(mid)};

 T.timeLeft=()=>T.st=='match'?Math.max(0,(T.tl||TURN_MS)-(srv()-T.lastT)):0;
 return T}

const api={create,TURN_MS,FRIENDLY_MS,GRACE_MS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversNet=api;
})(typeof self!=='undefined'?self:globalThis);
