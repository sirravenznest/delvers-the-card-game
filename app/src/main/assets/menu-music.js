(function(root){
'use strict';
// Original main-menu theme composed for Delvers: a slow, heroic "Hallowspire" title march. No samples.
const theme={name:'Hallowspire Dawn',d:.36,
 chords:[[50,53,57],[46,50,53],[43,46,50],[45,49,52],[50,53,57],[46,50,53],[41,45,48],[45,49,52]],
 lead:[[74,0,77,0,81,0,79,77],[77,0,81,0,86,0,84,81],[79,0,82,0,86,0,85,82],[81,0,85,0,88,0,85,81],
  [86,0,84,0,81,0,77,81],[84,0,81,0,77,0,74,77],[77,0,81,0,84,0,81,77],[76,0,79,0,81,0,85,0]],
 bass:[0,7,12,7,0,7,12,7]};
const titleTheme={name:'Emberheart Awakening',d:.34,
 chords:[[57,60,64],[53,57,60],[55,59,62],[52,55,59],[57,60,64],[53,57,60],[48,52,55],[52,55,59]],
 lead:[[69,0,72,76,0,79,76,72],[72,0,77,81,0,84,81,77],[74,0,79,83,0,81,79,74],[71,0,76,79,0,83,79,76],
  [76,0,81,84,0,88,84,81],[77,0,81,84,0,89,84,81],[79,0,83,86,0,84,83,79],[76,0,79,83,0,81,79,76]],
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
function titleStep(st,t,a){
 const d=titleTheme.d,b=st>>3,i=st&7,part=b%8,c=titleTheme.chords[part],m=titleTheme.lead[part][i];
 if(i==0){c.forEach(n=>a.note(n,d*8,'sine',.035,t));a.note(c[0]-12,d*5,'triangle',.08,t);a.noise(t,.7,.018,1500)}
 if(i==0||i==4)a.kick(t,.1);
 a.note(c[0]-12+titleTheme.bass[i],d*.9,'triangle',.035,t,850);
 a.note(c[(i*2)%3]+12,d*1.2,'sine',.028,t);
 if(m)a.note(m,d*1.7,'triangle',.065,t,2400);
 if(m&&i==5)a.note(m+12,d*.8,'sine',.022,t);
}
const api={theme,step,titleTheme,titleStep};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversMenuMusic=api;
})(typeof self!=='undefined'?self:globalThis);
