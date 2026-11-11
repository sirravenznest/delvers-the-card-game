(function(root){
'use strict';
const CATALOG=[
 {id:'classic',name:'Guild Ivory',price:0,body:'#dccfb0',edge:'#fff4d4',ink:'#211c28'},
 {id:'emberheart',name:'Emberheart',price:250,body:'#972f25',edge:'#ffcd73',ink:'#fff5da'},
 {id:'deep-anvil',name:'Deep Anvil',price:400,body:'#344966',edge:'#c7e6ff',ink:'#ffffff'},
 {id:'gloamwood',name:'Gloamwood',price:550,body:'#235444',edge:'#a9e3af',ink:'#f3ffdc'},
 {id:'starless',name:'Starless Court',price:800,body:'#493269',edge:'#dcc0ff',ink:'#fff1ff'}
];
const byId=Object.fromEntries(CATALOG.map(d=>[d.id,d]));
const valid=id=>Object.hasOwn(byId,id)?id:'classic';
function clean(value){
 const dice=CATALOG.filter(d=>d.price&&Array.isArray(value?.dice)&&value.dice.includes(d.id)).map(d=>d.id);
 return{dice,die:valid(value?.die)==='classic'||dice.includes(value?.die)?valid(value?.die):'classic'};
}
function buy(save,id){
 const item=byId[valid(id)];
 if(item.id!==id||!item.price)throw new Error('That die is not available to buy.');
 if(save.cosmetics.dice.includes(id))throw new Error('That die is already unlocked.');
 if(save.gold<item.price)throw new Error('You need more gold for that die.');
 save.gold-=item.price;save.cosmetics.dice.push(id);save.cosmetics.die=id;
 return item;
}
function equip(save,id){
 if(valid(id)!==id||id!=='classic'&&!save.cosmetics.dice.includes(id))throw new Error('Unlock that die in the Store first.');
 save.cosmetics.die=id;
}
const api={CATALOG,byId,valid,clean,buy,equip};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DelversDice=api;
})(typeof self!=='undefined'?self:globalThis);
