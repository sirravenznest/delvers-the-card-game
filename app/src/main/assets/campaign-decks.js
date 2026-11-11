(function(root){
'use strict';
const C=typeof require!=='undefined'?require('./cards.js'):root.DelversCards;
// One faction per boss group; each group's two skirmishes favour a different arm.
const rows=[
 ['Rustfang tollkeepers',['T','R','B'],['Giant Rat','Goblin Skulker','Cutpurse','Rustfang Runner'],['Potion of Speed','Potion of Healing','Potion of Heroism'],['Dagger','Poisoned Dagger']],
 ['Ashen Road deserters',['F','T','R'],['Town Guard','Squire','Ashen Road Escort','Cat Burglar'],['Potion of Healing','Potion of Heroism','Potion of Speed'],['Shield','Long Sword']],
 ['Gutterband pack',['T','B','F'],['Goblin Skulker','Dire Wolf','Giant Rat','Ogre'],['Potion of Heroism','Potion of Speed','Potion of Healing'],['Club','Leather Armor']],
 ['Pale Court servants',['U','W'],['Zombie','Skeleton','Ghoul','Apprentice'],['Magic Missile','Sleep','Arcane Insight','Lantern Study','Disintegrate'],['Dagger','Warding Robes']],
 ['Ashen congregation',['C','U'],['Acolyte','Zombie','Wraith','Priest','Emberheart Confessor'],['Bless','Cure Light Wounds','Hearthward Prayer','Emberwatch Vigil','Turn Undead'],['Shield','Amulet of Health']],
 ['Ironmaw host',['F','G','B'],['Tusk Raider','Ogre','Dire Wolf','Emberguard Knight'],['Potion of Heroism','Potion of Healing','Potion of Speed'],['Club','Twin Axes']],
 ['Cairn oathkeepers',['B','G','K'],['Gargoyle','Earth Elemental','Ogre','Hill Giant'],['Potion of Healing','Potion of Heroism'],['Leather Armor','Tower Shield']],
 ['Spiderthrone hunters',['T','B','W'],['Giant Spider','Assassin','Illusionist','Cat Burglar'],['Sleep','Hold Person','Magic Missile','Arcane Insight'],['Poisoned Dagger','Dagger']],
 ['Cogwright engines',['K','E','W'],['Gargoyle','Clay Golem','Fire Elemental','Apprentice'],['Magic Missile','Lightning Bolt','Arcane Insight','Fireball'],['Warding Robes','Amulet of Warding']],
 ['Hollow legion',['U','F'],['Skeleton','Zombie','Wight','Emberguard Knight'],['Potion of Heroism','Potion of Healing','Potion of Speed'],['Shield','Long Sword']],
 ['Cinder brood',['D','W','F'],['Pseudodragon','Wyvern','Red Dragon','Evoker'],['Burning Hands','Fireball','Ashen Reprisal','Magic Missile','Meteor Swarm'],['Dagger','Flame Tongue']],
 ['Dusk-drake brood',['D','E','G'],['Pseudodragon','Wyvern','Red Dragon','Air Elemental'],['Burning Hands','Cone of Cold','Magic Missile','Meteor Swarm'],['Leather Armor','Amulet of Health']],
 ['Gloom-weavers',['T','U','W'],['Shadow','Wraith','Illusionist','Hollow Seal Scribe'],['Sleep','Hold Person','Arcane Insight','Magic Missile'],['Dagger','Cloak of Elvenkind']],
 ['Marrow pit champions',['G','B','F'],['Ogre','Troll','Dire Wolf','Tusk Raider'],['Potion of Heroism','Potion of Healing','Potion of Speed'],['Club','War Hammer']],
 ['Drowned archivists',['K','W','E'],['Clay Golem','Gargoyle','Hollow Seal Scribe','Air Elemental'],['Arcane Insight','Lantern Study','Cone of Cold','Magic Missile','Disintegrate'],['Warding Robes','Amulet of Warding']],
 ['Tidebound host',['E','D','B'],['Air Elemental','Pseudodragon','Wyvern','Harpy'],['Cone of Cold','Lightning Bolt','Magic Missile','Potion of Healing'],['Leather Armor','Rod of Reaching']],
 ['Thorn court',['R','E','B'],['Briar Elemental','Druid','Gloamwood Lookout','Embertrail Archer','Giant Spider'],['Cure Light Wounds','Hearthward Prayer','Bless','Potion of Healing','Emberwatch Vigil'],['Leather Armor','Longbow']],
 ['Antlered hunt',['B','R','G'],['Dire Wolf','Beastmaster','Ancient Treant','Elven Ranger'],['Potion of Speed','Potion of Heroism','Potion of Healing'],['Leather Armor','Longbow']],
 ['Starless court',['U','W','D'],['Shadow','Wraith','Lich','Pseudodragon'],['Sleep','Magic Missile','Arcane Insight','Disintegrate'],['Dagger','Amulet of Warding']],
 ['Undying throne',['F','C','W','D'],['Emberguard Knight','Paladin','Archmage','Red Dragon'],['Bless','Cure Light Wounds','Magic Missile','Meteor Swarm'],['Shield','Long Sword']]
];
const THEMES=rows.map(([name,classes,signature,spells,gear])=>({name,classes,signature,spells,gear}));
function build(encounter,rarity,random=Math.random){
 if(!Number.isInteger(encounter)||encounter<0||encounter>=60||!Number.isInteger(rarity)||rarity<0||rarity>3)throw new Error('Invalid campaign deck parameters.');
 const theme=THEMES[Math.floor(encounter/3)],arm=encounter%3,pool=C.CR.filter(c=>c.rar<=rarity&&(theme.classes.includes(c.cls)||theme.signature.includes(c.name)));
 const deck=[],counts={};
 function choose(list){
  if(!list.length)throw new Error('Campaign theme has no eligible cards: '+theme.name);
  const weights=list.map(c=>(theme.signature.includes(c.name)?2:1)*(arm<2&&c.cls===theme.classes[arm]?2:1)/(1+(counts[c.name]||0)));
  let roll=random()*weights.reduce((n,w)=>n+w,0),selected=list[list.length-1];
  for(let i=0;i<list.length;i++)if((roll-=weights[i])<0){selected=list[i];break}
  deck.push(selected.name);counts[selected.name]=(counts[selected.name]||0)+1;
 }
 // Keep the previous ~80% creature mix, but guarantee early plays and limit top-heavy hands.
 for(let i=0;i<24;i++){
  const cheap=encounter<10?14:10;
  const band=pool.filter(c=>i<cheap?c.cost<=2:i<20?c.cost>=3&&c.cost<=4:c.cost>=5);
  choose(band.length?band:pool);
 }
 const spells=theme.spells.map(n=>C.BN[n]).filter(c=>c&&c.rar<=rarity);
 const gear=theme.gear.map(n=>C.BN[n]).filter(c=>c&&c.rar<=rarity);
 for(let i=0;i<4;i++)choose(spells);
 for(let i=0;i<2;i++)choose(gear);
 for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
 return deck;
}
const api={THEMES,build};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversCampaignDecks=api;
})(typeof self!=='undefined'?self:globalThis);
