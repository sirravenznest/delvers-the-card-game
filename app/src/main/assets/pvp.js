// Deterministic two-player match logic. Seat 'p' sits on the bottom row; opposed d20s decide the first turn.
// Every client replays the same seed and action log, so a state hash can be compared to detect cheating or desync.
(function(root){
const C=typeof require!=='undefined'?require('./cards.js'):root.DelversCards;
const E=typeof require!=='undefined'?require('./engine.js'):root.DelversEngine;
const F=typeof require!=='undefined'?require('./card-cosmetics.js'):root.DelversCardCosmetics;
const {ROWS,NT,BACK,FOEB,BN}=C;
const {use,rnd,opp,row,dist,mk,units,draw,startTurn,attack,ok,play}=E;
const HOME={p:BACK,e:FOEB};
const MAXHAND=7;
const P_OPT={extraCard:true,coin:0,manualRoll:false};

function newMatch(seed,deckP,deckE,opt){
 opt=Object.assign({},P_OPT,opt||{});
 const mkp=()=>({hp:20,mx:20,mp:0,max:0,deck:[],hand:[]});
 const G={rs:seed>>>0,b:Array(NT).fill(null),p:mkp(),e:mkp(),turn:'p',over:null,log:[],n:0,pv:1};
 use(G);
 const build=(s,names)=>{const looks=opt[s==='p'?'looksP':'looksE'];const d=names.map((n,i)=>mk({...BN[n],look:F.cleanLook(looks?.[i])}));for(let i=d.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[d[i],d[j]]=[d[j],d[i]]}G[s].deck=d};
 build('p',deckP);build('e',deckE);
 G.opening=E.rollFirst();G.turn=G.opening.winner;
 if(!opt.manualRoll)G.opening.rolled={p:true,e:true};
 for(let i=0;i<3;i++){draw('p');draw('e')}
 G.second=opp(G.turn);
 if(opt.extraCard)draw(G.second);
 G.coin=opt.coin|0;
 startTurn(G.turn);
 return G}

function validDeck(names){
 if(!Array.isArray(names)||names.length<20||names.length>30)return false;
 const n={};for(const x of names){if(!BN[x])return false;n[x]=(n[x]||0)+1;if(n[x]>3)return false}
 return true}

const validRanked=validDeck;

// Returns {ok:true} after applying, or {ok:false,err} leaving the state untouched.
function act(G,s,a){
 use(G);
 const no=err=>({ok:false,err});
 if(G.over)return no('Match is over.');
 if(!a||typeof a!='object')return no('Bad action.');
 if(s!='p'&&s!='e')return no('Bad seat.');
 if(a.a=='resign'){E.log('Resigned.','result',s);G.over=opp(s);G.n++;return{ok:true}}
 if(a.a=='roll'){
  if(G.opening.rolled[s])return no('You have already rolled.');
  G.opening.rolled[s]=true;return{ok:true};
 }
 if(!G.opening.rolled.p||!G.opening.rolled.e)return no('Both players must roll their d20 first.');
 if(G.turn!=s)return no('Not your turn.');
 const X=G[s],o=opp(s),isIdx=i=>Number.isInteger(i)&&i>=0&&i<NT;
 const target=t=>{ // {side,i} i=null means hero
  if(!t||(t.side!='p'&&t.side!='e'))return null;
  if(t.i==null)return{side:t.side,c:null};
  if(!isIdx(t.i))return null;const u=G.b[t.i];if(!u||u.o!=t.side)return null;return{side:t.side,c:u}};
 if(a.a=='end'){G.turn=o;startTurn(o);if(G.coin&&o==G.second){G[o].mp+=G.coin;G.coin=0}G.n++;return{ok:true}}
 if(a.a=='summon'||a.a=='cast'){
  const c=X.hand[a.h];if(!Number.isInteger(a.h)||!c)return no('No such card.');
  if(c.cost>X.mp)return no('Not enough mana.');
  if(a.a=='summon'){
   if(c.t!='c')return no('Not a creature.');
   if(!HOME[s].includes(a.pos)||G.b[a.pos])return no('Bad tile.');
   play(s,c,null,a.pos);G.n++;return{ok:true}}
  if(c.t=='c')return no('Cast needs a spell or gear.');
  let t=null;
  if(c.tg=='none')t=null;
  else{t=target(a.t);if(!t||!ok(c.tg,s,t,c))return no('Bad target.')}
  if(c.kind=='haste'&&!(t&&t.c))return no('Bad target.');
  play(s,c,t);G.n++;return{ok:true}}
 if(a.a=='move'){
  if(!isIdx(a.from)||!isIdx(a.to))return no('Bad tile.');
  const u=G.b[a.from];if(!u||u.o!=s)return no('Not your creature.');
  if(G.b[a.to])return no('Tile occupied.');
  if(dist(a.from,a.to)>u.mv)return no('Too far.');
  E.move(s,a.from,a.to);G.n++;return{ok:true}}
 if(a.a=='attack'){
  if(!isIdx(a.from))return no('Bad tile.');
  const u=G.b[a.from];if(!u||u.o!=s)return no('Not your creature.');
  if(!u.ready)return no('Already attacked.');
  const t=target(a.t);if(!t||t.side!=o)return no('Bad target.');
  if(t.c){if(dist(a.from,G.b.indexOf(t.c))>u.rch)return no('Out of reach.')}
  else{const reach=s=='p'?row(a.from)<u.rch:ROWS-1-row(a.from)<u.rch;if(!reach)return no('Out of reach.')}
  attack(s,u,t);G.n++;return{ok:true}}
 return no('Unknown action.')}

function hash(G){
 const j=JSON.stringify([G.turn,G.over,G.rs,G.opening,G.b.map(u=>u&&[u.name,u.o,u.hp,u.atk,u.mv,u.ready?1:0,u.sleep]),['p','e'].map(s=>[G[s].hp,G[s].mp,G[s].max,G[s].deck.length,G[s].hand.map(c=>c.name)])]);
 let h=5381;for(let i=0;i<j.length;i++)h=((h<<5)+h+j.charCodeAt(i))>>>0;return h}

// Manual matches also retain {manualRoll:true,rolls:{p:boolean,e:boolean}} separately from numbered actions.
// Rebuilds a match from its record: {seed,deckP,deckE,log:[[seat,action],...]}.
function replay(m){
 const G=newMatch(m.seed,m.deckP,m.deckE,{looksP:m.looksP,looksE:m.looksE,manualRoll:!!m.manualRoll});
 if(m.rolls)for(const s of ['p','e'])if(m.rolls[s])act(G,s,{a:'roll'});
 for(let i=0;i<m.log.length;i++){const r=act(G,m.log[i][0],m.log[i][1]);if(!r.ok)return{ok:false,at:i,err:r.err}}
 return{ok:true,G}}

// Standard Elo with K=32; returns [newA,newB] for a result of 1 (A wins), 0 (B wins).
function elo(a,b,res,k){k=k||32;const ea=1/(1+Math.pow(10,(b-a)/400));return[Math.round(a+k*(res-ea)),Math.round(b+k*((1-res)-(1-ea)))]}

const api={P_OPT,newMatch,validDeck,validRanked,act,hash,replay,elo,HOME,MAXHAND};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversPvp=api;
})(typeof self!=='undefined'?self:globalThis);
