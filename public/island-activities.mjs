import {isCarried} from './fisherman-movement.mjs';

export const NEIGHBORS=[
  {id:'garden',name:'Tilly’s garden',npc:'Tilly',x:-33,z:-2,color:'#a7d77e',hold:{x:-38,z:-3},use:{x:-29,z:-3},item:'watering-can'},
  {id:'market',name:'Bongo’s fruit stand',npc:'Bongo',x:33,z:-2,color:'#ffb278',hold:{x:38,z:-3},use:{x:29,z:-3},item:'fruit-basket'},
];
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const near=(p,q,r=2.2)=>gap(p,q)<r&&p.y<1&&!p.air;
function say(s,text,type='info',n=NEIGHBORS[0]){
  s.events.push({text,type,x:n.x,z:n.z});if(s.events.length>20)s.events.shift();
}
export function createActivities(){return {clock:0,areas:NEIGHBORS.map(()=>({holder:null,anchorDone:false,relayDone:false,passes:0,flight:null,splash:0,npc:{age:0,reaction:0,attention:[0,0],target:0}}))};}
export function activityFloor(p){return p.y>2.6&&Math.abs(p.x+29)<2.2&&Math.abs(p.z+5)<2?3:0;}
export function activityMissions(s){return NEIGHBORS.flatMap((n,j)=>{
  const a=s.activities.areas[j];return [
    {done:a.anchorDone,icon:j?'☂':'❀',short:j?'Make it rain bananas':'Reach the giant flower',progress:a.holder===null?'One holds · one explores':'Your buddy is holding it!',zone:n},
    {done:a.relayDone,icon:j?'🍊':'💧',short:j?'Fruit basket catch':'Watering can catch',progress:`${a.passes}/4 passes · no drops`,zone:n},
  ];
});}
export function reactNeighbor(s,j,i){const npc=s.activities.areas[j].npc;if(npc.reaction>.9)return;npc.attention[i]=Math.min(3,npc.attention[i]+1);npc.target=i;npc.reaction=2.4;}
export function ookNeighbors(s,i){NEIGHBORS.forEach((n,j)=>{if(gap(s.players[i],n)<9)reactNeighbor(s,j,i);});}
export function activityHint(s,i){
  const p=s.players[i];
  if(activityFloor(p))return 'Climb down from the flower';
  for(const [j,n] of NEIGHBORS.entries()){
    const a=s.activities.areas[j];
    if(p.heldItem===n.item&&gap(p,n)<11)return a.flight?'':(near(s.players[1-i],p,7)&&!s.players[1-i].heldItem?'Pass to your buddy':'Toss and catch');
    if(p.heldItem)continue;
    if(near(p,n.hold))return a.holder===i?'Let go · or walk away':j?'Hold the fruit crank':'Hold the flower vine';
    if(near(p,n.use))return a.holder!==null&&a.holder!==i?(j?'Shake down bananas!':'Climb to the giant flower!'):(j?'Wiggle the fruit stand':'Tickle the giant flower');
  }
  return '';
}
export function interactActivity(s,i){
  const p=s.players[i];if(isCarried(s.fisherman,i))return false;
  if(activityFloor(p)){Object.assign(p,{x:-29,z:-1,y:0,vy:0,air:false});return true;}
  for(const [j,n] of NEIGHBORS.entries()){
    const a=s.activities.areas[j],item=s.finds.find(o=>o.id===n.item);
    if(p.heldItem===n.item&&gap(p,n)<11&&!p.air){
      const other=s.players[1-i],partner=near(other,p,7)&&!other.heldItem&&!isCarried(s.fisherman,1-i),target=partner?1-i:i;
      a.flight={age:0,from:i,target,start:{x:p.x,z:p.z},end:{x:s.players[target].x,z:s.players[target].z}};
      item.place='flight';item.heldBy=null;p.heldItem=null;reactNeighbor(s,j,i);
      say(s,partner?'Catch! Your buddy catches automatically.':'A little solo juggle!', 'info',n);return true;
    }
    if(p.heldItem)continue;
    if(near(p,n.hold)){
      if(a.holder!==null&&a.holder!==i){say(s,'Your buddy has this end. Try the other marked spot!','info',n);return true;}
      a.holder=a.holder===i?null:i;
      say(s,a.holder===null?'Let go!':j?'Crank held! Your buddy can shake the stand.':'Vine held! Your buddy can reach the flower.','info',n);return true;
    }
    if(near(p,n.use)){
      const holder=a.holder===null?null:s.players[a.holder];
      const together=holder&&a.holder!==i&&near(holder,n.hold)&&!holder.heldItem&&!isCarried(s.fisherman,a.holder);
      a.splash=3;reactNeighbor(s,j,i);
      if(together){
        if(j===0)Object.assign(p,{x:-29,z:-5,y:3,vy:0,air:false});
        const first=!a.anchorDone;a.anchorDone=true;
        if(first)s.players.forEach(monkey=>monkey.cheer=2.4);
        say(s,j?'Banana shower! Bongo has a very fruity umbrella.':'Flower lookout! Tilly has pollen on her nose.',first?'win':'info',n);
      }else say(s,j?'Wobble wobble! Ask your buddy to hold the crank for a banana shower.':'Achoo! Ask your buddy to hold the vine to climb up.','info',n);
      return true;
    }
    if(item.place==='world'&&near(p,item,2.3)){a.passes=0;reactNeighbor(s,j,i);}
  }
  return false;
}
export function stepActivities(s,dt){
  const activity=s.activities;activity.clock+=dt;
  // State decisions run at 8 Hz; the renderer interpolates the flying props.
  while(activity.clock>=.125){activity.clock-=.125;
    NEIGHBORS.forEach((n,j)=>{
      const a=activity.areas[j],npc=a.npc,item=s.finds.find(o=>o.id===n.item);
      npc.age+=.125;npc.reaction=Math.max(0,npc.reaction-.125);npc.attention=npc.attention.map(v=>Math.max(0,v-.015));a.splash=Math.max(0,a.splash-.125);
      if(a.holder!==null){const p=s.players[a.holder];if(!near(p,n.hold)||p.heldItem||isCarried(s.fisherman,a.holder))a.holder=null;}
      if(!a.flight)return;
      const f=a.flight;f.age+=.125;
      if(f.age<.75)return;
      const p=s.players[f.target];a.flight=null;
      if(near(p,f.end,2)&&!p.heldItem&&!isCarried(s.fisherman,f.target)){
        item.place='held';item.heldBy=f.target;p.heldItem=item.id;
        if(f.from!==f.target){a.passes=Math.min(4,a.passes+1);reactNeighbor(s,j,f.target);
          if(a.passes===4){const first=!a.relayDone;a.relayDone=true;a.splash=4;if(first)s.players.forEach(monkey=>monkey.cheer=2.4);say(s,j?'Four fruity catches! Bongo bows to the banana champions.':'Four splashy catches! Tilly does her watering-can dance.',first?'win':'info',n);}
          else say(s,`${a.passes} of 4! Pass it back whenever you like.`,'info',n);
        }
      }else{item.place='world';item.heldBy=null;Object.assign(item,{...f.end,y:0});a.passes=0;a.splash=1.5;say(s,j?'Plop! Pick it up for another fruity round.':'Splosh! Pick it up and have another go.','info',n);}
    });
  }
}
