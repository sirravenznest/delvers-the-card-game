const assert=require('node:assert/strict');
const M=require('../app/src/main/assets/menu-music.js'),B=require('../app/src/main/assets/battle-music.js');
assert.equal(M.theme.name,'Hallowspire Dawn');
assert(!B.tracks.some(t=>t.name==M.theme.name));
assert.equal(M.titleTheme.name,'Emberheart Awakening');
assert.notEqual(M.titleTheme.name,M.theme.name);
assert.notDeepEqual(M.titleTheme.lead,M.theme.lead,'title melody is original and distinct from the hub theme');
let notes=0,dur=0,titleNotes=0,titleDur=0;
const v={note:(m,d,w,g,at)=>{assert(Number.isFinite(m)&&m>=20&&m<=108);assert(d>0&&d<=4);assert(g>0&&g<=.13);assert(at>=0);notes++},kick:()=>{},noise:()=>{}};
for(let i=0;i<256;i++){M.step(i,i*M.theme.d,v);dur+=M.theme.d}
assert(notes>500&&dur>80&&dur<100);
const tv={...v,note:(m,d,w,g,at)=>{v.note(m,d,w,g,at);titleNotes++}};
for(let i=0;i<256;i++){M.titleStep(i,i*M.titleTheme.d,tv);titleDur+=M.titleTheme.d}
assert(titleNotes>500&&titleDur>80&&titleDur<100);
console.log('PASS original hub and title themes have valid notes, bounded gains and full loops');
