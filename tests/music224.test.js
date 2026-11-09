const assert=require('node:assert/strict');
const M=require('../app/src/main/assets/battle-music.js');
assert.equal(M.tracks.length,4);
assert.equal(new Set(M.tracks.map(t=>t.name)).size,4);
const signatures=new Set();
for(const track of M.tracks){
 let notes=0,duration=0;
 const voices={note:(m,d,w,v,at)=>{assert(Number.isFinite(m)&&m>=20&&m<=108);assert(d>0&&d<=3);assert(v>0&&v<=.1);assert(at>=0);notes++},kick:()=>{},noise:()=>{}};
 for(let i=0;i<256;i++){M.step(track,i,i*track.d,voices);duration+=track.d}
 assert(notes>300&&duration>40&&duration<65);
 signatures.add(JSON.stringify([track.chords,track.lead,track.bass]));
}
assert.equal(signatures.size,4);
console.log('PASS four distinct original battle tracks, valid notes/timings and bounded voice gains');
