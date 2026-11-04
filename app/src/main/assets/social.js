// Friends, friend codes and presence over the Realtime Database REST API (free Spark plan).
// A friendship is mutual: each player writes only their own friend list, and it counts once both sides have added each other.
(function(root){
const SV={'.sv':'timestamp'};
const ALPHA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',ONLINE_MS=150000,MAXF=50;

function create(o){
 const S={code:'',name:'',friends:[],incoming:[],outgoing:[],invites:[],err:''};
 const uid=()=>o.auth().uid;
 async function rq(m,path,body,q){
  const a=o.auth(),u=`${o.db}/${path}.json?auth=${encodeURIComponent(a.tok)}${q?'&'+q:''}`;
  const r=await o.fetch(u,{method:m,body:body===undefined||m=='GET'||m=='DELETE'?undefined:JSON.stringify(body)});
  if(!r.ok){const e=new Error('db '+r.status);e.status=r.status;throw e}
  return r.json()}
 const newCode=()=>{let c='';for(let i=0;i<6;i++)c+=ALPHA[Math.floor(Math.random()*ALPHA.length)];return c};
 const cleanName=n=>String(n||'Delver').replace(/[^\w .'-]/g,'').trim().slice(0,20)||'Delver';
 const cleanCode=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');

 S.ensureProfile=async()=>{
  const me=uid(),name=cleanName(o.auth().name);
  const p=await rq('GET','profiles/'+me);
  if(p&&p.c){S.code=p.c;S.name=name;await rq('PATCH','profiles/'+me,{n:name,t:SV});await S.heartbeat();return S.code}
  for(let i=0;i<8;i++){
   const c=newCode();
   try{await rq('PUT','codes/'+c,me)}catch(e){if(e.status==401||e.status==403)continue;throw e}
   await rq('PUT','profiles/'+me,{n:name,c,t:SV});S.code=c;S.name=name;return c}
  throw new Error('Could not create a friend code. Try again.')};
 S.heartbeat=async()=>{await rq('PATCH','profiles/'+uid(),{t:SV});const q=await rq('GET','profiles/'+uid());if(q&&q.t)S.off=q.t-Date.now()};

 S.addByCode=async raw=>{
  const code=cleanCode(raw),me=uid();
  if(code.length!=6)throw new Error('Friend codes have 6 letters and numbers.');
  const fid=await rq('GET','codes/'+code);
  if(!fid||typeof fid!='string')throw new Error('No player has that code.');
  if(fid==me)throw new Error('That is your own code.');
  const mine=await rq('GET','social/'+me+'/friends')||{};
  if(Object.keys(mine).length>=MAXF&&!mine[fid])throw new Error('Your friend list is full.');
  const p=await rq('GET','profiles/'+fid);
  const name=(p&&p.n)||'Delver';
  await rq('PUT',`social/${me}/friends/${fid}`,{n:name});
  await rq('PUT',`social/${fid}/in/${me}`,{n:cleanName(o.auth().name),t:SV});
  return{uid:fid,name}};

 S.accept=async fid=>{
  const me=uid(),p=await rq('GET','profiles/'+fid);
  await rq('PUT',`social/${me}/friends/${fid}`,{n:(p&&p.n)||'Delver'});
  await rq('DELETE',`social/${me}/in/${fid}`)};
 S.decline=fid=>rq('DELETE',`social/${uid()}/in/${fid}`);
 S.remove=async fid=>{const me=uid();await rq('DELETE',`social/${me}/friends/${fid}`);try{await rq('DELETE',`social/${me}/in/${fid}`)}catch(e){}};

 S.refresh=async srvNow=>{
  const me=uid();
  const mine=await rq('GET','social/'+me)||{};
  const fr=mine.friends||{},inn=mine.in||{};
  const ids=Object.keys(fr);
  const info=await Promise.all(ids.map(async fid=>{
   const [back,p]=await Promise.all([rq('GET',`social/${fid}/friends/${me}`).catch(()=>null),rq('GET','profiles/'+fid).catch(()=>null)]);
   return{uid:fid,name:(p&&p.n)||fr[fid].n||'Delver',mutual:!!back,seen:p&&p.t||0}}));
  const t=srvNow||Date.now()+(S.off||0);
  S.friends=info.filter(f=>f.mutual).map(f=>({...f,online:t-f.seen<ONLINE_MS})).sort((a,b)=>b.online-a.online||a.name.localeCompare(b.name));
  S.outgoing=info.filter(f=>!f.mutual);
  S.incoming=Object.keys(inn).filter(k=>!fr[k]).map(k=>({uid:k,name:cleanName(inn[k]&&inn[k].n)}));
  const inv=await rq('GET','invites/'+me)||{};
  const okIds=new Set(S.friends.map(f=>f.uid));
  S.invites=Object.keys(inv).filter(k=>okIds.has(k)&&inv[k]&&inv[k].d).map(k=>({from:k,name:cleanName(inv[k].n),t:inv[k].t||0}));
  return S};
 return S}

const api={create,ONLINE_MS,MAXF};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversSocial=api;
})(typeof self!=='undefined'?self:globalThis);
