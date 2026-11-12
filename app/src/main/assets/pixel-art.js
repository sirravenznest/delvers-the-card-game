(function(root){
'use strict';
const palette={ink:'#111625',dark:'#242b40',stone:'#596178',light:'#d7dfdc',skin:'#e3ae79',gold:'#f3ca69',red:'#b84d51',green:'#529c74',blue:'#659bcd',white:'#f1eedb'};
const hash=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
function sprite(c,transparent=false){
 const h=hash(c.name),p=palette,col=(root.DelversCards.CL[c.cls]||['',p.blue])[1];
 let a='';
 if(!transparent){
  a=rect(0,0,64,40,p.ink)+rect(0,24,64,16,p.dark);
  for(let i=0;i<9;i++)a+=rect((h+i*17)%64,(h+i*11)%22,1,1,p.light);
  for(let i=0;i<8;i++)a+=rect(i*8,26+(h+i*7)%7,8,14,p.ink);
  a+=rect(22,35,22,2,p.stone);
 }
 const r=(x,y,w,ht,k)=>{a+=rect(x,y,w,ht,k)};
 if(c.t=='s'){
  const healing=['heal','mheal','bless'].includes(c.kind),magic=healing?p.green:c.kind=='sleep'?p.blue:p.gold;
  r(27,8,10,3,p.light);r(25,11,14,18,col);r(28,14,8,13,p.white);
  if(healing){r(31,16,2,9,magic);r(28,19,8,3,magic)}
  else{r(31,13,5,4,magic);r(28,17,5,4,magic);r(31,21,5,6,magic)}
  r(22,30,20,2,p.stone);
 }else if(c.t=='i'){
  if(c.cls=='P'){r(29,7,5,19,p.light);r(31,7,2,16,p.white);r(24,25,15,3,p.gold);r(30,28,4,7,col)}
  else if(c.cls=='A'){r(23,9,19,17,p.stone);r(26,12,13,17,col);r(29,29,7,3,col);r(31,14,3,12,p.gold)}
  else{r(25,12,14,17,p.gold);r(22,16,20,9,p.gold);r(28,15,8,11,col);r(30,16,4,4,p.white)}
 }else if(['B','D'].includes(c.cls)){
  r(24,18,18,12,col);r(20,15,10,11,col);r(18,12,4,5,col);r(26,12,4,5,col);
  r(21,18,3,2,p.white);r(23,18,1,2,p.ink);r(23,30,5,5,col);r(36,30,5,5,col);r(41,17,6,5,col);
  if(c.cls=='D'){r(34,8,13,3,col);r(36,11,9,8,col);r(46,20,4,6,p.gold)}
  if(/Spider/.test(c.name))for(let i=0;i<3;i++){r(15,18+i*5,10,2,col);r(40,18+i*5,10,2,col)}
 }else if(c.cls=='E'){
  for(let i=0;i<5;i++)r(22+i*4,11+(i*7+h)%9,4,19-(i*7+h)%9,col);
  r(27,17,10,12,p.gold);r(30,20,4,8,p.white);
 }else{
  const undead=c.cls=='U',construct=c.cls=='K',giant=c.cls=='G',skin=undead?p.light:construct?p.stone:palette.skin,x=giant?22:25,w=giant?20:14;
  r(x,7,w,4,col);r(x+1,11,w-2,9,skin);r(x+3,14,2,2,p.ink);r(x+w-5,14,2,2,p.ink);
  r(x,21,w,10,col);r(x-4,22,4,8,skin);r(x+w,22,4,8,skin);r(x+1,31,5,5,p.stone);r(x+w-6,31,5,5,p.stone);
  if(['W','C'].includes(c.cls)){r(43,13,2,22,p.gold);r(41,10,6,5,c.cls=='C'?p.gold:p.blue);r(x-1,4,w+2,3,col)}
  if(['F','G'].includes(c.cls)){r(16,19,7,12,p.stone);r(18,21,3,7,p.gold);r(45,14,2,15,p.light)}
  if(c.cls=='R'){r(43,16,2,16,p.gold);r(45,19,2,10,p.gold);r(42,22,7,1,p.light)}
  if(c.cls=='T'){r(x-1,7,w+2,5,col);r(45,23,2,9,p.light)}
 }
 return a;
}
function art(c,cls='art'){const unit=cls==='unitSprite';return `<svg class="${cls}" viewBox="${unit?'12 3 40 36':'0 0 64 40'}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${c.name.replace(/["&<>]/g,'')} pixel artwork">${sprite(c,unit)}</svg>`}
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
  vanguard:'<path d="M8 49V36l6-8h20l6 8v13Z" fill="#873d31"/><path d="M14 31 16 15l8-8 9 8 2 17-5 5H18Z" fill="#b9c9d6"/><path d="M14 19 16 9l8-5 10 5 2 10-10-4Z" fill="#e1c47b"/><path d="M20 21h3v3h-3Zm8 0h3v3h-3Z" fill="#111625"/><path d="M17 31h15l-4 6h-7Z" fill="#71879b"/><path d="M23 27h5v2h-5Z" fill="#e8e1cf"/>',
  arcanist:'<path d="M7 17 20 3h7l14 15-7-3-7-4-7 5Z" fill="#302754"/><path d="M14 17h21v5H14Zm5 4h13v13l-6 7-7-7Z" fill="#d3a875"/><path d="M17 28h4v3h-4Zm10 0h4v3h-4Z" fill="#111625"/><path d="M18 37h15l8 12H8Z" fill="#314c87"/><circle cx="36" cy="12" r="4" fill="#9fe7ff"/><path d="M18 34h14v3H18Z" fill="#f3ca69"/>',
  warden:'<path d="M8 18 18 5h14l11 15-8-4-5-5H19l-7 9Z" fill="#244932"/><path d="M15 19h19v12l-8 8-11-8Z" fill="#c99568"/><path d="M17 25h5v3h-5Zm10 0h5v3h-5Z" fill="#111625"/><path d="M9 49V37l8-6 9 5 10-5 5 7v11Z" fill="#385a3b"/><path d="M5 31 21 17l2 2L8 35Zm25-9 3-3 10 18-3 2Z" fill="#cfaa68"/><path d="M18 42h17" stroke="#8dc78a" stroke-width="2"/>',
  cleric:'<path d="M10 19 17 7h15l8 12-8-3H17Z" fill="#9a702c"/><path d="M15 19h19v12l-9 8-10-8Z" fill="#e6c590"/><path d="M17 25h5v3h-5Zm10 0h5v3h-5Z" fill="#24202a"/><path d="M8 49V38l8-7 10 6 10-6 5 7v11Z" fill="#6b5429"/><circle cx="25" cy="13" r="5" fill="#fff0a8"/><path d="M24 33h3v10h-3Zm-3 3h9v3h-9Z" fill="#fff0a8"/>',
  rogue:'<path d="M8 23 14 8l11 7 11-7 6 15-8-5H16Z" fill="#49345d"/><path d="M15 21h20v10l-10 8-10-8Z" fill="#b77b64"/><path d="M16 24h7v3h-7Zm11 0h7v3h-7Z" fill="#e4d7bf"/><path d="M8 49V37l9-7 8 7 9-7 8 7v12Z" fill="#49345d"/><path d="M20 32h12v4H20Z" fill="#202032"/><path d="m8 34 3-2 7 12-3 2Zm27-2 3 2-7 12-3-2Z" fill="#bcc5d0"/>',
  beast:'<path d="M8 19 7 6l12 7 7-4 8 5 8-8-1 18-8-6-8 3-9-3Z" fill="#79563a"/><path d="M13 21 19 16h13l7 8-4 11-10 6-10-7Z" fill="#c49a68"/><path d="M14 26h8v3h-8Zm12 0h8v3h-8Z" fill="#17212b"/><path d="m19 34 6-3 7 3-7 6Z" fill="#4a2d28"/><path d="M10 49V39l9-5 6 6 7-6 8 5v10Z" fill="#594333"/>',
  undead:'<path d="M11 20 14 7l7 6 5-9 5 9 8-6 1 17-8-5-6 3-8-3Z" fill="#515b73"/><path d="M15 20h20v14l-10 8-10-8Z" fill="#d2d3c7"/><path d="M17 25h6v5h-6Zm10 0h6v5h-6Z" fill="#343a58"/><path d="m21 34 4 2 4-2v3l-4 3-4-3Z" fill="#55596a"/><path d="M8 49V39l9-7 8 5 9-5 8 7v10Z" fill="#33384e"/>',
  dragon:'<path d="M9 21 4 8l12 5 7-8 7 7 13-5-6 17-9-5-9 4Z" fill="#973c43"/><path d="M14 19h21v14l-10 9-10-9Z" fill="#d37a5d"/><path d="M16 25h7v3h-7Zm10 0h7v3h-7Z" fill="#321b25"/><path d="m19 35 6-3 6 3-6 4Z" fill="#f3c26b"/><path d="M8 49V39l9-7 8 6 9-6 8 7v10Z" fill="#792d3c"/><path d="m15 19 4 3m14-3-4 3m-12 9 3 2m15-2-3 2" stroke="#f0a27a" stroke-width="2"/>',
  elemental:'<path d="M8 42 13 29 10 22 17 17 16 8 25 14 33 7 32 19 41 23 35 31 39 42 29 38 23 46 18 38Z" fill="#47b8bf"/><path d="m15 23 8-7 10 6-2 14-7 6-8-7Z" fill="#9ce8e7"/><path d="m18 25 6-3-2 5h-4Zm10 0 6-3-2 5h-4Z" fill="#153348"/><path d="m22 34 4-3 4 3-4 4Z" fill="#e8f7e9"/><path d="m9 12 4 4m24 13 5 2M8 39l4-4" stroke="#d4ffff" stroke-width="2"/>',
  construct:'<path d="M11 17h26v20H11Z" fill="#68777a"/><path d="M16 11h16l5 8-5 4H16l-5-4Z" fill="#a5a58b"/><path d="M17 24h5v5h-5Zm10 0h5v5h-5Z" fill="#73e0df"/><path d="M21 33h7v3h-7Z" fill="#36434a"/><path d="M7 49V39l9-5h17l8 5v10Z" fill="#4c5c61"/><circle cx="24" cy="19" r="14" fill="none" stroke="#c3a45e" stroke-width="2"/><path d="M21 4h6v5h-6Zm-16 13h7v5H5Zm33 0h6v5h-6Z" fill="#c3a45e"/>',
  phoenix:'<path d="M9 22 4 11l13 5 7-12 8 12 13-5-6 16-8-5-8 4-8-5Z" fill="#f0a13c"/><path d="M15 20h20v13l-10 8-10-8Z" fill="#d39164"/><path d="M17 25h6v3h-6Zm10 0h6v3h-6Z" fill="#332128"/><path d="M8 49V39l9-7 8 6 9-6 8 7v10Z" fill="#8a3c27"/><path d="M21 35h8v3h-8Zm2 3h4v6h-4Z" fill="#ffd46a"/>',
  moonseer:'<path d="M8 20 16 7h18l8 13-9-5H17Z" fill="#343b70"/><path d="M15 20h20v12l-10 9-10-9Z" fill="#c99d83"/><path d="M17 25h6v3h-6Zm10 0h6v3h-6Z" fill="#22253f"/><path d="M8 49V39l9-7 8 5 9-5 8 7v10Z" fill="#333d72"/><path d="M28 7a7 7 0 1 0 8 9 8 8 0 1 1-8-9Z" fill="#e4e6ff"/><path d="M20 35h10" stroke="#a9b5ef" stroke-width="2"/>',
  stormcaller:'<path d="M8 22 13 8l8 8 5-9 9 9 6-8-2 19-9-5-9 4-8-5Z" fill="#176873"/><path d="M15 21h20v12l-10 9-10-9Z" fill="#b98166"/><path d="M17 25h6v3h-6Zm10 0h6v3h-6Z" fill="#182632"/><path d="M8 49V39l9-7 8 6 9-6 8 7v10Z" fill="#1e5968"/><path d="m22 29 5-8-1 6h5l-7 10 1-7Z" fill="#b7f4ff"/>',
  wyrmkin:'<path d="M9 22 5 9l12 5 8-9 7 9 12-5-5 18-9-5-8 4-8-5Z" fill="#763b67"/><path d="M14 20h21v13l-10 9-11-9Z" fill="#d39a82"/><path d="M16 25h7v3h-7Zm10 0h7v3h-7Z" fill="#332239"/><path d="m19 35 6-3 6 3-6 4Z" fill="#f0c3a0"/><path d="M8 49V39l9-7 8 6 9-6 8 7v10Z" fill="#593052"/><path d="m14 18 4 2m16-2-4 2m-13 12 3 2m14-2-3 2" stroke="#f2bcdb" stroke-width="2"/>'
 };
 const silhouette=art[id]||art.vanguard;
 const svg=`<svg viewBox="0 0 48 52" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true"><rect width="48" height="52" fill="${bg}"/><path d="M0 0h48v52H0Z" fill="url(#portraitBg)"/><defs><linearGradient id="portraitBg" x2="0" y2="1"><stop stop-color="${fg}" stop-opacity=".34"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs><path d="M0 44 14 30h20l14 14v8H0Z" fill="#0b1018" opacity=".5"/>${silhouette}<path d="M2 2h44v48H2Z" fill="none" stroke="${fg}" stroke-opacity=".45" stroke-width="1"/></svg>`;
 return svg;
}
root.DelversArt={art,scene,hubScene,illustratedScene,portrait,palette};
})(typeof self!=='undefined'?self:globalThis);
