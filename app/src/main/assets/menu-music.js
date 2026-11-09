(function(root){
'use strict';
// Original main-menu theme composed for Delvers: a slow, heroic "Hallowspire" title march. No samples.
const theme={name:'Hallowspire Dawn',d:.36,
 chords:[[50,53,57],[46,50,53],[43,46,50],[45,49,52],[50,53,57],[46,50,53],[41,45,48],[45,49,52]],
 lead:[[74,0,77,0,81,0,79,77],[77,0,81,0,86,0,84,81],[79,0,82,0,86,0,85,82],[81,0,85,0,88,0,85,81],
  [86,0,84,0,81,0,77,81],[84,0,81,0,77,0,74,77],[77,0,81,0,84,0,81,77],[76,0,79,0,81,0,85,0]],
 bass:[0,7,12,7,0,7,12,7]};
function step(st,t,a){
 const d=theme.d,b=st>>3,i=st&7,part=b%8,c=theme.chords[part],m=theme.lead[part][i];
 if(i==0){c.forEach(n=>a.note(n,d*8,'sawtooth',.018,t,700));a.note(c[0]-12,d*6,'sine',.12,t);a.kick(t,.2);a.noise(t,.9,.05,900)}
 if(i==4)a.kick(t,.1);
 a.note(c[0]-12+theme.bass[i],d*.9,'triangle',.05,t,900);
 a.note(c[i%3]+12,d*1.4,'sine',.045,t);
 if(m&&b>=4)a.note(m-(b>=12?0:12),d*1.8,'triangle',.06,t,2200);
 if(m&&b>=8)a.note(m+12,d*1.2,'sine',.025,t);
}
const api={theme,step};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversMenuMusic=api;
})(typeof self!=='undefined'?self:globalThis);
