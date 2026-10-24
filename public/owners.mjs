import {OWNERS} from './belongings.mjs';
import {moveNpc,isCarried,npcGroundFree} from './fisherman-movement.mjs';
import {alertFishermanTheft} from './fisherman.mjs';
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createOwners(){return OWNERS.map((home,j)=>({...home,home:{x:home.x,z:home.z},previousX:home.x,previousZ:home.z,clock:j*.025,walk:0,facing:0,trail:[],motion:{kind:'idle',age:0},pending:[],reaction:0}));}
function event(s,text,n){s.events.push({type:'owner',text,x:n.x,z:n.z});if(s.events.length>20)s.events.shift();}
function start(n,i,item){
  n.motion={kind:'chase',player:i,item,age:0,stuck:0};n.reaction=.5;
  n.trail.push({x:n.x,z:n.z});
}
export function noticeOwnedPickup(s,item,i){
  if(!item.owner)return;
  if(item.owner==='fisherman'){alertFishermanTheft(s.fisherman,i,item.id);return;}
  const n=s.owners.find(n=>n.id===item.owner);if(!n)return;
  // Keep one current thief; a second theft waits instead of switching blame.
  if(n.motion.kind==='chase'&&n.motion.player!==i){n.pending=n.pending.filter(p=>p.player!==i);n.pending.push({player:i,item:item.id});}
  else start(n,i,item.id);
  event(s,`${n.name}: Hey! That’s mine!`,n);
}
export function stepOwners(s,dt){
  for(const n of s.owners){n.clock+=dt;
    while(n.clock>=.125){n.clock-=.125;n.previousX=n.x;n.previousZ=n.z;n.reaction=Math.max(0,n.reaction-.125);
      if(n.motion.kind!=='chase'&&n.pending.length){const next=n.pending.shift();if(s.players[next.player].heldItem===next.item)start(n,next.player,next.item);}
      const m=n.motion;m.age+=.125;
      if(m.kind==='chase'){
        const p=s.players[m.player],item=s.finds.find(o=>o.id===m.item);
        // Flight has a short grace period so a juggling monkey can keep playing.
        const hasItem=item?.heldBy===m.player||item?.place==='flight';
        if(!hasItem||m.age>10||p.y>3||(!p.air&&p.y>.4)||isCarried(s.fisherman,m.player)||m.stuck>1.5){n.motion={kind:'rest',age:0};continue;}
        if(n.reaction>0){n.facing=Math.atan2(p.x-n.x,p.z-n.z);continue;}
        if(item.heldBy===m.player&&!p.air&&gap(n,p)<1.3&&npcGroundFree((p.x+n.x)/2,(p.z+n.z)/2,s.solid)){
          Object.assign(item,{x:item.homeX,z:item.homeZ,y:0,place:'world',heldBy:null});p.heldItem=null;p.hello=1.5;
          n.motion={kind:'rest',age:0};n.reaction=1.5;
          event(s,`${n.name}: Got it! Try to catch me smiling.`,n);
        }else m.stuck=moveNpc(n,p,6.5,s.solid)?0:m.stuck+.125;
      }else if(m.kind==='rest'){
        if(m.age>=1)n.motion={kind:'return',age:0};
      }else if(m.kind==='return'){
        while(n.trail.length&&gap(n,n.trail.at(-1))<.01)n.trail.pop();
        moveNpc(n,n.trail.at(-1)??n.home,4,s.solid,false);
        if(!n.trail.length&&gap(n,n.home)<.15){n.x=n.home.x;n.z=n.home.z;n.motion={kind:'idle',age:0};}
      }
    }
  }
}
