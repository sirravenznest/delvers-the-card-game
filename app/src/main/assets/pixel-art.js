(function(root){
'use strict';
const palette={ink:'#111625',dark:'#242b40',stone:'#596178',light:'#d7dfdc',skin:'#e3ae79',gold:'#f3ca69',red:'#b84d51',green:'#529c74',blue:'#659bcd',white:'#f1eedb'};
const hash=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const figures={
 'Squire':['cap','sword','shield'],'Town Guard':['helm','spear','shield'],
 'Tusk Raider':['horns','axe','tusks'],'Pikeman':['helm','pike','mail'],
 'Dwarf Fighter':['helm','hammer','beard'],'Paladin':['crest','sword','sun'],
 'Bladedancer':['hair','twins','sash'],'Emberguard Knight':['crest','sword','flame'],
 'Apprentice':['cap','wand','book'],'Illusionist':['hood','orb','mirrors'],
 'Evoker':['point','staff','flame'],'Archmage':['point','orb','stars'],
 'Battle Mage':['helm','staff','mail'],'Acolyte':['hood','candle','robe'],
 'Priest':['cap','staff','sun'],'War Cleric':['helm','hammer','sun'],
 'High Priestess':['crown','staff','robe'],'Cutpurse':['cap','knife','purse'],
 'Goblin Skulker':['hood','knife','goblin'],'Cat Burglar':['hood','rope','mask'],
 'Assassin':['hood','twins','mask'],'Woodsman':['cap','axe','beard'],
 'Hunter':['hood','bow','quiver'],'Elven Ranger':['hair','bow','ears'],
 'Beastmaster':['hair','staff','paw'],'Druid':['antlers','staff','leaves'],
 'Sister Cera, Last Candle':['veil','candle','sun'],'Nim, Gatemarket Guide':['cap','lantern','map'],
 'Ashen Road Escort':['helm','spear','sash'],'Hollow Seal Scribe':['hood','book','runes'],
 'Gloamwood Lookout':['hood','bow','leaves'],'Rustfang Runner':['hair','knife','goblin'],
 'Ashen Standard-Bearer':['helm','banner','mail'],'Lanternbound Adept':['point','lantern','runes'],
 'Emberheart Confessor':['veil','staff','flame'],'Vaultstep Infiltrator':['hood','key','mask'],
 'Embertrail Archer':['cap','bow','flame']
};
function sprite(c,transparent=false){
 const h=hash(c.name),p=palette,col=(root.DelversCards.CL[c.cls]||['',p.blue])[1];
 const accent=[p.gold,p.blue,p.green,p.red,p.light][h%5],shade=['#73533e','#ad7754','#e3ae79','#c99570'][h%4];
 let a='';
 const r=(x,y,w,ht,k)=>{a+=rect(x,y,w,ht,k)};
 const path=(d,fill)=>{a+=`<path d="${d}" fill="${fill}"/>`};
 const cross=(x,y,k)=>{r(x+3,y,3,11,k);r(x,y+3,9,3,k)};
 const bolt=(x,y,k)=>path(`M${x+6} ${y}h7l-6 10h6l-15 17 5-13h-6Z`,k);
 if(!transparent){
  r(0,0,64,40,p.ink);r(0,28,64,12,p.dark);
  for(let i=0;i<9;i++)r((h+i*17)%64,(h+i*11)%24,1,1,p.light);
  r(18,36,29,2,p.stone);
 }
 function tool(kind,x=43){
  if(kind==='bow'){path(`M${x} 8l8 6v14l-8 7 4-10V18Z`,p.gold);r(x,10,1,23,p.light);r(x-5,21,16,1,p.light)}
  else if(['staff','spear','pike','banner','lantern','candle'].includes(kind)){
   r(x,kind==='pike'?4:9,2,27,p.gold);
   if(kind==='spear'||kind==='pike')path(`M${x+1} 2l4 8h-8Z`,p.light);
   if(kind==='staff'){r(x-2,7,6,6,accent);r(x,8,2,2,p.white)}
   if(kind==='banner'){r(x+2,6,9,14,col);path(`M${x+2} 20h9l-4 5-5-3Z`,accent)}
   if(kind==='lantern'){r(x-4,12,10,12,p.gold);r(x-2,14,6,8,'#ffb74c');r(x,16,2,5,p.white)}
   if(kind==='candle'){r(x-2,18,6,12,p.white);r(x,12,2,5,p.gold);r(x-4,30,10,2,p.gold)}
  }else if(kind==='book'){r(x-5,19,12,13,accent);r(x-3,20,8,10,p.light);r(x+1,20,1,10,p.gold)}
  else if(kind==='orb'){r(x-4,15,11,10,accent);r(x-2,13,7,14,accent);r(x,16,3,3,p.white)}
  else if(kind==='axe'||kind==='hammer'){r(x,12,2,23,p.gold);r(x-5,10,12,kind==='hammer'?7:10,p.stone);r(x-5,10,3,8,p.light)}
  else if(kind==='key'){r(x-3,18,8,7,p.gold);r(x,23,2,11,p.gold);r(x+2,30,4,2,p.gold)}
  else if(kind==='rope'){path(`M${x-4} 17h10v15h-10Zm2 2v11h6V19Z`,p.gold)}
  else if(kind==='wand'){path(`M${x-3} 33l8-20 2 1-8 20Z`,'#98603a');cross(x+1,7,p.gold)}
  else{
   const short=kind==='knife',y=short?22:10;
   r(x,y,3,short?8:18,p.light);r(x-3,y+(short?8:18),9,2,accent);r(x+1,y+(short?10:20),2,5,p.gold);
   if(kind==='twins'){r(16,16,3,15,p.light);r(14,29,7,2,accent)}
  }
 }
 function person(){
  const [hat,weapon,detail]=figures[c.name]||[c.cls==='W'?'point':'hood',c.cls==='R'?'bow':'staff','robe'];
  const dwarf=/Dwarf/.test(c.name),goblin=detail==='goblin',x=dwarf?24:26,w=dwarf?17:13,skin=goblin?p.green:shade;
  r(x+1,10,w-2,10,skin);r(x+3,14,2,2,p.ink);r(x+w-5,14,2,2,p.ink);
  if(c.cls==='W')path(`M${x} 20h${w}l5 15H${x-5}Z`,col);
  else if(c.cls==='C')path(`M${x} 20h${w}l3 15H${x-3}Z`,col);
  else if(c.cls==='T')path(`M${x} 20h${w}l2 9-5 4-3-4-4 4-5-4Z`,col);
  else if(c.cls==='R'){path(`M${x+2} 19h${w-4}l6 14H${x-5}Z`,'#325b43');path(`M${x} 21h${w}v10H${x}Z`,col)}
  else path(`M${x} 20h${w}l4 4-2 8H${x-2}l-2-8Z`,col);
  r(x-3,22,4,8,skin);r(x+w,22,4,8,skin);
  if(c.cls==='F'){path(`M${x-3} 21l5-3 3 5-4 4h-4Zm${w+6} 0-5-3-3 5 4 4h4Z`,p.stone);r(x+2,23,w-4,5,p.stone)}
  if(c.cls==='W'){r(x+2,22,2,10,accent);r(x+w-4,22,2,10,accent)}
  if(c.cls==='C')cross(x+2,23,p.gold);
  if(c.cls==='T'){path(`M${x} 20l${w} 9v3L${x} 23Z`,p.dark);r(x+2,28,4,4,p.gold)}
  if(c.cls!=='W'&&c.cls!=='C'){r(x,32,5,4,p.stone);r(x+w-5,32,5,4,p.stone)}
  r(x,29,w,2,accent);
  if(hat==='helm'||hat==='crest'){r(x-1,7,w+2,5,p.stone);r(x-2,11,3,7,p.stone);if(hat==='crest')r(x+5,3,3,6,p.red)}
  else if(hat==='point'){path(`M${x-3} 10l10-9 7 9Z`,col);r(x-3,10,w+6,2,accent)}
  else if(hat==='crown'){r(x,6,w,4,p.gold);for(let i=0;i<3;i++)r(x+i*5,3,2,4,p.gold)}
  else if(hat==='antlers'){path(`M${x+2} 11l-7-8h3l5 4 2-5h2v9Zm8 0 7-8h-3l-5 4-2-5h-2v9Z`,p.gold)}
  else if(hat==='horns'){r(x,6,w,5,p.stone);r(x-3,4,4,7,p.light);r(x+w-1,4,4,7,p.light)}
  else{r(x-1,7,w+2,4,hat==='hair'?accent:col);if(hat==='hood'||hat==='veil'){r(x-2,10,3,12,col);r(x+w-1,10,3,12,col)}}
  if(detail==='beard')path(`M${x+1} 17h${w-2}l-3 9h-5Z`,p.light);
  if(detail==='mask')r(x,16,w,4,p.dark);
  if(detail==='ears'||goblin){path(`M${x} 12l-5-3 2 7h3Zm${w} 0 5-3-2 7h-3Z`,skin)}
  if(detail==='shield'){r(16,21,8,12,p.stone);r(18,23,4,7,accent)}
  if(detail==='sun')cross(x+3,21,p.gold);
  if(detail==='flame')path(`M${x+3} 29l-1-5 3 2 2-6 4 9Z`,'#ffb74c');
  if(detail==='sash')path(`M${x} 21h3l${w-3} 9h-3Z`,accent);
  if(detail==='mail')for(let j=0;j<3;j++)for(let i=0;i<3;i++)r(x+2+i*4,22+j*3,2,1,p.light);
  if(['runes','stars','mirrors'].includes(detail))for(let i=0;i<3;i++){r(16,8+i*7,3,3,accent);r(x+3+i*3,23,1,4,p.light)}
  if(detail==='map'){r(16,21,9,9,p.light);r(18,23,5,1,p.red);r(20,24,1,4,p.red)}
  if(detail==='book'){r(15,21,9,10,p.gold);r(17,22,6,8,p.light);r(20,22,1,8,p.blue)}
  if(detail==='purse'){r(16,25,8,8,p.gold);r(18,23,4,2,p.gold)}
  if(detail==='quiver'){r(18,18,5,14,p.gold);r(18,12,1,9,p.light);r(21,11,1,9,p.light)}
  if(detail==='leaves'||detail==='paw'){r(16,22,6,6,p.green);r(14,19,3,3,p.green);r(20,18,3,3,p.green)}
  if(detail==='tusks'){r(x+2,17,2,4,p.light);r(x+w-4,17,2,4,p.light)}
  tool(weapon);
 }
 function monster(){
  const n=c.name;
  if(/Spider/.test(n)){
   r(25,16,15,15,'#744a85');r(28,10,9,8,p.dark);
   for(let i=0;i<4;i++){path(`M26 ${17+i*3}l-10 ${i*3-6}h-4v3h3l11 6Zm13 0 10 ${i*3-6}h4v3h-3l-11 6Z`,p.stone)}
   r(29,12,2,2,p.red);r(34,12,2,2,p.red);
  }else if(/Cube/.test(n)){
   r(19,8,28,27,'#459b9b');r(21,10,24,23,'#75c6b0');r(24,14,2,17,p.white);r(29,20,9,2,p.light);r(33,16,2,10,p.light);r(39,12,3,3,p.white);
  }else if(/Treant|Briar/.test(n)){
   const k=n.includes('Briar')?'#45935a':'#806344';
   path('M25 35V20l-10-8 3-3 10 5 1-10h8l2 11 10-8 3 4-12 12 3 12h-8l-3-10-1 10Z',k);
   for(let i=0;i<5;i++)r(18+i*6,7+(i%2)*4,8,5,p.green);
   r(29,17,2,2,p.gold);r(35,17,2,2,p.gold);
  }else if(/Elemental/.test(n)){
   if(n.startsWith('Fire')){path('M20 33l-4-10 8 3-2-12 7 5 5-16 5 17 7-7-1 12 6-2-6 10Z',p.red);path('M26 33l2-13 5 6 3-10 5 17Z',p.gold)}
   if(n.startsWith('Air')){for(let i=0;i<5;i++){r(16+i*3,9+i*5,31-i*5,2,p.light);r(42-i*2,11+i*5,3,3,p.blue)}}
   if(n.startsWith('Earth')){path('M21 34l-4-12 5-5-2-8 12-5 13 7-2 11 5 12Z',p.stone);r(24,13,8,5,'#8e8067');r(33,22,7,8,'#ad9870')}
   r(28,19,2,2,p.white);r(35,19,2,2,p.white);
  }else if(n==='Harpy'){
   path('M25 21 12 7v15l13 8Zm14 0L52 7v15l-13 8Z','#9b6789');
   r(27,8,11,11,shade);r(26,6,13,5,'#734957');r(29,12,2,2,p.ink);r(34,12,2,2,p.ink);
   path('M27 21h11l3 10H24Z','#9b6789');r(26,30,3,5,p.gold);r(35,30,3,5,p.gold);r(23,35,7,1,p.gold);r(35,35,7,1,p.gold);
  }else if(c.ct==='Beast'||c.ct==='Dragon'){
   if(n==='Giant Rat'){
    path('M17 25l4-7 11-2 10 5 3 7-5 5H25l-5-3-7 1-3-3Z','#9b7e72');
    path('M41 25l9-1 5 4-2 5-3-1 2-3-4-2-7 1Z',p.red);
    path('M17 23l-2-8 7 3 3 5Z',p.red);r(16,24,2,2,p.white);r(13,28,5,1,p.light);
    r(25,31,4,3,p.stone);r(37,31,4,3,p.stone);
   }else if(n==='Dire Wolf'){
    path('M12 24l5-5 2-10 6 6 4-5 5 7 11 2 4 7-3 7h-5l-2-6-4 1-3 6h-5l1-8-7-1-5 2Z','#72889b');
    path('M18 19l9 1-4 5-10 2 2-4Z','#b4c3c4');r(20,19,2,2,p.gold);path('M45 21l8-6-2 9-5 3Z','#72889b');
   }else if(n==='Owlbear'){
    path('M19 34l-2-12 4-9 5-4 12 2 7 9 2 14h-8l-1-7h-9l-2 7Z','#926a49');
    path('M22 14l2-7 5 4 5-1 5-4 2 9-2 9-7 4-8-4Z','#e0d1a5');
    r(25,16,3,3,p.ink);r(34,16,3,3,p.ink);path('M29 20h5l-2 5Z',p.gold);
    path('M18 23l-5 6 3 4 5-3Zm27 0 5 6-3 4-5-3Z',p.light);
   }else if(n==='Griffon'){
    path('M26 23l-9-18 10 5 7 11 11 2 4 7-5 4h-5l-1-6-8 1-2 5h-5Z','#b9984e');
    path('M26 22 21 9l8 6 7 10Z','#e4d8b6');
    path('M23 20l-7-7-5 1-2 6 5 6 9 1Z',p.light);path('M10 19l-5 3 7 2Z',p.gold);
    r(15,18,2,2,p.ink);path('M47 25l6-5 2 2-5 7Z','#b9984e');
   }else if(n==='Pseudodragon'){
    path('M27 21 19 9l9 4 5 8 7 2 2 5-6 2-6-3-6 3-5-2 4-5Z','#9d83c7');
    path('M29 21l-5-9 9 5 2 6Z','#d4b8db');path('M39 26l9-3 5 5-4 5-5-1 5-3-3-2-6 2Z','#9d83c7');
    path('M24 22l-5-5-4 2 2 6 7 1Z','#9d83c7');r(18,20,2,2,p.gold);r(16,15,2,4,p.light);
   }else if(n==='Wyvern'){
    path('M28 22 14 5l3 13-7 4 15 5Zm8 0L49 4l-2 13 7 5-16 5Z','#6e986c');
    path('M27 22l-5-10 7 5 3 8Zm11 0 6-10-8 5-3 8Z','#b3c58b');
    path('M27 15l4-5-2-5 5 4 4 5-2 12-4 7-4-7Z','#526e57');
    path('M34 28l7 3 8-3 1-5 4 4-4 6-9 2-8-3Z','#526e57');path('M50 23l1-6 4 6Z',p.gold);
    r(31,15,2,2,p.gold);
   }else if(n==='Red Dragon'){
    path('M26 23 10 4l2 15-6 5 18 6Zm12 0L54 4l-2 15 6 5-18 6Z','#a53431');
    path('M25 25 15 10l2 11-5 2 13 4Zm14 0L49 10l-2 11 5 2-13 4Z','#d36a43');
    path('M25 31l-2-9 5-8-3-6 5 3 3-8 3 9 5 3-1 12 5 7h-9l-3-5-3 5h-8Z','#b23b32');
    path('M27 15l5-3 7 3-1 7-6 4-5-4Z','#d65d42');r(29,17,2,2,p.gold);r(35,17,2,2,p.gold);
    path('M36 29l8 2 8-4 3 2-9 6-9-2Z','#b23b32');
   }else{
    path('M20 20h22l4 10-5 5h-6l-2-7-6 1-2 6h-6Z',col);
    path('M22 21l-6-8-5 5 2 8 10 2Z',col);r(16,19,2,2,p.white);
   }
  }else if(c.ct==='Undead'){
   const k=n==='Zombie'?'#86a66c':n==='Ghoul'?'#8f779f':p.light;
   if(n==='Shadow'){
    path('M17 33l4-8-4-5 7-6 2-8 9 2 4 7 8 3-4 5 5 10-10-4-6 6-5-7Z','#554968');
    r(27,15,2,2,p.gold);r(35,15,2,2,p.gold);
   }else if(n==='Wraith'){
    path('M32 3l8 5 3 10 8 5-5 4 5 8-11-3-7 5-7-5-12 3 5-8-5-4 8-5 3-10Z','#9db9ca');
    path('M27 9h10l4 10-4 9-5 3-5-3-4-9Z',p.dark);r(27,15,2,3,p.gold);r(35,15,2,3,p.gold);
   }
   else{r(26,8,13,12,k);r(28,12,3,3,p.ink);r(34,12,3,3,p.ink);r(29,18,7,2,p.ink);
    if(n==='Skeleton'){r(31,20,3,12,k);for(let i=0;i<3;i++)r(26,22+i*3,13,1,k);r(26,32,3,4,k);r(36,32,3,4,k);tool('sword')}
    else{path('M25 21h15l5 14H20Z',n==='Vampire Spawn'?'#8e3b58':col);r(19,23,6,5,k);r(40,23,6,5,k);
     if(n==='Zombie'){path('M21 21l-8 5 2 4 9-3Zm20 2 9 3-1 4-9-2Z',k);r(24,28,5,5,p.dark);r(35,31,4,4,p.dark)}
     if(n==='Lich'){path('M23 7l2-5 4 4 3-5 3 5 4-4 2 5Z',p.gold);path('M20 23l-5 10 8-2Zm25 0 5 10-8-2Z',p.dark);tool('staff')}
     if(n==='Wight'){path('M24 7l3-4h11l3 4v5l-4-2H28l-4 2Z',p.stone);r(26,22,12,8,p.stone);tool('sword')}
     if(n==='Vampire Spawn'){r(29,17,2,4,p.white);r(35,17,2,4,p.white);path('M24 21l-9-5 5 19h5Zm16 0 9-5-5 19h-5Z',p.red)}
     if(n==='Ghoul'){r(16,26,8,2,k);r(43,26,8,2,k);r(17,28,2,5,k);r(48,28,2,5,k)}
    }
   }
  }else{
   const k=n==='Troll'?'#6c9a60':n==='Clay Golem'?'#b47754':n==='Gargoyle'?p.stone:'#b89b72';
   if(n==='Troll'){
    path('M25 17l-7 5-4 12h6l6-9 2 5-4 6h7l3-7 4 7h7l-4-8 2-6-5-5Z',k);
    path('M25 6l5 2 3-4 3 4 5-2-2 12H27Z',k);
   }else if(n==='Clay Golem'){
    path('M20 18l5-3h14l5 3 3 14-7 4h-7l-1-5-1 5h-7l-7-4Z',k);
    path('M26 5h12l3 5-2 9H25l-2-9Z',k);r(16,20,5,11,k);r(43,20,5,11,k);
   }else{
    path('M23 18h19l4 13H19Z',k);r(25,7,15,13,k);r(17,21,6,12,k);r(42,21,6,12,k);r(23,31,7,5,k);r(36,31,7,5,k);
   }
   if(n==='Cyclops')r(29,12,7,4,p.white);else{r(28,12,2,2,p.ink);r(35,12,2,2,p.ink)}
   if(n==='Ogre'){tool('hammer');r(28,18,2,4,p.light)}
   if(n==='Hill Giant'){r(12,23,12,10,p.stone);r(14,21,8,2,p.stone)}
   if(n==='Troll'){r(29,17,7,5,p.light);r(15,30,10,2,p.light)}
   if(n==='Gargoyle'){path('M24 20 12 6v18l12 6Zm17 0L53 6v18l-12 6Z',p.stone);r(25,4,3,6,p.stone);r(37,4,3,6,p.stone)}
   if(n==='Clay Golem'){r(27,23,12,2,p.gold);r(30,10,6,3,p.red)}
  }
 }
 function magic(){
  const n=c.name;
  if(n.startsWith('Potion')||n==='Mana Potion'){
   if(n==='Mana Potion'){
    r(28,5,8,4,p.gold);r(29,9,6,6,p.light);path('M29 14 19 24l4 10h18l4-10-10-10Z',p.blue);
    path('M25 25l7-7 7 7-7 7Z',p.white);r(24,22,2,3,p.light);
   }else if(n==='Potion of Healing'){
    r(29,6,6,4,p.gold);r(28,10,8,5,p.light);path('M28 15h8l6 6v11l-4 3H26l-4-3V21Z',p.red);
    path('M32 29l-7-6 2-4 5 3 5-3 2 4Z',p.white);
   }else if(n==='Potion of Heroism'){
    r(26,5,12,4,p.gold);r(28,9,8,5,p.light);path('M27 14h10l6 5-2 15H23l-2-15Z',p.gold);
    path('M25 20l7-4 7 4-2 8-5 4-5-4Z',p.red);r(31,20,2,8,p.white);
   }else{
    r(29,4,6,4,p.gold);r(29,8,6,6,p.light);path('M28 14h8l3 5v15H25V19Z',p.green);
    bolt(27,14,p.white);path('M15 22h7v2h-7Zm-3 5h10v2H12Zm30-5h7v2h-7Z',p.light);
   }
  }else if(n==='Wand of Lightning'){tool('wand',26);bolt(36,5,p.gold)}
  else if(/Lightning|Reprisal/.test(n)){bolt(19,5,p.gold);if(n==='Chain Lightning'||n==='Ashen Reprisal')bolt(39,13,n==='Ashen Reprisal'?p.red:p.blue)}
  else if(n==='Fireball'||n==='Meteor Swarm'||n==='Burning Hands'){
   const points=n==='Meteor Swarm'?[[18,16],[34,8],[42,25]]:[[32,23]];
   for(const [x,y] of points){path(`M${x-6} ${y+7}l-3-7 14-14-4 14 2 7Z`,p.red);r(x-4,y-3,8,9,p.gold);r(x-2,y,4,4,p.white)}
   if(n==='Burning Hands'){r(17,24,10,9,shade);r(38,24,10,9,shade)}
  }else if(n==='Cone of Cold'){path('M16 20 47 5v30Z',p.blue);for(let i=0;i<3;i++){cross(29+i*6,11+i*4,p.white)}}
  else if(n==='Sleep'){path('M34 5h10L32 20h12v3H27v-3L39 8H34Z',p.blue);r(19,27,22,6,p.light)}
  else if(n==='Hold Person'){r(27,12,10,10,shade);r(25,23,14,12,col);for(let i=0;i<5;i++)r(18+i*6,7,3,28,p.stone)}
  else if(/Insight|Study/.test(n)){r(18,13,28,20,p.gold);r(20,15,11,16,p.light);r(33,15,11,16,p.white);for(let i=0;i<3;i++)r(22,18+i*4,6,1,p.blue);if(n==='Lantern Study')tool('lantern',49);else r(29,6,7,5,p.blue)}
  else if(n==='Magic Missile'){for(let i=0;i<3;i++){r(18+i*9,8+i*7,12,3,p.blue);r(28+i*9,7+i*7,4,5,p.white)}}
  else if(n==='Disintegrate'){r(17,18,27,3,p.green);for(let i=0;i<8;i++)r(41+(i*3)%11,8+i*3,2,2,p.green)}
  else{
   if(n==='Cure Light Wounds'){
    path('M13 28l7-7 8 4 4 6-7 3-5-4-5 3Zm38 0-7-7-8 4-4 6 7 3 5-4 5 3Z',shade);
    cross(28,9,p.green);r(19,11,3,3,p.white);r(42,14,3,3,p.white);
   }else if(n==='Cure Serious Wounds'){
    path('M14 30l8-8 6 3 4 5 4-5 6-3 8 8-5 4-6-4-7 5-7-5-6 4Z',shade);
    path('M32 8l-7-4-6 5 2 8 11 8 11-8 2-8-6-5Z',p.red);cross(28,8,p.white);
   }else if(n==='Mass Cure Wounds'){
    for(const x of [18,30,42]){r(x,18,5,5,shade);path(`M${x-2} 25h9l2 9H${x-4}Z`,p.green)}
    cross(27,4,p.white);r(18,12,2,2,p.gold);r(45,12,2,2,p.gold);
   }else if(n==='Turn Undead'){
    path('M16 16l3-7h10l3 7-3 8H19Z',p.light);r(19,15,3,3,p.ink);r(25,15,3,3,p.ink);r(20,22,8,2,p.dark);
    bolt(36,5,p.gold);path('M15 29h15v3H15Z',p.stone);
   }else if(n==='Bless'){
    path('M17 13l5-6 10-3 10 3 5 6-4 2-3-4-8-2-8 2-3 4Z',p.gold);
    path('M26 27l-5-8 4-3 7 5 7-5 4 3-5 8-6 6Z',shade);cross(28,12,p.white);
   }else if(n==='Smite'){
    bolt(15,4,p.gold);tool('sword',42);path('M32 28l6-3-2 5 7 2-8 2Z',p.white);
   }else if(n==='Emberwatch Vigil'){
    tool('lantern',18);tool('lantern',45);path('M24 33l8-15 8 15Z',p.red);path('M29 33l3-9 4 9Z',p.gold);
   }else if(n==='Hearthward Prayer'){
    path('M14 20 32 5l18 15-3 3-3-2v14H20V21l-3 2Z',p.red);
    r(23,20,18,15,'#af764e');r(28,24,8,11,p.dark);path('M30 33l2-7 3 7Z',p.gold);
   }
  }
 }
 function gear(){
  const n=c.name;
  if(c.slot==='P'){
   if(n==='Dagger'||n==='Poisoned Dagger'){
    path('M30 7l4 4 2 12-4 5-4-5 1-12Z',n==='Poisoned Dagger'?p.green:p.light);
    path('M25 25h14v3H25Z',p.gold);r(30,28,4,7,'#83573d');r(29,34,6,2,p.gold);
    if(n==='Poisoned Dagger'){path('M38 12l3 5-3 3-2-3Z',p.green);r(41,23,2,3,p.green)}
   }else if(n==='Assassin Knife'){
    path('M18 10l8-3 15 11 2 6-7 1-10-10Z',p.stone);path('M20 10l7-1 13 10-12-6Z',p.light);
    path('M37 24l5-3 5 8-4 3Z',p.dark);r(43,30,4,3,p.gold);
   }else if(n==='Club'){
    path('M24 7l11-2 4 11-4 8-2 11-5-1 2-12-7-5Z','#98603a');
    r(26,9,2,9,p.gold);r(31,13,2,7,p.gold);path('M29 27l5 1-1 3-5-1Z',p.light);
   }else if(n==='Spear'||n==='Halberd'){
    path('M30 12h3v24h-3Z','#98603a');path('M31 2l5 9-4 4-4-4Z',p.light);
    if(n==='Halberd'){path('M33 10l12-3-3 8-9 5Z',p.stone);path('M42 8l-1 5-7 3Z',p.light);path('M29 14l-6-4 2 7 4 2Z',p.stone)}
   }else if(n==='Longbow'){
    path('M22 4q20 13 0 32l3-10V14Z','#b88b4d');path('M22 4l10 16-10 16 8-16Z',p.light);
    r(20,19,25,1,p.white);path('M45 17l5 3-5 3Z',p.stone);path('M20 18l-4-2 2 4-2 4 4-3Z',p.red);
   }else if(n==='War Hammer'){
    path('M30 15h4v21h-4Z','#83573d');path('M18 6h25l3 6-5 7H20l-4-6Z',p.stone);
    path('M20 8h20v4H20Z',p.light);r(30,14,4,4,p.gold);r(29,33,6,3,p.gold);
   }else if(n==='Twin Axes'){
    path('M22 13h3v23h-3Zm16 0h3v23h-3Z','#83573d');
    path('M23 8 12 5l3 8-3 8 11-4Zm17 0 11-3-3 8 3 8-11-4Z',p.stone);
    path('M13 6l4 7-4 7 7-4v-7Zm37 0-4 7 4 7-7-4V9Z',p.light);
   }else if(n==='Rapier'){
    path('M31 3l2 19-1 4-2-4Z',p.white);path('M25 23q7 9 14 0l-2 6-5 3-5-3Z',p.gold);r(30,29,4,6,p.dark);
   }else if(n==='Long Sword'){
    path('M32 3l4 7v15l-4 3-4-3V10Z',p.light);path('M32 6v20l3-2V10Z',p.stone);
    path('M23 26h18v3H23Z',p.gold);r(30,29,4,6,'#83573d');r(29,34,6,2,p.gold);
   }else if(n==='Vampiric Blade'){
    path('M32 3l7 8-3 13-4 4-4-4-3-13Z','#a33d4b');path('M32 7l3 5-3 13-3-13Z',p.light);
    path('M20 24l8 3 4-2 4 2 8-3-3 6-9 2-9-2Z',p.dark);r(30,30,4,5,p.red);
   }else if(n==='Flame Tongue'){
    path('M27 27l-5-8 5 1-1-10 5 4 3-11 4 9 5-3-2 12-5 6Z',p.red);
    path('M29 25l-2-7 4 2 3-11 3 9-1 7Z',p.gold);path('M23 26h18v3H23Z',p.stone);r(30,29,4,6,'#83573d');
   }else if(n==='Vorpal Blade'){
    path('M32 2l6 8-1 13-5 5-5-5-1-13Z',p.blue);path('M32 4l2 19-2 3-2-3Z',p.white);
    path('M21 25l8 3h6l8-3-3 5H24Z',p.gold);r(30,30,4,5,p.dark);r(20,10,2,2,p.blue);r(42,17,2,2,p.blue);
   }
  }else if(c.slot==='A'){
   if(n==='Shield'){
    path('M21 9l11-4 11 4v13l-4 8-7 5-7-5-4-8Z',p.stone);path('M24 11l8-3 8 3v10l-3 6-5 4-5-4-3-6Z',col);cross(28,15,p.gold);
   }else if(n==='Buckler'){
    path('M27 10h10l6 6v9l-6 6H27l-6-6v-9Z','#9a7953');path('M29 13h6l5 5v5l-5 5h-6l-5-5v-5Z',p.stone);r(29,17,6,7,p.gold);
   }else if(n==='Tower Shield'){
    path('M19 5h26v27l-13 4-13-4Z',p.stone);path('M22 8h20v22l-10 3-10-3Z',col);r(30,9,4,22,p.gold);path('M24 19h16v3H24Z',p.gold);
   }
   else{
    if(n==='Leather Armor'){
     path('M25 7h14l7 7-5 5-1 16H24l-1-16-5-5Z','#98603a');path('M25 11l7 5 7-5-2 17H27Z','#c28a55');r(25,27,14,3,p.gold);
    }else if(n==='Warding Robes'){
     path('M25 7h14l8 8-4 5-4-4 7 19H18l7-19-4 4-4-5Z','#63528d');
     path('M26 10l6 7 6-7-2 14 5 11H23l5-11Z','#9279ad');cross(28,19,p.gold);
    }else if(n==='Plate Armor'){
     path('M25 6h14l8 5-3 10-4-3v12l-8 5-8-5V18l-4 3-3-10Z',p.stone);
     path('M26 10h12l3 5-2 10-7 4-7-4-2-10Z',p.light);r(30,11,4,17,p.gold);
     path('M17 11l6-3 3 6-5 6-4-2Zm30 0-6-3-3 6 5 6 4-2Z',p.stone);
    }else if(n==='Dragonscale Mail'){
     path('M23 7h18l8 8-5 6-3-3v16H23V18l-3 3-5-6Z','#993f3a');
     for(let y=12;y<31;y+=5)for(let x=25;x<40;x+=5)path(`M${x} ${y}h4l-2 4Z`,y%2?p.gold:'#df7657');
     path('M17 12l5-8 3 9-4 5Zm30 0-5-8-3 9 4 5Z',p.gold);
    }else{
     const mithril=n==='Mithril Shirt',spiked=n==='Spiked Mail';
     path(mithril?'M25 7h14l7 6-4 5-3-2v16H25V16l-3 2-4-5Z':'M23 8h18l8 8-5 6-3-3v15H23V19l-3 3-5-6Z',mithril?'#b9d1df':p.stone);
     for(let y=13;y<31;y+=4)for(let x=26;x<39;x+=4)r(x,y,2,2,mithril?p.white:p.light);
     if(spiked){for(let x=19;x<46;x+=6)path(`M${x} 15l2-8 3 8Z`,p.light);r(27,25,10,3,p.red)}
     if(mithril)path('M27 8l5 4 5-4-2 6h-6Z',p.blue);
    }
   }
  }else if(/Boots/.test(n)){r(21,14,8,19,p.gold);r(35,14,8,19,p.gold);r(17,28,12,6,col);r(35,28,12,6,col);if(n==='Winged Boots'){path('M21 19 12 9v13l9 5Zm22 0 9-10v13l-9 5Z',p.light)}else bolt(28,5,p.blue)}
  else if(/Ring/.test(n)){path('M22 14h20v18H22Zm4 4v10h12V18Z',p.gold);r(28,10,8,8,n==='Ring of Regeneration'?p.green:p.blue)}
  else if(/Cloak/.test(n)){path('M25 7h14l10 28H15Z',p.green);r(27,8,10,8,p.dark);r(31,19,2,13,p.gold)}
  else if(/Staff|Rod/.test(n)){tool('staff',30);if(n==='Rod of Reaching'){r(22,10,20,2,p.light);r(20,8,3,6,p.gold);r(42,8,3,6,p.gold)}}
  else if(/Bracers|Gauntlets/.test(n)){r(19,14,11,20,p.stone);r(35,14,11,20,p.stone);r(19,18,11,3,p.gold);r(35,18,11,3,p.gold);if(n==='Gauntlets of Ogre Power'){r(18,10,13,8,p.green);r(34,10,13,8,p.green)}}
  else if(n==='Eye of Keenness'){path('M15 21l10-9h14l10 9-10 9H25Z',p.light);r(27,15,10,13,p.blue);r(31,17,3,9,p.ink)}
  else if(n==='Orb of Dragonkind'){r(23,11,18,20,p.red);path('M25 25l4-10 8-2-3 8 5 7Z',p.gold)}
  else if(n==='Deep Anvil Charm'){r(23,8,18,2,p.gold);path('M18 16h28v6H35v7h6v5H23v-5h6v-7H18Z',p.stone)}
  else{path('M22 6v8l10 9 10-9V6h-2v7l-8 7-8-7V6Z',p.gold);r(27,21,11,12,n==='Amulet of Health'?p.red:p.blue);cross(28,21,p.white)}
 }
 if(c.t==='s')magic();
 else if(c.t==='i')gear();
 else if(figures[c.name]||c.ct==='Humanoid')person();
 else monster();
 return a;
}
function art(c,cls='art'){const unit=cls==='unitSprite';return `<svg class="${cls}" viewBox="${unit?'8 0 48 38':'0 0 64 40'}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${c.name.replace(/["&<>]/g,'')} fantasy illustration">${sprite(c,unit)}</svg>`}
function scene(seed,colors){
 const h=hash(String(seed)),p=palette,a=colors||[p.ink,p.dark,p.stone];let s=rect(0,0,128,64,a[0])+rect(0,28,128,36,a[1]);
 for(let i=0;i<20;i++)s+=rect((h+i*23)%128,(h+i*7)%26,1,1,p.light);
 s+=rect(95,8,10,10,'#8fa3c4')+rect(92,11,16,4,'#8fa3c4');
 for(let i=0;i<16;i++){const y=30+(h+i*13)%14;s+=rect(i*8,y,8,64-y,a[2]);s+=rect(i*8+2,y-4,4,4,a[2])}
 const name=String(seed).toLowerCase();
 if(/road|underhall|warren/.test(name))s+=`<path d="M56 64h25L67 34h-6Z" fill="${p.stone}"/>`;
 if(/anvil|foundry/.test(name)){s+=rect(48,34,32,8,p.gold)+rect(55,42,18,6,p.gold)+rect(60,48,8,8,p.stone)}
 if(/archive|coast/.test(name))for(let i=0;i<4;i++)s+=rect(i*32,50+i%2*4,25,2,p.blue);
 if(/wood|grove/.test(name))for(let i=0;i<5;i++){s+=rect(i*27+6,25,4,39,p.ink)+rect(i*27,28,16,16,p.ink)}
 if(/throne|court|seal/.test(name))s+=rect(54,20,20,35,p.ink)+rect(49,33,30,6,p.gold)+rect(58,14,4,7,p.gold)+rect(66,14,4,7,p.gold);
 return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 64" shape-rendering="crispEdges">${s}</svg>`).replace(/'/g,'%27')}')`;
}
function hubScene(){
 const p=palette;let s=rect(0,0,128,64,'#0d1324')+rect(0,14,128,14,'#131c33')+rect(0,28,128,12,'#1b2745')+rect(0,40,128,24,'#222f50');
 for(let i=0;i<34;i++)s+=rect((i*37+11)%128,(i*19)%30,1,1,i%5?p.light:p.white);
 s+=rect(60,6,9,9,'#b9c8e4')+rect(58,8,13,5,'#b9c8e4')+rect(63,8,3,3,'#8fa3c4');
 for(let i=0;i<16;i++){const x=i*8,h=6+(i*7)%9+(i%4==2?5:0);s+=rect(x,44-h,8,h+20,'#1a2440')}
 for(let i=0;i<10;i++){const x=i*14,h=4+(i*5)%7;s+=rect(x,50-h,14,h+14,'#151d35')}
 s+=rect(88,20,14,44,'#0c1120')+rect(85,26,20,38,'#0c1120')+rect(91,10,8,12,'#0c1120')+rect(93,4,4,8,'#0c1120')+rect(92,13,6,2,'#0c1120');
 s+=rect(94,2,1,4,p.red)+rect(95,2,5,3,p.red)+rect(90,32,1,2,'#d9a441')+rect(98,32,1,2,'#d9a441')+rect(94,40,1,2,'#d9a441')+rect(93,16,1,2,'#d9a441')+rect(89,48,1,2,'#d9a441')+rect(99,48,1,2,'#d9a441');
 s+=rect(70,36,10,28,'#0c1120')+rect(68,34,3,3,'#0c1120')+rect(72,34,3,3,'#0c1120')+rect(77,34,3,3,'#0c1120')+rect(74,42,1,2,'#d9a441');
 s+=rect(106,38,12,26,'#0c1120')+rect(106,36,3,3,'#0c1120')+rect(112,36,3,3,'#0c1120')+rect(110,45,1,2,'#d9a441');
 s+=rect(0,54,128,10,'#0a0e1a');for(let i=0;i<16;i++)s+=rect(i*8+1,51,5,4,'#0a0e1a');
 s+=rect(8,44,2,12,'#2a1f1a')+rect(8,41,2,2,'#ff8a3a')+rect(112,44,2,12,'#2a1f1a')+rect(112,41,2,2,'#ff8a3a');
 s+=`<path d="M52 64h24L68 54h-8Z" fill="#1a2440"/>`;
 return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 64" shape-rendering="crispEdges" preserveAspectRatio="xMidYMax slice">${s}</svg>`).replace(/'/g,'%27')}')`;
}
function illustratedScene(seed,colors,details=''){
 const h=hash(String(seed)),[sky,horizon,ground]=colors;
 let s=`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset=".7" stop-color="${horizon}"/><stop offset="1" stop-color="${ground}"/></linearGradient><radialGradient id="glow"><stop stop-color="${horizon}" stop-opacity=".5"/><stop offset="1" stop-color="${horizon}" stop-opacity="0"/></radialGradient><radialGradient id="shade"><stop offset=".4" stop-color="#05070c" stop-opacity="0"/><stop offset="1" stop-color="#05070c" stop-opacity=".66"/></radialGradient></defs>`;
 s+=rect(0,0,400,800,'url(#sky)')+`<circle cx="${100+(h%200)}" cy="${180+(h%120)}" r="220" fill="url(#glow)"/>`;
 for(let i=0;i<42;i++){const x=(h+i*97)%400,y=(h*3+i*53)%360;s+=rect(x,y,i%7?2:3,i%7?2:3,i%4?'#dce4ef':'#ffc879')}
 s+=`<path d="M0 520Q95 475 190 525t210-8V800H0Z" fill="${ground}" opacity=".72"/><path d="M0 635Q120 590 230 640t170-12V800H0Z" fill="#060a10" opacity=".34"/>`;
 s+=details;
 for(let i=0;i<12;i++){const x=i*36+(h%19),y=675+(h+i*17)%90;s+=rect(x,y,18,2,'#d7c7a2')}
 s+=`<rect width="400" height="800" fill="url(#shade)"/>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">${s}</svg>`;
 return `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g,'%27')}')`;
}
function portrait(id,bg='#334b91',fg='#a8d7ff'){
 const art={
  anvilthane:'<path d="M5 49V37h38v12Z" fill="#6c4a35"/><path d="M9 17 14 7h20l6 10v10H9Z" fill="#a5a58b"/><path d="M13 21h23v13H13Z" fill="#d39a72"/><path d="M14 30h21l-2 12-9 7-9-7Z" fill="#e1c49b"/><path d="M16 23h5v3h-5Zm12 0h5v3h-5Zm-5 10h3v11h-3Z" fill="#372f31"/><path d="M8 16h33v4H8Zm13-8h6v10h-6Z" fill="#cfaa68"/><path d="M37 30h4v18h-4Zm-4-3h12v8H33Z" fill="#a8b7c8"/>',
  mosskeeper:'<path d="M12 49 15 16l8-8 12 8 3 33Z" fill="#806344"/><path d="m18 18-11-8 2-6 13 10 2-12h5l2 13L43 5l2 5-12 12Z" fill="#8f744c"/><path d="M5 10h13v7H5Zm24-3h14v8H29ZM12 3h12v6H12Z" fill="#529c74"/><path d="M18 25h5v3h-5Zm10 0h5v3h-5Z" fill="#d7efa4"/><path d="m20 35 5 3 6-4-2 7h-7Z" fill="#322f28"/><path d="m15 40-7 9h11l5-8 5 8h13l-8-10Z" fill="#3c6544"/>',
  tideoracle:'<path d="M7 49V37l12-7h14l10 9v10Z" fill="#326e87"/><path d="M15 14h20v19l-10 9-10-9Z" fill="#8bc3c6"/><path d="m12 30-4-13 9-12 7 3 8-5 9 10-3 23-5-8V15l-8 5-8-5v16Z" fill="#164c69"/><path d="M18 24h5v3h-5Zm10 0h5v3h-5Z" fill="#f1eedb"/><path d="M21 34h9v2h-9Z" fill="#46668b"/><path d="m17 11 7-9 7 9-7 5Z" fill="#b9e8df"/><path d="M5 41h9v3H5Zm29 3h10v3H34Z" fill="#a6e9e9"/>',
  foxblade:'<path d="M7 31 5 4l16 12h8L43 4l-3 27-9 11H17Z" fill="#c46e39"/><path d="m9 10 9 10H9Zm30 0-9 10h8Z" fill="#f1d8b7"/><path d="M12 25h9v3h-9Zm15 0h9v3h-9Z" fill="#262b37"/><path d="m14 30 10 4 11-4-6 11H20Z" fill="#f1d8b7"/><path d="M21 32h7v4h-7Z" fill="#262b37"/><path d="M8 49V40l9-4 7 9 8-9 8 4v9Z" fill="#385a50"/><path d="m35 36 3-2 8 14-4 2Z" fill="#c4cfec"/>',
  ravenknight:'<path d="M5 49V37l13-8h15l11 9v11Z" fill="#343a58"/><path d="M13 14 21 5h10l8 13-7 18-12-2-8-10Z" fill="#596178"/><path d="m19 17 12-3 6 8 8 8-13 1-4-6-10 2Z" fill="#202738"/><path d="M23 20h8v3h-8Z" fill="#9fe7ff"/><path d="m21 10-8-7 1 11-9-3 9 12Z" fill="#111625"/><path d="M8 40h8v4H8Zm25 0h9v4h-9Z" fill="#8795af"/><path d="M22 35h5v14h-5Z" fill="#c3a45e"/>',
  sunlion:'<path d="m6 22 3-12 11-6 13 1 10 10-1 20-9 13H16L6 36Z" fill="#ac682e"/><path d="m13 19 5-7h14l6 8-3 17-11 7-10-9Z" fill="#e4b46c"/><path d="M14 23h8v3h-8Zm13 0h8v3h-8Z" fill="#382c23"/><path d="m18 30 6-3 7 3-3 9h-8Z" fill="#f1d8b7"/><path d="M21 30h7v4h-7Zm2 4h3v6h-3Z" fill="#382c23"/><path d="m13 12 3-9 8 5 8-5 4 10Z" fill="#f3ca69"/><path d="M22 9h5v6h-5Z" fill="#f1eedb"/>',
  crystalheart:'<path d="m24 3 14 10 6 20-12 16H17L5 31l8-19Z" fill="#8969b3"/><path d="m24 3-3 20-8-11Zm-3 20 17-10 6 20-13-3Zm0 0-4 26L5 31Zm10 7 1 19-15 0 4-26Z" fill="#c9a6e8"/><path d="m15 23 8-2-3 6-5 1Zm13 0 8-2-3 6-5 1Z" fill="#f1eedb"/><path d="m19 34 6-4 6 4-6 8Z" fill="#704ea0"/><path d="m23 32 4 1-2 6-3-4Z" fill="#e8f7ff"/>',
  vanguard:'<path d="M8 49V36l6-8h20l6 8v13Z" fill="#873d31"/><path d="M14 31 16 15l8-8 9 8 2 17-5 5H18Z" fill="#b9c9d6"/><path d="M14 19 16 9l8-5 10 5 2 10-10-4Z" fill="#e1c47b"/><path d="M20 21h3v3h-3Zm8 0h3v3h-3Z" fill="#111625"/><path d="M17 31h15l-4 6h-7Z" fill="#71879b"/><path d="M23 27h5v2h-5Z" fill="#e8e1cf"/>',
  arcanist:'<path d="M7 17 20 3h7l14 15-7-3-7-4-7 5Z" fill="#302754"/><path d="M14 17h21v5H14Zm5 4h13v13l-6 7-7-7Z" fill="#d3a875"/><path d="M17 28h4v3h-4Zm10 0h4v3h-4Z" fill="#111625"/><path d="M18 37h15l8 12H8Z" fill="#314c87"/><circle cx="36" cy="12" r="4" fill="#9fe7ff"/><path d="M18 34h14v3H18Z" fill="#f3ca69"/>',
  warden:'<path d="M8 18 18 5h14l11 15-8-4-5-5H19l-7 9Z" fill="#244932"/><path d="M15 19h19v12l-8 8-11-8Z" fill="#c99568"/><path d="M17 25h5v3h-5Zm10 0h5v3h-5Z" fill="#111625"/><path d="M9 49V37l8-6 9 5 10-5 5 7v11Z" fill="#385a3b"/><path d="M5 31 21 17l2 2L8 35Zm25-9 3-3 10 18-3 2Z" fill="#cfaa68"/><path d="M18 42h17" stroke="#8dc78a" stroke-width="2"/>',
  cleric:'<path d="M10 19 17 7h15l8 12-8-3H17Z" fill="#9a702c"/><path d="M15 19h19v12l-9 8-10-8Z" fill="#e6c590"/><path d="M17 25h5v3h-5Zm10 0h5v3h-5Z" fill="#24202a"/><path d="M8 49V38l8-7 10 6 10-6 5 7v11Z" fill="#6b5429"/><circle cx="25" cy="13" r="5" fill="#fff0a8"/><path d="M24 33h3v10h-3Zm-3 3h9v3h-9Z" fill="#fff0a8"/>',
  rogue:'<path d="M8 23 14 8l11 7 11-7 6 15-8-5H16Z" fill="#49345d"/><path d="M15 21h20v10l-10 8-10-8Z" fill="#b77b64"/><path d="M16 24h7v3h-7Zm11 0h7v3h-7Z" fill="#e4d7bf"/><path d="M8 49V37l9-7 8 7 9-7 8 7v12Z" fill="#49345d"/><path d="M20 32h12v4H20Z" fill="#202032"/><path d="m8 34 3-2 7 12-3 2Zm27-2 3 2-7 12-3-2Z" fill="#bcc5d0"/>',
  beast:'<path d="M7 25 5 5l13 9h12L43 5l-3 23-5 15-11 6-12-7Z" fill="#79563a"/><path d="m8 10 8 8H9Zm31 0-8 8h7Z" fill="#c49a68"/><path d="M12 24h9v5h-9Zm15 0h9v5h-9Z" fill="#efcb66"/><path d="M16 24h3v6h-3Zm13 0h3v6h-3Z" fill="#17212b"/><path d="m16 32 8-6 9 6-3 10H19Z" fill="#c49a68"/><path d="M20 32h9v5h-9Zm3 5h3v6h-3Z" fill="#30272a"/><path d="m12 35 6 4-2 4-6-3Zm24 0-6 4 2 4 6-3Z" fill="#e1c49b"/>',
  undead:'<path d="M8 50 10 18l7-12h14l8 13 3 31-10-5-8 6-8-6Z" fill="#33384e"/><path d="M16 15h17l4 7-3 12-5 3H19l-5-5-2-11Z" fill="#d2d3c7"/><path d="M16 22h7v7h-7Zm11 0h7v7h-7Zm-3 7h3v5h-3Z" fill="#18202c"/><path d="M18 35h14v7H18Z" fill="#a4aea7"/><path d="M20 35v6m4-6v7m4-7v6" stroke="#343a58" stroke-width="2"/><path d="M17 11h15v3H17Zm1-3V4h3v4Zm9 0V3h3v5Z" fill="#c3a45e"/><path d="M18 24h3v2h-3Zm11 0h3v2h-3Z" fill="#8ce5c1"/>',
  dragon:'<path d="M8 44 5 30l7-11-3-13 12 9 9-9 4 13 10 8-4 13-13 9Z" fill="#973c43"/><path d="m12 15-3-9 10 8Zm17-2 1-7 4 13Z" fill="#e5c28a"/><path d="m15 22 17-3 8 8-9 5-16-2Z" fill="#d37a5d"/><path d="m15 23 10-2-3 6-6 1Z" fill="#f3c26b"/><path d="M20 22h2v5h-2Z" fill="#321b25"/><path d="M29 30h14v8H29l-9-5Z" fill="#b85c48"/><path d="M32 31h3v2h-3Zm6 0h3v2h-3Zm-12 6h15v2H26Z" fill="#321b25"/><path d="m28 37 2 5 2-5m3 0 2 5 2-5" fill="#f1eedb"/><path d="m12 29 4 5-5 4 4 5m5-4 4 4-4 4" stroke="#f0a27a" fill="none" stroke-width="2"/>',
  elemental:'<path d="M8 42 13 29 10 22 17 17 16 8 25 14 33 7 32 19 41 23 35 31 39 42 29 38 23 46 18 38Z" fill="#47b8bf"/><path d="m15 23 8-7 10 6-2 14-7 6-8-7Z" fill="#9ce8e7"/><path d="m18 25 6-3-2 5h-4Zm10 0 6-3-2 5h-4Z" fill="#153348"/><path d="m22 34 4-3 4 3-4 4Z" fill="#e8f7e9"/><path d="m9 12 4 4m24 13 5 2M8 39l4-4" stroke="#d4ffff" stroke-width="2"/>',
  construct:'<path d="M11 17h26v20H11Z" fill="#68777a"/><path d="M16 11h16l5 8-5 4H16l-5-4Z" fill="#a5a58b"/><path d="M17 24h5v5h-5Zm10 0h5v5h-5Z" fill="#73e0df"/><path d="M21 33h7v3h-7Z" fill="#36434a"/><path d="M7 49V39l9-5h17l8 5v10Z" fill="#4c5c61"/><circle cx="24" cy="19" r="14" fill="none" stroke="#c3a45e" stroke-width="2"/><path d="M21 4h6v5h-6Zm-16 13h7v5H5Zm33 0h6v5h-6Z" fill="#c3a45e"/>',
  phoenix:'<path d="m24 48-7-8L3 16l12 8L10 6l12 14 2-17 4 17L39 6l-4 19 10-9-7 23-12 9Z" fill="#b8482d"/><path d="m24 44-9-13L8 21l13 8 4-18 5 14 8-10-6 20Z" fill="#f0a13c"/><path d="M23 18h10l4 5-9 5-5 12-4-10Z" fill="#ffd46a"/><path d="m32 22 12 4-13 3Z" fill="#e6c590"/><path d="M28 21h3v3h-3Z" fill="#332128"/><path d="m20 38-5 10 10-5 7 6-4-12Z" fill="#ffd46a"/>',
  moonseer:'<path d="M8 49V19L18 6h14l9 15v28Z" fill="#343b70"/><path d="M14 17h21v14l-10 10-11-10Z" fill="#c99d83"/><path d="M11 13h8v30l-9 6V21Zm22 0h5l4 36-8-8Z" fill="#d8dced"/><path d="M15 23h19v6H15Z" fill="#242b54"/><path d="M18 25h4v1h-4Zm9 0h4v1h-4Z" fill="#d4e4ff"/><path d="M21 34h8v2h-8Z" fill="#8d5968"/><path d="M23 5h7v3h-7v7h7v3h-10l-3-6 2-5Z" fill="#e4e6ff"/><path d="M16 43h19v3H16Z" fill="#a9b5ef"/><path d="M22 18h5v3h-5Z" fill="#e4e6ff"/>',
  stormcaller:'<path d="M5 49V38l13-8h14l12 8v11Z" fill="#1e5968"/><path d="M15 13h19v17l-9 10-10-10Z" fill="#b98166"/><path d="m10 18 3-12 6 5 5-8 6 8 9-4-3 13-7-7-7 5-6-4Z" fill="#d2dce4"/><path d="M18 24h4v3h-4Zm9 0h4v3h-4Z" fill="#b7f4ff"/><path d="m18 31 7 5 8-5-2 12-6 5-7-8Z" fill="#d2dce4"/><path d="M7 28h3v19H7Z" fill="#cfaa68"/><path d="m9 13-6 10h5l-4 10 11-15H9l5-8Z" fill="#b7f4ff"/><path d="M17 39h4v8h-4Zm13 0h4v8h-4Z" fill="#176873"/>',
  wyrmkin:'<path d="M9 49V37l8-6h15l9 8v10Z" fill="#593052"/><path d="M12 15 8 5l10 5 7-5 10 8 5-7-1 17-5 13-10 7-12-13Z" fill="#763b67"/><path d="m12 14-4-9 9 8m16 0 7-7-2 12" fill="#e8c39c"/><path d="M16 22h7v3h-7Zm11 0h7v3h-7Z" fill="#f0c3a0"/><path d="M20 21h2v5h-2Zm8 0h2v5h-2Z" fill="#332239"/><path d="m18 28 7-3 9 5-4 7H20Z" fill="#b47794"/><path d="M22 29h2v2h-2Zm6 0h2v2h-2Zm-7 5h10v2H21Z" fill="#332239"/><path d="m15 18 3-3 3 3m9 0 3-3 3 3m-20 11 3 2m12-2 3 2" stroke="#f2bcdb" fill="none" stroke-width="2"/>'
 };
 const silhouette=art[id]||art.vanguard;
 const svg=`<svg viewBox="0 0 48 52" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true"><rect width="48" height="52" fill="${bg}"/><path d="M0 0h48v52H0Z" fill="url(#portraitBg)"/><defs><linearGradient id="portraitBg" x2="0" y2="1"><stop stop-color="${fg}" stop-opacity=".34"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs><path d="M0 44 14 30h20l14 14v8H0Z" fill="#0b1018" opacity=".5"/>${silhouette}<path d="M2 2h44v48H2Z" fill="none" stroke="${fg}" stroke-opacity=".45" stroke-width="1"/></svg>`;
 return svg;
}
root.DelversArt={art,scene,hubScene,illustratedScene,portrait,palette};
})(typeof self!=='undefined'?self:globalThis);
