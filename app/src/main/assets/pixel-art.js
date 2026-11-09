(function(root){
'use strict';
const palette={ink:'#111625',dark:'#242b40',stone:'#596178',light:'#d7dfdc',skin:'#e3ae79',gold:'#f3ca69',red:'#b84d51',green:'#529c74',blue:'#659bcd',white:'#f1eedb'};
const hash=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
function sprite(c){
 const h=hash(c.name),p=palette,col=(root.DelversCards.CL[c.cls]||['',p.blue])[1];
 let a=rect(0,0,64,40,p.ink)+rect(0,24,64,16,p.dark);
 for(let i=0;i<9;i++)a+=rect((h+i*17)%64,(h+i*11)%22,1,1,p.light);
 for(let i=0;i<8;i++)a+=rect(i*8,26+(h+i*7)%7,8,14,p.ink);
 a+=rect(22,35,22,2,p.stone);
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
function art(c,cls='art'){return `<svg class="${cls}" viewBox="0 0 64 40" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${c.name.replace(/["&<>]/g,'')} pixel artwork">${sprite(c)}</svg>`}
function scene(seed,colors){
 const h=hash(String(seed)),p=palette,a=colors||[p.ink,p.dark,p.stone];let s=rect(0,0,128,64,a[0])+rect(0,28,128,36,a[1]);
 for(let i=0;i<20;i++)s+=rect((h+i*23)%128,(h+i*7)%26,1,1,p.light);
 s+=rect(95,8,10,10,p.gold)+rect(92,11,16,4,p.gold);
 for(let i=0;i<16;i++){const y=30+(h+i*13)%14;s+=rect(i*8,y,8,64-y,a[2]);s+=rect(i*8+2,y-4,4,4,a[2])}
 const name=String(seed).toLowerCase();
 if(/road|underhall|warren/.test(name))s+=`<path d="M56 64h25L67 34h-6Z" fill="${p.stone}"/>`;
 if(/anvil|foundry/.test(name)){s+=rect(48,34,32,8,p.gold)+rect(55,42,18,6,p.gold)+rect(60,48,8,8,p.stone)}
 if(/archive|coast/.test(name))for(let i=0;i<4;i++)s+=rect(i*32,50+i%2*4,25,2,p.blue);
 if(/wood|grove/.test(name))for(let i=0;i<5;i++){s+=rect(i*27+6,25,4,39,p.ink)+rect(i*27,28,16,16,p.ink)}
 if(/throne|court|seal/.test(name))s+=rect(54,20,20,35,p.ink)+rect(49,33,30,6,p.gold)+rect(58,14,4,7,p.gold)+rect(66,14,4,7,p.gold);
 return `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 64" shape-rendering="crispEdges">${s}</svg>`).replace(/'/g,'%27')}')`;
}
root.DelversArt={art,scene,palette};
})(typeof self!=='undefined'?self:globalThis);
