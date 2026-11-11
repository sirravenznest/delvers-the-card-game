// Deterministic, client-side opponents for ranked queue fallback. Bot accounts are synthetic;
// their records are never written to the ratings collection or shown on the leaderboard.
(function(root){
const C=typeof require!=='undefined'?require('./cards.js'):root.DelversCards;
const P=typeof require!=='undefined'?require('./pvp.js'):root.DelversPvp;
const E=typeof require!=='undefined'?require('./engine.js'):root.DelversEngine;

const STEPS=[
 {tier:'Bronze',min:0,rating:1000,skill:0,upgrades:0},
 {tier:'Silver',min:1100,rating:1200,skill:1,upgrades:1},
 {tier:'Gold',min:1300,rating:1400,skill:2,upgrades:2},
 {tier:'Platinum',min:1500,rating:1600,skill:3,upgrades:3},
 {tier:'Diamond',min:1700,rating:1800,skill:4,upgrades:4},
 {tier:'Mythic',min:1900,rating:2000,skill:5,upgrades:6}
];
const THEMES={
 iron:{
  title:'Ironwall Vanguard',starter:'iron',
  upgrades:[
   ['Squire','Dwarf Fighter'],['Shield','Tower Shield'],['Town Guard','Paladin'],
   ['Long Sword','War Hammer'],['Ogre','Troll'],['Emberguard Knight','Sister Cera, Last Candle']
  ]
 },
 arcane:{
  title:'Emberlight Mages',starter:'arcane',
  upgrades:[
   ['Apprentice','Hollow Seal Scribe'],['Magic Missile','Arcane Insight'],['Evoker','Battle Mage'],
   ['Lightning Bolt','Fireball'],['Skeleton','Wraith'],['Pseudodragon','Lich']
  ]
 },
 shadow:{
  title:'Shadow Hunt',starter:'shadow',
  upgrades:[
   ['Cutpurse','Goblin Skulker'],['Woodsman','Beastmaster'],['Cat Burglar','Assassin'],
   ['Hunter','Beastmaster'],['Harpy','Griffon'],['Giant Rat','Nim, Gatemarket Guide']
  ]
 }
};
const NAMES=[
 'Mira Ashvale','Bramble Quickstep','Tovin Embermark','Sable Thorn','Rook Ironbriar','Veya Nightjar',
 'Orin Bellweather','Kestrel Vale','Nessa Copperleaf','Dain Hollowmere','Pip Lanternfox','Ilyra Stormglass',
 'Corven Mosscloak','Tamsin Redfern','Eryk Dawnforge','Luma Wrenfall','Joryn Flint','Maelis Duskwind'
];
const THEMES_LIST=Object.keys(THEMES);
const row=i=>Math.floor(i/C.COLS);
const copy=x=>JSON.parse(JSON.stringify({...x,log:[],history:[]}));
const hashSeed=n=>{let h=2166136261;for(const c of String(n))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
function rng(seed){let s=seed>>>0;return()=>((s=(s+0x6D2B79F5)>>>0,(s=Math.imul(s^s>>>15,s|1)),s^=s+Math.imul(s^s>>>7,s|61),((s^s>>>14)>>>0)/4294967296))}
function stepForRating(r){
 const rating=Number.isFinite(+r)?+r:1000;
 let out=STEPS[0];for(const s of STEPS)if(rating>=s.min)out=s;
 return out}
function deckFor(tier,theme){
 const level=typeof tier=='number'?Math.max(0,Math.min(STEPS.length-1,tier)):STEPS.findIndex(x=>x.tier.toLowerCase()==String(tier||'Bronze').toLowerCase());
 const t=STEPS[level<0?0:level],k=THEMES[theme]||THEMES.iron;
 const starter=C.STARTERS.find(x=>x.id==k.starter);
 const d=starter.list.slice();
 for(let i=0;i<t.upgrades;i++){
  const [from,to]=k.upgrades[i],at=d.indexOf(from);
  if(at<0)throw new Error(`Missing ${from} in ${k.title} deck.`);
  d[at]=to;
 }
 if(!P.validRanked(d))throw new Error(`Invalid ${t.tier} ${k.title} ranked deck.`);
 return d}
function forRating(r,seed){
 const t=stepForRating(r),rand=rng(seed>>>0),theme=THEMES_LIST[Math.floor(rand()*THEMES_LIST.length)];
 const name=NAMES[Math.floor(rand()*NAMES.length)],k=THEMES[theme];
 return{uid:'ranked-bot',label:'BOT',name:`BOT · ${name}`,tier:t.tier,r:t.rating,skill:t.skill,theme,title:k.title,
  avatar:'vanguard',deck:deckFor(t.tier,theme),synthetic:true}
}

function actions(G,s){
 const o=s=='p'?'e':'p',X=G[s],out=[];
 X.hand.forEach((c,h)=>{
  if(c.t=='c')P.HOME[s].forEach(pos=>out.push({a:'summon',h,pos}));
  else if(c.tg=='none')out.push({a:'cast',h});
  else{
   const sides=c.tg=='ally'? [s]:c.tg=='enemyC'? [o]:c.tg=='allyC'? [s]:[s,o];
   for(const side of sides){
    if(c.tg=='any'&&side==s)continue;
    if(c.tg=='ally'||c.tg=='any')out.push({a:'cast',h,t:{side,i:null}});
    G.b.forEach((u,i)=>{if(u&&u.o==side)out.push({a:'cast',h,t:{side,i}})});
   }
  }
 });
 G.b.forEach((u,i)=>{
  if(!u||u.o!=s)return;
  G.b.forEach((v,j)=>{if(v&&v.o==o)out.push({a:'attack',from:i,t:{side:o,i:j}})});
  out.push({a:'attack',from:i,t:{side:o,i:null}});
  for(let j=0;j<G.b.length;j++)if(!G.b[j])out.push({a:'move',from:i,to:j});
 });
 out.push({a:'end'});
 return out}

function score(G,s,a,skill){
 const o=s=='p'?'e':'p',X=G[s],en=G[o];
 if(a.a=='end')return -100;
 if(a.a=='summon'){
  const c=X.hand[a.h];return 3+c.cost*(.35+skill*.2)+c.atk*.8+c.hp*.45+(c.kw?1:0);
 }
 if(a.a=='cast'){
  const c=X.hand[a.h],t=a.t,unit=t&&t.i!=null?G.b[t.i]:null,hero=t&&t.i==null;
  let v=1;
  if(c.kind=='dmg')v=unit?Math.min(c.n,unit.hp)*1.5+(c.n>=unit.hp?3:0):hero?Math.min(c.n,en.hp)*.8:0;
  else if(['splash','blast','col','rowl','chain'].includes(c.kind))v=2.5+G.b.filter(u=>u&&u.o==o).length*1.15;
  else if(c.kind=='aoe')v=G.b.filter(u=>u&&u.o==o).length*(1.4+c.n*.25);
  else if(c.kind=='sleep')v=unit?3+unit.atk*.8:0;
  else if(c.kind=='heal')v=hero?Math.min(c.n,X.mx-X.hp)*.9:unit?Math.min(c.n,unit.mhp-unit.hp)*.8:0;
  else if(c.kind=='haste'){v=unit?E.refreshValue(G,s,unit):0;if(v<=0)return -100;v+=4}
  else if(c.kind=='bless')v=unit?2+c.n*.5:0;
  else if(c.kind=='gear')v=unit?2+(c.d.atk||0)+(c.d.hp||0)*.35+(c.d.kw?1:0):0;
  else if(c.kind=='draw'){v=E.drawValue(G,s,c);if(v<=0)return -100}
  else if(c.kind=='mheal')v=1+G.b.filter(u=>u&&u.o==s&&u.hp<u.mhp).length;
  else if(c.kind=='turn')v=G.b.filter(u=>u&&u.o==o&&u.cls=='U').length*2;
  else if(c.kind=='mana')v=1;
  return v-c.cost*(.12+skill*.05)+(skill*.18);
 }
 if(a.a=='attack'){
  const u=G.b[a.from],t=a.t.i==null?null:G.b[a.t.i];
  if(!t)return 2.4+u.atk*(.45+skill*.22)+(skill<2?2:0);
  const kill=u.atk>=t.hp?3.5:0;
  return 2+kill+t.atk*.35+u.atk*(.35+skill*.12);
 }
 if(a.a=='move'){
  const u=G.b[a.from],from=a.from,to=a.to;
  const enemyRow=s=='p'?0:C.ROWS-1;
  return .4+Math.max(0,Math.abs(row(from)-enemyRow)-Math.abs(row(to)-enemyRow))*(.3+skill*.22)+(u.rch>1?.25:0);
 }
 return -100}

function chooseAction(G,s,tier,random){
 const skill=typeof tier=='number'?tier:(typeof tier=='object'&&tier?Number(tier.skill)||0:stepForRating(tier).skill);
 const legal=[];
 for(const a of actions(G,s)){
  const trial=copy(G);
  if(P.act(trial,s,a).ok){const v=score(G,s,a,skill);if(a.a!=='end'&&v>-100)legal.push({a,v})}
 }
 if(!legal.length)return{a:'end'};
 legal.sort((a,b)=>b.v-a.v);
 const rand=typeof random=='function'?random:rng((G.rs>>>0)^G.n^(skill<<20));
 const breadth=Math.max(1,Math.ceil(4-skill*.55));
 const tied=legal.slice(0,Math.min(breadth,legal.length));
 return tied[Math.floor(rand()*tied.length)].a}
function playTurn(G,s,tier,random){
 const skill=typeof tier=='number'?tier:(typeof tier=='object'&&tier?Number(tier.skill)||0:stepForRating(tier).skill);
 const rand=typeof random=='function'?random:rng((G.rs>>>0)^G.n^(skill<<20));
 const log=[];
 for(let i=0;i<60&&!G.over&&G.turn==s;i++){
  const a=chooseAction(G,s,skill,rand),r=P.act(G,s,a);
  if(!r.ok){const end=P.act(G,s,{a:'end'});if(end.ok)log.push({a:'end'});break}
  log.push(a);
  if(a.a=='end')break;
 }
 if(!G.over&&G.turn==s&&log.length>=60&&P.act(G,s,{a:'end'}).ok)log.push({a:'end'});
 return log}

const api={STEPS,THEMES,NAMES,stepForRating,deckFor,forRating,chooseAction,playTurn};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversRankedBots=api;
})(typeof self!=='undefined'?self:globalThis);
