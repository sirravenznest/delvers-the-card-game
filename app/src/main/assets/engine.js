(function(root){
const C=typeof require!=='undefined'?require('./cards.js'):root.DelversCards;
const {COLS,ROWS,NT,imm,BN}=C;
let G=null;const use=g=>{G=g};
// Seeded RNG (mulberry32) when the state carries G.rs, so a server can replay matches exactly; otherwise Math.random.
function rnd(){if(G&&G.rs!=null){let t=G.rs=(G.rs+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}return Math.random()}
const d20=()=>1+Math.floor(rnd()*20),opp=s=>s=='p'?'e':'p';
const row=i=>Math.floor(i/COLS),dist=(a,b)=>Math.abs(row(a)-row(b))+Math.abs(a%COLS-b%COLS);
const ev=e=>{if(G&&G.fx)(G.ev||(G.ev=[])).push(e)},ix=c=>c?G.b.indexOf(c):-1;
const has=(c,k)=>!!c&&(c.kw==k||(c.k2||'').split(' ').includes(k));
const mk=d=>d.t=='c'?{...d,mhp:d.hp,mv:0,ready:false,sleep:0}:{...d};
const units=s=>G.b.filter(u=>u&&u.o==s);
const LOG_LIMIT=2000;
const log=(m,kind='info',side)=>{G.log.unshift(m);G.log=G.log.slice(0,3);const history=G.history||(G.history=[]);history.push({id:G.historySeq=(G.historySeq||0)+1,text:m,kind,side:side||G.activeTurn||G.turn||'p',turnSide:G.activeTurn||G.turn||'p',turn:G.turnNo||1});if(history.length>LOG_LIMIT){history.shift();G.historyDropped=(G.historyDropped||0)+1}};
function draw(s){const X=G[s];if(!X.deck.length){X.hp-=2;log('Hero takes 2 fatigue damage (empty deck).','damage',s);if(X.hp<=0)G.over=opp(s);return}const c=X.deck.pop();if(X.hand.length<7)X.hand.push(c)}
function startTurn(s){const X=G[s];G.turnNo=(G.turnNo||0)+1;G.activeTurn=s;X.max=Math.min(X.cap||10,X.max+1);X.mp=X.max;log(`Turn ${G.turnNo}: ${X.mp}/${X.max} mana, hero ${X.hp}/${X.mx} HP.`,'turn',s);draw(s);units(s).forEach(c=>{if(has(c,'regen')){const n=Math.min(2,c.mhp-c.hp);c.hp+=n;if(n)log(`${c.name} regenerates ${n} HP (${c.hp}/${c.mhp}).`,'heal',s)}if(has(c,'heal')){const n=Math.min(1,X.mx-X.hp);X.hp+=n;if(n)log(`${c.name} heals the hero for ${n} (${X.hp}/${X.mx} HP).`,'heal',s)}c.fresh=0;c.u2=0;if(c.sleep>0){c.sleep--;c.mv=0;c.ready=false;log(`${c.name} cannot act this turn (${c.sleep} turns of sleep remaining).`,'status',s)}else{c.mv=c.init;c.ready=true}})}
function dmg(s,c,n,cr){if(c){if(n>1&&has(c,'tough')&&G.hit)n--;ev({k:'dmg',i:ix(c),s,n,cr});c.hp-=n;log(`${c.name} takes ${n} damage (${Math.max(0,c.hp)}/${c.mhp} HP).`,'damage',s);if(c.hp<=0){ev({k:'die',i:ix(c),s});G.b[G.b.indexOf(c)]=null;log(c.name+' falls.','status',s)}}else{ev({k:'dmg',i:-1,s,n,cr});G[s].hp-=n;log(`Hero takes ${n} damage (${Math.max(0,G[s].hp)}/${G[s].mx} HP).`,'damage',s);if(G[s].hp<=0)G.over=opp(s)}}
function heal(s,c,n){ev({k:'heal',i:ix(c),s,n});const before=c?c.hp:G[s].hp;if(c)c.hp=Math.min(c.mhp,c.hp+n);else G[s].hp=Math.min(G[s].mx,G[s].hp+n);const after=c?c.hp:G[s].hp;log(`${c?c.name:'Hero'} heals ${after-before} HP (${after}/${c?c.mhp:G[s].mx}).`,'heal',s)}
function saves(c){if(!c)return 0;const r=d20(),k=r>=c.save;log(`${c.name} Save: rolls ${r} (needs ${c.save}+): ${k?'resisted':'failed'}.`,'roll',c.o);return k}
function roll(a,ac){const need=Math.min(20,Math.max(2,a.thac0-ac-(has(a,'keen')?1:0))),r=d20(),hit=r==20||(r>1&&r>=need);log(`${a.name} rolls ${r} (needs ${need}+): ${r==20?'CRIT!':hit?'hit':'miss'}`,'roll',a.o);return hit?(r==20?2:1):0}
function move(s,from,to){const u=G.b[from];G.b[to]=u;G.b[from]=null;u.mv-=dist(from,to);ev({k:'mov',i:to,s});log(`${u.name} moves R${row(from)+1} C${from%COLS+1} to R${row(to)+1} C${to%COLS+1} (${u.mv}/${u.init} movement left).`,'move',s)}
// A creature may strike any foe within its reach. The foe only strikes back if the attacker is within the foe's own reach.
function attack(s,a,t){const o=opp(s),tc=t.c,d=tc?dist(G.b.indexOf(a),G.b.indexOf(tc)):0;log(`${a.name} attacks ${tc?tc.name:'the opposing hero'}.`,'attack',s);ev({k:'atk',f:ix(a),i:ix(tc),s:o});const m=roll(a,tc?tc.ac:10);
 if(!m)ev({k:'miss',i:ix(tc),s:o});
 if(m){G.hit=1;const bs=has(a,'back')&&tc&&tc.hp==tc.mhp,mult=m+(bs?1:0);if(bs)log('Backstab!','attack',s);dmg(o,tc,a.atk*mult,m==2);G.hit=0;if(has(a,'lifelink'))heal(s,null,1);if(tc&&has(tc,'thorns')&&a.hp>0){log(tc.name+' reflects 1 Thorns damage.','status',o);dmg(s,a,1)}
  if(tc&&tc.hp>0&&!imm(tc)){
   if(has(a,'poison')&&!saves(tc)){log(tc.name+' is poisoned!','status',o);dmg(o,tc,2)}
   else if(has(a,'para')&&!saves(tc)){log(tc.name+' is paralysed!','status',o);tc.sleep=1;tc.ready=false;tc.mv=0}}
  if(tc&&tc.hp>0&&has(a,'drain')&&tc.atk>0){tc.atk--;log(tc.name+' loses 1 attack.','status',o)}}
 if(has(a,'dbl')&&!a.u2){a.u2=1;a.ready=true}else a.ready=false;
 if(tc&&tc.hp>0&&a.hp>0&&!G.over){if(d<=tc.rch){log(`${tc.name} counters ${a.name}.`,'attack',o);const m2=roll(tc,a.ac);if(m2){G.hit=1;dmg(s,a,tc.atk*m2);G.hit=0}}else log(`${tc.name} cannot reach ${a.name}.`,'status',o)}}
function ok(tg,s,t,c){const en=t.side!=s;if(tg=='allyC'&&c&&c.slot&&t.c&&t.c['s'+c.slot])return false;return tg=='any'?en:tg=='enemyC'?en&&!!t.c:tg=='ally'?!en:tg=='allyC'?!en&&!!t.c:false}
function mres(x,s){if(has(x,'mr')&&x.o!=s){const r=d20();log(`${x.name} magic resistance: rolls ${r} (needs 11+): ${r>10?'spell blocked':'spell passes'}.`,'roll',x.o);return r>10}return false}
const AREA={splash:1,blast:1,col:1,rowl:1,chain:1},col=i=>i%COLS;
// Who a spell hits when aimed at creature tc: [creature, damage] pairs. Used by the rules, the AI and the UI hint.
function hits(s,c,tc){const o=opp(s),E=units(o),i=ix(tc),k=c.kind,n2=c.n2==null?c.n:c.n2,rest=E.filter(x=>x!==tc);let r=[[tc,c.n]];
 if(k=='splash')rest.forEach(x=>dist(ix(x),i)==1&&r.push([x,n2]));
 else if(k=='blast')rest.forEach(x=>{const j=ix(x);Math.abs(row(j)-row(i))<=1&&Math.abs(col(j)-col(i))<=1&&r.push([x,n2])});
 else if(k=='col')rest.forEach(x=>col(ix(x))==col(i)&&r.push([x,c.n]));
 else if(k=='rowl')rest.forEach(x=>row(ix(x))==row(i)&&r.push([x,c.n]));
 else if(k=='chain'){let cur=tc,n=c.n;const seen=[tc];for(let h=0;h<2;h++){n-=c.d||2;if(n<1)break;const nx=rest.filter(x=>!seen.includes(x)&&dist(ix(x),ix(cur))<=2).sort((a,b)=>dist(ix(a),ix(cur))-dist(ix(b),ix(cur))||ix(a)-ix(b))[0];if(!nx)break;seen.push(nx);r.push([nx,n]);cur=nx}}
 return r}
function cast(s,c,t){const o=opp(s);ev({k:'spell',kind:c.kind,i:t&&t.c?ix(t.c):-1,s:t?t.side:o,all:c.kind=='aoe'||c.kind=='turn'||c.kind=='mheal'});log((s=='p'?'You use ':'Foe uses ')+c.name+(t?' on '+(t.side==s?'allied ':'opposing ')+(t.c?t.c.name:'hero'):'')+'.','spell',s);
 if(c.kind=='dmg'){if(mres(t.c,s))return;let n=c.n;if(saves(t.c))n>>=1;dmg(t.side,t.c,n)}
 else if(AREA[c.kind]){if(!t.c){dmg(t.side,null,c.n);return}hits(s,c,t.c).forEach(([x,n])=>{if(x.hp<=0||mres(x,s))return;if(saves(x))n>>=1;dmg(o,x,n)})}
 else if(c.kind=='heal')heal(t.side,t.c,c.n);
 else if(c.kind=='aoe')units(o).forEach(x=>{if(mres(x,s))return;let n=c.n;if(saves(x))n>>=1;dmg(o,x,n)});
 else if(c.kind=='draw'){for(let i=0;i<c.n;i++)draw(s)}
 else if(c.kind=='mana')G[s].mp=Math.min(10,G[s].mp+c.n)
 else if(c.kind=='mheal'){units(s).forEach(x=>heal(s,x,c.n));heal(s,null,c.n)}
 else if(c.kind=='turn')units(o).filter(x=>x.cls=='U').forEach(x=>dmg(o,x,c.n))
 else if(c.kind=='haste'){t.c.ready=true;t.c.mv=t.c.init;t.c.u2=0;t.c.sleep=0}
 else if(c.kind=='sleep'){if(imm(t.c))log(t.c.name+' is immune.','status',t.side);else if(!mres(t.c,s)&&!saves(t.c)){t.c.sleep=c.n||1;t.c.ready=false;t.c.mv=0;log(`${t.c.name} sleeps for ${t.c.sleep} turns.`,'status',t.side)}}
 else if(c.kind=='bless'){const b=c.n||1;t.c.atk+=b;t.c.hp+=b;t.c.mhp+=b}
 else if(c.kind=='gear'){const d=c.d,u=t.c;u.atk+=d.atk||0;u.thac0+=d.thac0||0;u.ac+=d.ac||0;u.init+=d.init||0;u.mv+=d.init||0;u.save+=d.save||0;u.hp+=d.hp||0;u.mhp+=d.hp||0;u.rch+=d.rch||0;if(d.kw&&!has(u,d.kw)){u.k2=((u.k2||'')+' '+d.kw).trim();if(d.kw=='haste'&&u.fresh){u.ready=true;u.mv=u.init}}if(c.slot)u['s'+c.slot]=1}}
function play(s,c,t,pos){const X=G[s];X.hand=X.hand.filter(x=>x!==c);X.mp-=c.cost;if(c.t=='c'){c.o=s;c.fresh=1;c.mv=has(c,'haste')?c.init:0;c.ready=has(c,'haste');G.b[pos]=c;ev({k:'sum',i:pos,s});log((s=='p'?'You summon ':'Foe summons ')+c.name+'.','summon',s)}else cast(s,c,t)}
const api={LOG_LIMIT,AREA,hits,has,use,rnd,d20,opp,row,dist,mk,units,log,draw,startTurn,dmg,heal,saves,roll,attack,move,ok,mres,cast,play};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversEngine=api;
})(typeof self!=='undefined'?self:globalThis);
