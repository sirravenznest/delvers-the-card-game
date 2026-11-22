const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage();
 await page.goto(process.env.DELVERS_URL||'http://127.0.0.1:8765/app/src/main/assets/index.html');
 const issues=await page.evaluate(async()=>{
  const issues=[],seen=new Map(),silhouettes=new Map();
  for(const c of ALL){
   const svg=DelversArt.art(c,'unitSprite').replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ');
   const image=new Image();image.src='data:image/svg+xml,'+encodeURIComponent(svg);await image.decode();
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=76;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,96,76);
   const pixels=ctx.getImageData(0,0,96,76).data;let painted=0,clear=0;
   silhouettes.set(c.name,Uint8Array.from({length:pixels.length/4},(_,i)=>pixels[i*4+3]>64?1:0));
   for(let i=3;i<pixels.length;i+=4){if(pixels[i])painted++;else clear++}
   if(painted<100||clear<pixels.length/4*.3)issues.push(c.name+' missing sprite or transparent background');
   for(const [x,y] of [[0,0],[95,0],[0,75],[95,75]])if(pixels[(y*96+x)*4+3])issues.push(c.name+' opaque corner');
   const signature=canvas.toDataURL();
   if(seen.has(signature))issues.push(c.name+' identical pixels to '+seen.get(signature));
   seen.set(signature,c.name);
  }
  for(const [a,b] of [
   ['Giant Rat','Dire Wolf'],['Owlbear','Griffon'],['Pseudodragon','Wyvern'],['Wyvern','Red Dragon'],
   ['Dagger','Assassin Knife'],['Spear','Halberd'],['Rapier','Long Sword'],['Twin Axes','War Hammer'],
   ['Shield','Tower Shield'],['Buckler','Shield'],['Plate Armor','Warding Robes'],
   ['Fireball','Meteor Swarm'],['Cure Light Wounds','Mass Cure Wounds'],['Mana Potion','Potion of Healing']
  ]){
   const one=silhouettes.get(a),two=silhouettes.get(b);
   let different=0;for(let i=0;i<one.length;i++)if(one[i]!==two[i])different++;
   if(different/one.length<.025)issues.push(a+' and '+b+' have nearly identical silhouettes');
  }
  return issues;
 });
 assert.deepEqual(issues,[]);
 console.log('PASS every card has distinct rendered foreground pixels and transparent battlefield corners');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
