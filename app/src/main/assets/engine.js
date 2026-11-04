(function(root){
const C=typeof require!=='undefined'?require('./cards.js'):root.DelversCards;
const {COLS,ROWS,NT,imm,BN}=C;
let G=null;const use=g=>{G=g};
// Seeded RNG (mulberry32) when the state carries G.rs, so a server can replay matches exactly; otherwise Math.random.
function rnd(){if(G&&G.rs!=null){let t=G.rs=(G.rs+0x6D2B79F5)>>>0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}return Math.random()}
const d20=()=>1+Math.floor(rnd()*20),opp=s=>s=='p'?'e':'p';
const row=i=>Math.floor(i/COLS),dist=(a,b)=>Math.abs(row(a)-row(b))+Math.abs(a%COLS-b%COLS);
const has=(c,k)=>!!c&&(c.kw==k||(c.k2||'').split(' ').includes(k));
const mk=d=>d.t=='c'?{...d,mhp:d.hp,mv:0,ready:false,sleep:0}:{...d};
const units=s=>G.b.filter(u=>u&&u.o==s);
const log=m=>{G.log.unshift(m);G.log=G.log.slice(0,3)};
function draw(s){const X=G[s];if(!X.deck.length){X.hp-=2;log('Out of cards! 2 damage.');if(X.hp<=0)G.over=opp(s);return}const c=X.deck.pop();if(X.hand.length<7)X.hand.push(c)}
function startTurn(s){const X=G[s];X.max=Math.min(10,X.max+1);X.mp=X.max;draw(s);units(s).forEach(c=>{if(has(c,'regen'))c.hp=Math.min(c.mhp,c.hp+2);if(has(c,'heal'))X.hp=Math.min(X.mx,X.hp+1);c.fresh=0;c.u2=0;if(c.sleep>0){c.sleep--;c.mv=0;c.ready=false}else{c.mv=c.init;c.ready=true}})}
function dmg(s,c,n){if(c){if(n>1&&has(c,'tough')&&G.hit)n--;c.hp-=n;if(c.hp<=0){G.b[G.b.indexOf(c)]=null;log(c.name+' falls.')}}else{G[s].hp-=n;if(G[s].hp<=0)G.over=opp(s)}}
function heal(s,c,n){if(c)c.hp=Math.min(c.mhp,c.hp+n);else G[s].hp=Math.min(G[s].mx,G[s].hp+n)}
function saves(c){if(!c)return 0;const r=d20(),k=r>=c.save;if(k)log(`${c.name} saves (${r})!`);return k}
function roll(a,ac){const need=Math.min(20,Math.max(2,a.thac0-ac-(has(a,'keen')?1:0))),r=d20(),hit=r==20||(r>1&&r>=need);log(`${a.name} rolls ${r} (needs ${need}+): ${r==20?'CRIT!':hit?'hit':'miss'}`);return hit?(r==20?2:1):0}
// A creature may strike any foe within its reach. The foe only strikes back if the attacker is within the foe's own reach.
function attack(s,a,t){const o=opp(s),tc=t.c,d=tc?dist(G.b.indexOf(a),G.b.indexOf(tc)):0,m=roll(a,tc?tc.ac:10);
 if(m){G.hit=1;const bs=has(a,'back')&&tc&&tc.hp==tc.mhp,mult=m+(bs?1:0);if(bs)log('Backstab!');dmg(o,tc,a.atk*mult);G.hit=0;if(has(a,'lifelink'))heal(s,null,1);if(tc&&has(tc,'thorns')&&a.hp>0)dmg(s,a,1);
  if(tc&&tc.hp>0&&!imm(tc)){
   if(has(a,'poison')&&!saves(tc)){log(tc.name+' is poisoned!');dmg(o,tc,2)}
   else if(has(a,'para')&&!saves(tc)){log(tc.name+' is paralysed!');tc.sleep=1;tc.ready=false;tc.mv=0}}
  if(tc&&tc.hp>0&&has(a,'drain')&&tc.atk>0){tc.atk--;log(tc.name+' loses 1 attack.')}}
 if(has(a,'dbl')&&!a.u2){a.u2=1;a.ready=true}else a.ready=false;
 if(tc&&tc.hp>0&&a.hp>0&&!G.over){if(d<=tc.rch){const m2=roll(tc,a.ac);if(m2){G.hit=1;dmg(s,a,tc.atk*m2);G.hit=0}}else log(`${tc.name} cannot reach ${a.name}.`)}}
function ok(tg,s,t,c){const en=t.side!=s;if(tg=='allyC'&&c&&c.slot&&t.c&&t.c['s'+c.slot])return false;return tg=='any'?en:tg=='enemyC'?en&&!!t.c:tg=='ally'?!en:tg=='allyC'?!en&&!!t.c:false}
function mres(x,s){if(has(x,'mr')&&x.o!=s&&d20()>10){log(x.name+' shrugs off the spell!');return true}return false}
function cast(s,c,t){const o=opp(s);log((s=='p'?'You use ':'Foe uses ')+c.name+'.');
 if(c.kind=='dmg'){if(mres(t.c,s))return;let n=c.n;if(saves(t.c))n>>=1;dmg(t.side,t.c,n)}
 else if(c.kind=='heal')heal(t.side,t.c,c.n);
 else if(c.kind=='aoe')units(o).forEach(x=>{if(mres(x,s))return;let n=c.n;if(saves(x))n>>=1;dmg(o,x,n)});
 else if(c.kind=='draw'){for(let i=0;i<c.n;i++)draw(s)}
 else if(c.kind=='mana')G[s].mp=Math.min(10,G[s].mp+c.n)
 else if(c.kind=='mheal'){units(s).forEach(x=>heal(s,x,c.n));heal(s,null,c.n)}
 else if(c.kind=='turn')units(o).filter(x=>x.cls=='U').forEach(x=>dmg(o,x,c.n))
 else if(c.kind=='haste'){t.c.ready=true;t.c.mv=t.c.init;t.c.u2=0;t.c.sleep=0}
 else if(c.kind=='sleep'){if(imm(t.c))log(t.c.name+' is immune.');else if(!mres(t.c,s)&&!saves(t.c)){t.c.sleep=c.n||1;t.c.ready=false;t.c.mv=0}}
 else if(c.kind=='bless'){const b=c.n||1;t.c.atk+=b;t.c.hp+=b;t.c.mhp+=b}
 else if(c.kind=='gear'){const d=c.d,u=t.c;u.atk+=d.atk||0;u.thac0+=d.thac0||0;u.ac+=d.ac||0;u.init+=d.init||0;u.mv+=d.init||0;u.save+=d.save||0;u.hp+=d.hp||0;u.mhp+=d.hp||0;u.rch+=d.rch||0;if(d.kw&&!has(u,d.kw)){u.k2=((u.k2||'')+' '+d.kw).trim();if(d.kw=='haste'&&u.fresh){u.ready=true;u.mv=u.init}}if(c.slot)u['s'+c.slot]=1}}
function play(s,c,t,pos){const X=G[s];X.hand=X.hand.filter(x=>x!==c);X.mp-=c.cost;if(c.t=='c'){c.o=s;c.fresh=1;c.mv=has(c,'haste')?c.init:0;c.ready=has(c,'haste');G.b[pos]=c;log((s=='p'?'You summon ':'Foe summons ')+c.name+'.')}else cast(s,c,t)}
const api={has,use,rnd,d20,opp,row,dist,mk,units,log,draw,startTurn,dmg,heal,saves,roll,attack,ok,mres,cast,play};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversEngine=api;
})(typeof self!=='undefined'?self:globalThis);
