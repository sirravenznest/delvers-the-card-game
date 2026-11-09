// Run with: node tests/ranked-bots.test.js
const path=require('path'),assert=require('assert');
const A=path.join(__dirname,'..','app','src','main','assets');
const C=require(path.join(A,'cards.js')),P=require(path.join(A,'pvp.js'));
const B=require(path.join(A,'ranked-bots.js'));

for(const tier of B.STEPS){
 for(const theme of Object.keys(B.THEMES)){
  const d=B.deckFor(tier.tier,theme);
  assert.strictEqual(d.length,30);
  assert(P.validRanked(d),`${tier.tier} ${theme} must be ranked legal`);
 }
}
assert.strictEqual(B.stepForRating(undefined).tier,'Bronze','unranked starts at Bronze');
for(const [rating,tier] of [[0,'Bronze'],[1099,'Bronze'],[1100,'Silver'],[1299,'Silver'],
 [1300,'Gold'],[1499,'Gold'],[1500,'Platinum'],[1699,'Platinum'],[1700,'Diamond'],
 [1899,'Diamond'],[1900,'Mythic']]){
 assert.strictEqual(B.stepForRating(rating).tier,tier,`${rating} rating maps to ${tier}`);
}
assert.deepStrictEqual(B.STEPS.map(x=>x.min),[0,1100,1300,1500,1700,1900],'exported minimums match UI rank thresholds');
assert.deepStrictEqual(B.STEPS.map(x=>x.rating),[1000,1200,1400,1600,1800,2000],'representative bot ratings remain unchanged');
assert(B.NAMES.length>=12&&new Set(B.NAMES).size==B.NAMES.length,'bots have varied original names');
for(const name of B.NAMES)assert(!C.BN[name],`${name} is an original opponent name`);
for(const theme of Object.keys(B.THEMES)){
 const bronze=B.deckFor('Bronze',theme),mythic=B.deckFor('Mythic',theme);
 assert.notDeepStrictEqual(bronze,mythic,`${theme} deck evolves by tier`);
}

function play(seed){
 const bot=B.forRating(1000,seed),G=P.newMatch(seed,bot.deck,bot.deck),actions=[];
 for(let n=0;n<120&&!G.over;n++){
  const before=G.n,s=G.turn,turn=B.playTurn(G,s,bot.skill);
  actions.push(...turn.map(a=>[s,a]));
  assert(turn.length>0,`${bot.tier} turn makes progress`);
  assert(G.n>before||G.over,`${bot.tier} turn terminates`);
 }
 return{hash:P.hash(G),actions,G}
}
const first=play(712),again=play(712);
assert.strictEqual(first.hash,again.hash,'same seed reproduces the same offline bot match');
assert.deepStrictEqual(first.actions,again.actions,'bot action choices are deterministic');
assert(first.actions.length>0);
console.log(`PASS ranked bot profiles/decks; deterministic match ${first.G.over?'finished':'progressed'} in ${first.actions.length} actions`);
