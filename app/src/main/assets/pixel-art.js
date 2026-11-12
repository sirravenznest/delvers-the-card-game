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
  path(`M${x} 21h${w}l3 11H${x-3}Z`,col);r(x-3,22,4,8,skin);r(x+w,22,4,8,skin);
  r(x,32,5,4,p.stone);r(x+w-5,32,5,4,p.stone);r(x,29,w,2,accent);
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
   const colors={'Giant Rat':'#9b7e72','Dire Wolf':'#8c9ca8','Owlbear':'#9c7951','Griffon':'#bb9c55','Harpy':'#9b6789','Pseudodragon':'#8e70b6','Wyvern':'#639266','Red Dragon':'#bd4435'};
   const k=colors[n]||col,winged=['Griffon','Harpy','Pseudodragon','Wyvern','Red Dragon'].includes(n);
   r(24,20,19,10,k);r(18,14,12,12,k);r(16,20,7,5,k);r(24,30,5,5,k);r(37,30,5,5,k);
   r(21,17,2,2,p.white);
   if(winged){path('M30 22 17 3 16 15 11 18 27 28Zm6 0L48 3l1 12 5 3-15 10Z',k);r(34,22,7,2,accent)}
   if(n==='Giant Rat'){r(18,11,5,6,p.red);path('M43 24h7v8h-7v-2h5v-4h-5Z',p.red)}
   if(n==='Dire Wolf'){path('M18 15v-7l5 6 5-6v8Z',k);r(15,24,8,2,p.light)}
   if(n==='Owlbear'){r(17,14,15,9,p.light);r(19,16,3,3,p.ink);r(26,16,3,3,p.ink);r(23,20,3,3,p.gold)}
   if(n==='Griffon'){r(18,14,12,10,p.light);r(21,17,2,2,p.ink);r(15,21,7,3,p.gold);r(24,32,3,4,p.gold);r(37,32,3,4,p.gold)}
   if(c.ct==='Dragon'){r(18,10,2,6,p.gold);r(26,10,2,6,p.gold);path('M42 25l10-5v7l-10 3Z',k)}
  }else if(c.ct==='Undead'){
   const ghost=['Shadow','Wraith'].includes(n),k=n==='Zombie'?'#86a66c':n==='Ghoul'?'#8f779f':p.light;
   if(ghost){path('M20 35V16l4-9h13l6 9v19l-7-4-4 5-5-5Z',n==='Shadow'?'#655080':'#9db9ca');r(27,14,2,3,p.gold);r(34,14,2,3,p.gold)}
   else{r(26,8,13,12,k);r(28,12,3,3,p.ink);r(34,12,3,3,p.ink);r(29,18,7,2,p.ink);
    if(n==='Skeleton'){r(31,20,3,12,k);for(let i=0;i<3;i++)r(26,22+i*3,13,1,k);r(26,32,3,4,k);r(36,32,3,4,k);tool('sword')}
    else{path('M25 21h15l5 14H20Z',n==='Vampire Spawn'?'#8e3b58':col);r(19,23,6,5,k);r(40,23,6,5,k);
     if(n==='Lich'){r(25,5,15,4,p.gold);tool('staff')}
     if(n==='Wight'){r(25,7,15,4,p.stone);tool('sword')}
     if(n==='Vampire Spawn'){r(29,17,2,4,p.white);r(35,17,2,4,p.white);path('M24 21l-9-5 5 19h5Zm16 0 9-5-5 19h-5Z',p.red)}
     if(n==='Ghoul'){r(16,26,8,2,k);r(43,26,8,2,k);r(17,28,2,5,k);r(48,28,2,5,k)}
    }
   }
  }else{
   const k=n==='Troll'?'#6c9a60':n==='Clay Golem'?'#b47754':n==='Gargoyle'?p.stone:'#b89b72';
   path('M23 18h19l4 13H19Z',k);r(25,7,15,13,k);r(17,21,6,12,k);r(42,21,6,12,k);r(23,31,7,5,k);r(36,31,7,5,k);
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
   r(27,7,10,4,p.gold);r(28,11,8,5,p.light);path('M27 16h10l6 7v11H21V23Z',p.light);
   r(23,23,18,9,n==='Mana Potion'?p.blue:n==='Potion of Healing'?p.red:n==='Potion of Speed'?p.green:p.gold);
   if(n==='Potion of Healing')cross(28,21,p.white);else if(n==='Potion of Speed')bolt(27,18,p.white);else r(29,24,6,4,p.white);
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
   cross(27,n==='Cure Serious Wounds'?7:15,n==='Smite'?p.gold:p.green);
   if(n==='Mass Cure Wounds'){cross(15,22,p.green);cross(42,22,p.green)}
   if(n==='Cure Serious Wounds'){r(21,23,22,10,shade);cross(27,20,p.white)}
   if(n==='Turn Undead'){r(18,20,8,9,p.light);r(20,22,2,2,p.ink);r(24,22,2,2,p.ink);bolt(36,5,p.gold)}
   if(n==='Bless'){r(21,7,22,2,p.gold);r(18,9,3,4,p.gold);r(43,9,3,4,p.gold)}
   if(n==='Smite')tool('sword',42);
   if(n==='Emberwatch Vigil'){tool('lantern',18);tool('lantern',45)}
   if(n==='Hearthward Prayer'){path('M16 19 32 6l16 13Z',p.red);r(19,19,26,17,p.gold);cross(28,21,p.white)}
   if(n==='Cure Light Wounds'){r(18,27,9,5,shade);r(38,27,9,5,shade)}
  }
 }
 function gear(){
  const n=c.name;
  if(c.slot==='P'){
   if(/Bow/i.test(n))tool('bow',30);
   else if(/Axe/.test(n)){tool('axe',23);tool('axe',41)}
   else if(/Hammer|Club/.test(n)){if(n==='Club'){r(29,9,7,23,'#98603a');r(27,8,11,13,'#98603a');r(30,10,2,9,p.gold)}else tool('hammer',31)}
   else if(/Spear|Halberd/.test(n)){tool('pike',31);if(n==='Halberd')r(32,10,9,9,p.stone)}
   else{tool(/Dagger|Knife/.test(n)?'knife':'sword',31);
    if(/Poison/.test(n))r(29,21,7,5,p.green);
    if(n==='Assassin Knife')r(30,15,5,8,p.dark);
    if(n==='Rapier'){r(30,5,1,22,p.white);r(25,25,12,4,p.gold)}
    if(n==='Vampiric Blade')r(29,10,7,14,p.red);
    if(n==='Flame Tongue')path('M26 25l-4-9 5 2 3-13 5 10 4-5-3 15Z',p.gold);
    if(n==='Vorpal Blade'){r(28,9,2,18,p.blue);r(35,8,2,19,p.blue)}
   }
  }else if(c.slot==='A'){
   if(/Shield|Buckler/.test(n)){const big=n==='Tower Shield',w=n==='Buckler'?14:22;r(32-w/2,big?6:11,w,big?29:20,col);r(30,13,4,15,p.gold);r(25,19,14,3,p.gold)}
   else{path('M23 9h18l9 9-6 5-4-5v17H24V18l-4 5-6-5Z',n==='Leather Armor'?'#98603a':n==='Warding Robes'?col:p.stone);
    if(/Mail|Shirt/.test(n))for(let y=14;y<33;y+=4)for(let x=25;x<40;x+=4)r(x,y,2,2,n==='Mithril Shirt'?p.white:n==='Dragonscale Mail'?p.red:p.light);
    if(n==='Plate Armor'){r(25,13,14,12,p.light);r(30,26,4,9,p.gold)}
    if(n==='Spiked Mail')for(let x=21;x<45;x+=5)path(`M${x} 15l2-7 2 7Z`,p.light);
    if(n==='Warding Robes')cross(28,18,p.gold);
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
function art(c,cls='art'){const unit=cls==='unitSprite';return `<svg class="${cls}" viewBox="${unit?'8 0 48 38':'0 0 64 40'}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${c.name.replace(/["&<>]/g,'')} pixel artwork">${sprite(c,unit)}</svg>`}
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
