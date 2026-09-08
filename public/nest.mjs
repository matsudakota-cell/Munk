export const NEST={x:-12,z:34,y:5,ladder:{x:-12,z:38}};
export const FINDS=[
  {id:'cushion',name:'cushion',kind:'soft',x:-9,z:21},
  {id:'feather',name:'feather',kind:'soft',x:-17,z:12},
  {id:'shell',name:'pearly shell',kind:'shiny',x:9,z:24},
  {id:'spoon',name:'shiny spoon',kind:'shiny',x:20,z:7},
  {id:'watering-can',name:'watering can',kind:'play',x:-33,z:4},
  {id:'fruit-basket',name:'fruit basket',kind:'play',x:33,z:4},
];
export const NEST_IDS=['fisherman-hat',...FINDS.map(o=>o.id)];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const onNest=p=>Math.abs(p.x-NEST.x)<5&&Math.abs(p.z-NEST.z)<4;
export const insideNest=p=>onNest(p)&&p.y>=NEST.y-.1&&p.y<NEST.y+2.5;
export const nestFloor=p=>onNest(p)&&p.y>NEST.y-.4?NEST.y:0;
export function cleanNestSave(value){
  if(value?.version!==1||!Array.isArray(value.deposited))return {version:1,deposited:[]};
  return {version:1,deposited:NEST_IDS.filter(id=>value.deposited.includes(id))};
}
export function nestSave(s){return {version:1,deposited:[...s.nest.deposited]};}
export function restoreNest(s,saved){
  const data=cleanNestSave(saved);
  s.nest={deposited:data.deposited,revision:0};
  s.finds=FINDS.map(o=>({...o,y:0,heldBy:null,place:data.deposited.includes(o.id)&&o.kind!=='play'?'nest':'world'}));
  if(data.deposited.includes('fisherman-hat')){
    s.fisherman.hat.place='nest';s.fisherman.hat.heldBy=null;s.fisherman.missingNoticed=true;
  }
}
export function nestDisplay(id){
  const slots=[[-3,-2.3],[-2,1.3],[2.8,-1.9],[2.3,1.3],[0,-2.5],[-3,.1],[3,.1]];
  const [x,z]=slots[NEST_IDS.indexOf(id)]??[0,0];
  return {x:NEST.x+x,y:NEST.y+.2,z:NEST.z+z};
}
export function nestWants(s){
  return ['soft','shiny'].map(kind=>({kind,filled:FINDS.some(o=>o.kind===kind&&s.nest.deposited.includes(o.id))}));
}
export function depositAtNest(s,i){
  const p=s.players[i],id=p.heldItem;
  if(!insideNest(p)||!NEST_IDS.includes(id))return false;
  const play=FINDS.find(o=>o.id===id&&o.kind==='play');
  if(s.nest.deposited.includes(id)&&!play)return false;
  const item=id==='fisherman-hat'?s.fisherman.hat:s.finds.find(o=>o.id===id);
  if(item.heldBy!==i)return false;
  item.place='nest';item.heldBy=null;p.heldItem=null;
  if(id==='fisherman-hat')s.fisherman.missingNoticed=true;
  if(!s.nest.deposited.includes(id)){s.nest.deposited.push(id);s.nest.revision++;}
  // The nest keeps this prop; the neighbors put out a spare for future rounds.
  if(play)Object.assign(item,{...play,y:0,place:'world',heldBy:null});
  s.players.forEach(monkey=>monkey.cheer=1.4);
  s.events.push({type:'nest-deposit',id,x:NEST.x,z:NEST.z});
  if(s.events.length>20)s.events.shift();
  return true;
}
export function nestLadderAction(p){
  return distance(p,NEST.ladder)<2.6&&(p.y<1||insideNest(p));
}
export function climbNest(s,i){
  const p=s.players[i];if(!nestLadderAction(p))return false;
  if(insideNest(p))Object.assign(p,{y:0,z:40.7,vy:0,air:false});
  else Object.assign(p,{x:NEST.x+(i?.9:-.9),z:36,y:NEST.y,vy:0,air:false});
  depositAtNest(s,i);return true;
}
export function findAction(s,p){
  if(p.heldItem&&p.heldItem!=='fisherman-hat')return {kind:'drop',item:s.finds.find(o=>o.id===p.heldItem)};
  if(p.heldItem)return null;
  const item=s.finds.filter(o=>o.place==='world'&&Math.abs(p.y-o.y)<1&&distance(p,o)<2.3)
    .sort((a,b)=>distance(p,a)-distance(p,b))[0];
  return item?{kind:'take',item}:null;
}
export function interactFind(s,i){
  const p=s.players[i],action=findAction(s,p);if(!action?.item)return false;
  const item=action.item;
  if(action.kind==='take'){item.place='held';item.heldBy=i;p.heldItem=item.id;depositAtNest(s,i);}
  else{
    item.place='world';item.heldBy=null;item.x=p.x;item.z=p.z;
    // Set down on the surface beneath the monkey, never leave a find floating mid-jump.
    item.y=nestFloor(p)||(p.y>=7&&p.x>-39&&p.x<-19&&p.z>-35&&p.z<-22?7:
      p.x>19&&p.x<37&&p.z>-33&&p.z<-23?.65:0);
    p.heldItem=null;
  }
  return true;
}
export function returnCarriedFind(s,i){
  const p=s.players[i],item=s.finds.find(o=>o.id===p.heldItem);
  if(!item||item.heldBy!==i)return;
  const home=FINDS.find(o=>o.id===item.id);
  Object.assign(item,{x:home.x,z:home.z,y:0,heldBy:null,place:'world'});p.heldItem=null;
}
