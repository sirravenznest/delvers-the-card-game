(function(root){
'use strict';
const list=[
 {id:'hello',name:'Hello',text:'Hello, Delver!',price:0},
 {id:'goodgame',name:'Good game',text:'Good game. Well fought!',price:0},
 {id:'goodluck',name:'Good luck',text:'May your rolls be kind.',price:0},
 {id:'wellplayed',name:'Well played',text:'That was well played!',price:0},
 {id:'thanks',name:'Thanks',text:'You have my thanks.',price:0},
 {id:'oops',name:'Oops',text:'Not quite what I planned.',price:0},
 {id:'ember',name:'Ember salute',text:'Keep your ember bright!',price:350,
  pixels:[[6,2,4,3,'#fff0a0'],[4,5,8,3,'#ffd05a'],[3,8,10,3,'#f59638'],[5,11,6,2,'#d94c32'],[7,6,2,5,'#fff4bf']]},
 {id:'bulwark',name:'Shield salute',text:'An honourable contest!',price:350,
  pixels:[[3,2,10,7,'#90b8d5'],[4,9,8,2,'#90b8d5'],[5,11,6,2,'#90b8d5'],[7,13,2,1,'#90b8d5'],[7,3,2,9,'#f2cd72'],[5,6,6,2,'#f2cd72']]},
 {id:'lucky',name:'Lucky roll',text:'The dice have spoken!',price:350,
  pixels:[[3,3,10,10,'#eee4c5'],[2,4,1,8,'#b99d7f'],[4,13,8,1,'#b99d7f'],[5,5,2,2,'#52405f'],[9,5,2,2,'#52405f'],[7,7,2,2,'#52405f'],[5,9,2,2,'#52405f'],[9,9,2,2,'#52405f']]},
 {id:'heart',name:'Kindred hearts',text:'A little light for your road.',price:350,
  pixels:[[3,4,4,2,'#f48b9b'],[9,4,4,2,'#f48b9b'],[2,6,12,3,'#de526f'],[3,9,10,2,'#de526f'],[5,11,6,2,'#bd3c64'],[7,13,2,1,'#bd3c64'],[4,5,2,2,'#ffd7d9']]}
];
const defaults=['hello','goodgame'],byId=Object.fromEntries(list.map(e=>[e.id,e]));
function clean(ids){return [...new Set([...defaults,...(Array.isArray(ids)?ids:[]).filter(id=>byId[id])])]}
function art(e){return e&&e.pixels?`<svg class="emoteArt" viewBox="0 0 16 16" role="img" aria-label="${e.name}" shape-rendering="crispEdges">${e.pixels.map(([x,y,w,h,c])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('')}</svg>`:''}
const api={list,defaults,byId,clean,art,COOLDOWN_MS:3000};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversEmotes=api;
})(typeof self!=='undefined'?self:globalThis);
