(function(root){
'use strict';
// Original note sequences, composed for Delvers. No sampled or transcribed music.
const tracks=[
 {name:'Emberguard March',d:.205,chords:[[40,43,47],[36,40,43],[45,48,52],[38,42,45]],
  lead:[[76,79,83,81,79,76,74,71],[72,76,79,84,83,79,76,74],[81,84,88,86,84,81,79,76],[78,81,86,85,81,78,74,78]],
  bass:[0,0,12,7,0,12,7,12],wave:'square'},
 {name:'Glassroad Pursuit',d:.18,chords:[[45,48,52],[41,45,48],[43,47,50],[40,44,47]],
  lead:[[81,0,88,84,83,81,76,79],[77,81,84,0,89,84,81,79],[79,83,86,83,91,86,83,79],[80,83,87,0,88,87,83,80]],
  bass:[0,12,7,12,0,7,12,7],wave:'triangle'},
 {name:'Sealbreakers',d:.23,chords:[[38,41,45],[46,50,53],[43,46,50],[45,49,52]],
  lead:[[74,77,0,81,79,77,74,72],[82,81,77,74,77,81,86,84],[79,82,86,0,84,82,79,77],[81,85,88,85,83,81,76,73]],
  bass:[0,0,7,0,12,7,0,7],wave:'square'},
 {name:'Gloamwood Charge',d:.19,chords:[[43,46,50],[39,43,46],[41,45,48],[38,42,45]],
  lead:[[79,82,86,82,81,79,74,77],[75,79,82,87,86,82,79,75],[77,81,84,89,84,81,77,74],[78,81,86,81,78,74,73,74]],
  bass:[0,7,12,0,7,12,0,12],wave:'square'}
];
function step(track,st,t,a){
 const b=st>>3,i=st&7,part=(b>>1)%4,c=track.chords[part],d=track.d,m=track.lead[part][i];
 a.note(c[0]-12+track.bass[i],d*.85,'sawtooth',.055,t,650);
 if(i==0||i==4)a.kick(t,.22);
 if(i==2||i==6)a.noise(t,.11,.08,1800,true);
 a.noise(t,.035,.025,6000,true);
 if(i==0)c.forEach(n=>a.note(n+12,d*6,'triangle',.025,t,1500));
 if(m)a.note(m+(b>=16&&b%4==3?12:0),d*(i%2?.8:1.3),track.wave,.038,t,2400);
 if(b>=8&&i%2==1)a.note(c[(i>>1)%3]+24,d*.6,'triangle',.022,t,3000);
}
const api={tracks,step};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversMusic=api;
})(typeof self!=='undefined'?self:globalThis);
