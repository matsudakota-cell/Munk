// One short chase, one passenger. No pathfinding service or shared NPC system.
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export const isCarried=(f,i)=>f.motion.kind==='carry'&&f.motion.player===i;
const free=(x,z,solid,ignoreChair=true)=>Math.abs(x)<46&&Math.abs(z)<43&&
  !(x>19&&x<37&&z>-33&&z<-23)&&
  !solid.some(o=>!(ignoreChair&&o.fishermanAnchor)&&Math.hypot(x-o.x,z-o.z)<o.r+.8);

function move(f,target,speed,solid,remember=true){
  const d=gap(f,target);if(d<.01)return false;
  const angle=Math.atan2(target.x-f.x,target.z-f.z),length=Math.min(d,speed*.125);
  // Small local detours; if scenery traps him he gives up, never walks through it.
  for(const offset of [0,.6,-.6,1.1,-1.1]){
    const facing=angle+offset,x=f.x+Math.sin(facing)*length,z=f.z+Math.cos(facing)*length;
    if(!free(x,z,solid))continue;
    f.x=x;f.z=z;f.facing=facing;f.walk+=length*3;
    if(remember)f.trail.push({x,z});
    return true;
  }
  return false;
}

export function startChase(f,player){
  f.motion={kind:'chase',player,age:0,stuck:0};
  f.trail=[{x:f.x,z:f.z}];
}

function returnHat(f,p,i){
  if(p.heldItem!=='fisherman-hat'||f.hat.heldBy!==i)return;
  p.heldItem=null;f.hat={place:'stool',heldBy:null,x:14,z:37};f.missingNoticed=false;
}

function setDown(f,players,solid){
  const i=f.motion.player,p=players[i],other=players[1-i];
  // Prefer a clear spot beside him; the last safe capture position is a fallback.
  let spot=f.motion.pickup;
  search: for(const radius of [1.5,2.2,3])for(let j=0;j<12;j++){
    const angle=j*Math.PI/6,x=f.x+Math.sin(angle)*radius,z=f.z+Math.cos(angle)*radius;
    if(free(x,z,solid,false)&&gap({x,z},other)>1.2){spot={x,z};break search;}
  }
  Object.assign(p,{x:spot.x,z:spot.z,y:0,vy:0,air:false,land:.36,moving:false});
  f.attention[i]=0;f.noticeCooldown[i]=3;
  f.motion={kind:'rest',player:null,age:0};
}

export function stepFishermanMovement(f,players,solid,anchor){
  const m=f.motion;m.age+=.125;
  if(m.kind==='chase'){
    const p=players[m.player];
    const onHighGround=p&&(p.y>3||(!p.air&&p.y>.4));
    if(!p||m.age>=7||onHighGround||gap(f,anchor)>22||gap(f,p)>18||m.stuck>1){
      f.motion={kind:'rest',player:null,age:0};return;
    }
    // A catch requires the same open ground used by movement, not proximity through scenery.
    if(!p.air&&p.y<.4&&gap(f,p)<1.35&&free((f.x+p.x)/2,(f.z+p.z)/2,solid)){
      f.facing=Math.atan2(p.x-f.x,p.z-f.z);
      returnHat(f,p,m.player);f.attention[m.player]=0;
      f.motion={kind:'carry',player:m.player,age:0,pickup:{x:p.x,z:p.z},
        destination:{x:f.x+Math.sin(f.facing)*3,z:f.z+Math.cos(f.facing)*3}};
    }else{
      m.stuck=move(f,p,4.2,solid)?0:m.stuck+.125;
    }
  }
  if(f.motion.kind==='carry'){
    const carry=f.motion,p=players[carry.player];
    move(f,carry.destination,1.5,solid);
    const lift=smooth(carry.age/.3)*smooth((2.25-carry.age)/.3);
    Object.assign(p,{x:f.x,z:f.z,y:1.65*lift,vy:0,air:false,moving:false});
    if(carry.age>=2.25)setDown(f,players,solid);
  }else if(m.kind==='rest'){
    if(m.age>=2.5)f.motion={kind:'return',player:null,age:0};
  }else if(m.kind==='return'){
    // Retrace the known clear route. No chasing again on the way home.
    while(f.trail.length&&gap(f,f.trail.at(-1))<.01)f.trail.pop();
    const target=f.trail.at(-1)??anchor;
    move(f,target,3,solid,false);
    if(!f.trail.length&&gap(f,anchor)<.15){
      f.x=anchor.x;f.z=anchor.z;f.motion={kind:'idle',player:null,age:0};f.routine=0;
    }
  }
}
