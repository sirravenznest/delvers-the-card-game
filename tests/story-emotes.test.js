const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Story=require('../app/src/main/assets/story'),Emotes=require('../app/src/main/assets/emotes');
const C=require('../app/src/main/assets/cards'),P=require('../app/src/main/assets/pvp'),N=require('../app/src/main/assets/net');
const {makeDb,clk}=require('./fakedb');
const html=fs.readFileSync(__dirname+'/../app/src/main/assets/index.html','utf8');
const {OP,SK}=vm.runInNewContext(html.slice(html.indexOf('const OP='),html.indexOf('const CAMP='))+';({OP,SK})');
const story=Story.build(OP,SK);
assert.equal(story.length,60);assert.equal(new Set(story.map(s=>s.intro)).size,60);
for(let i=0;i<60;i++){
 assert(story[i].intro.length>100&&story[i].after.length>50&&story[i].line.length>20&&story[i].speaker);
 if(i%3!==2)assert(story[i+1].intro.startsWith(story[i].after),'discovery flows into the next fight');
 else assert.equal(story[i].line,OP[Math.floor(i/3)][11],'boss dialogue preserved');
}
assert.throws(()=>Story.build([],[]));
assert(story[59].after.includes('Your legend is written'));
assert.equal(new Set(Emotes.list.map(e=>e.id)).size,Emotes.list.length);
for(const e of Emotes.list){assert.equal(e.price,e.pixels?350:0);assert(e.text.length<70);assert.equal(!!Emotes.art(e),!!e.pixels)}
assert.deepEqual(Emotes.defaults,Emotes.list.filter(e=>!e.pixels).map(e=>e.id));
assert.deepEqual(Emotes.clean(null),Emotes.defaults,'all base text emotes are available by default');
assert.deepEqual(Emotes.clean(['hello','bad','ember','ember']),[...Emotes.defaults,'ember'],'old saves gain all base text and retain purchased graphics');
console.log('PASS 60 connected story scenes, original dialogue, default text and gold-only graphics');

(async()=>{
 clk.t=30_000_000;const db=makeDb(),d=C.STARTERS[0].list;
 const create=uid=>N.create({db:'https://test',fetch:db.fetch,now:clk.now,auth:()=>({uid,tok:uid,name:uid})});
 const a=create('a'),b=create('b');await a.join(d);await b.join(d);await a.tick();await b.tick();
 assert.equal(a.st,'match');assert.equal(b.st,'match');
 const before=P.hash(a.G),n=a.G.n;
 await a.sendEmote('hello');await b.tick();
 assert.equal(b.emote.id,'hello');assert.equal(b.emote.u,'a');
 assert.equal(P.hash(a.G),before);assert.equal(P.hash(b.G),before);assert.equal(a.G.n,n,'emotes do not consume action indexes');
 await assert.rejects(a.sendEmote('goodgame'),/3 seconds/);
 await assert.rejects(b.sendEmote('<script>'),/Unknown/);
 await b.sendEmote('goodgame');await a.tick();assert.equal(a.emote.id,'goodgame','can emote off-turn');
 clk.t+=Emotes.COOLDOWN_MS;await a.sendEmote('ember');await b.tick();
 assert.equal(b.emote.id,'ember');assert.equal(P.hash(a.G),before);
 const keys=Object.keys(db.get('matches/'+a.mid+'/log'));assert(keys.every(k=>k.startsWith('emote_')));
 const outsider=await db.fetch('https://test/matches/'+a.mid+'/log/emote_x.json?auth=x',{method:'PUT',body:JSON.stringify({u:'x',emote:'hello'})});
 assert.equal(outsider.status,401,'outsider cannot write emotes');
 const prefix='emote_a_',old=b.emote.key;
 db.root.matches[a.mid].log[prefix+'9999999999999999_bad']={u:'a',emote:'free form is forbidden',t:clk.t};
 await b.tick();assert.equal(b.emote.key,old,'invalid fixed-choice message ignored');
 a.act({a:'resign'});
 await assert.rejects(a.sendEmote('hello'),/No active match/,'emotes are for active combat, not results');
 console.log('PASS member-only emotes, cooldown, off-turn delivery, graphics and deterministic game isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
