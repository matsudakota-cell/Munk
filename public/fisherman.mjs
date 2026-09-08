import {startChase,stepFishermanMovement} from './fisherman-movement.mjs';
export const FISHERMAN={x:12,z:36};
export const HAT_HOME={x:14,z:37};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export const fishermanReactionAge=f=>(f.reaction.age+f.clock)*5/(f.reaction.duration??5);
export function fishermanFacing(f){
  if(f.motion.kind!=='idle')return f.facing;
  if(f.social&&!f.reaction)return 0;
  if(f.reaction){
    const age=fishermanReactionAge(f);
    return (f.reaction.startFacing??0)*(1-smooth(age/.65))+Math.PI*smooth(age-4);
  }
  const t=f.routine+f.clock;
  return Math.PI*(1-smooth((t-5.5)/.8)*(1-smooth((t-8.3)/.7)));
}

export function createFisherman(){
  return {routine:0,clock:0,reaction:null,missingNoticed:false,gestureCycle:0,social:null,pendingTheft:null,
    x:FISHERMAN.x,z:FISHERMAN.z,previousX:FISHERMAN.x,previousZ:FISHERMAN.z,facing:Math.PI,walk:0,
    motion:{kind:'idle',player:null,age:0},trail:[],
    attention:[0,0],noticeCooldown:[0,0],seenJump:[0,0],lastNoticed:null,
    hat:{place:'stool',heldBy:null,x:HAT_HOME.x,z:HAT_HOME.z}};
}

export const attentionTier=value=>value>=55?3:value>=22?2:1;

export function noticeMischief(f,p,i,kind){
  // Only the monkey doing the witnessed action earns attention. Possession,
  // proximity and a missing hat never assign another monkey's actions to them.
  if(f.motion.kind!=='idle'||!fishermanSees(f,p)||f.noticeCooldown[i]>0)return false;
  const gain={ook:12,jump:12,hat:60}[kind];
  if(!gain)return false;
  f.attention[i]=Math.min(100,f.attention[i]+gain);
  f.noticeCooldown[i]=.7;f.lastNoticed=i;
  const tier=attentionTier(f.attention[i]);
  if(f.reaction){
    // Let a joke finish. Only its own performer can enlarge the current beat.
    if(f.reaction.player===i)f.reaction.tier=Math.max(f.reaction.tier??1,tier);
  }else if(tier>1){
    f.reaction={kind:'mischief',age:0,startFacing:fishermanFacing(f),player:i,tier};
  }
  return true;
}

export function fishermanSees(f,p){
  // The fishing beat faces the pond; the shoreward glance is easy to read.
  const facing=fishermanFacing(f);
  const dx=p.x-f.x,dz=p.z-f.z,d=distance(p,f);
  return p.y<2.5&&d<7&&(dx*Math.sin(facing)+dz*Math.cos(facing))>d*.25;
}

export function hatAction(f,p,i){
  if(f.hat.place==='nest'||(p.heldItem&&p.heldItem!=='fisherman-hat'))return null;
  if(p.heldItem==='fisherman-hat')return distance(p,HAT_HOME)<2.5&&p.y<1?'return':'drop';
  if(f.hat.heldBy===null&&distance(p,f.hat)<2.5&&p.y<1)return 'take';
  return null;
}

function reactToTheft(f,i){
  const startFacing=fishermanFacing(f);
  f.motion={kind:'idle',player:null,age:0};
  f.attention[i]=Math.min(100,f.attention[i]+60);f.noticeCooldown[i]=.7;f.lastNoticed=i;
  f.social=null;f.pendingTheft=null;
  f.reaction={kind:'double_take',age:0,duration:1.25,startFacing,player:i,tier:3};
  f.missingNoticed=true;
}

export function interactHat(f,p,i){
  const action=hatAction(f,p,i);
  if(!action)return false;
  if(action==='take'){
    const seen=fishermanSees(f,p);
    f.hat.place='held';f.hat.heldBy=i;p.heldItem='fisherman-hat';
    if(seen){
      // Recovery is interruptible. A pursuit or carry must finish safely first;
      // remember the witnessed action without swapping its current target.
      if(f.motion.kind==='chase'||f.motion.kind==='carry')f.pendingTheft=i;
      else reactToTheft(f,i);
    }
  }else{
    p.heldItem=null;f.hat.heldBy=null;
    f.hat.place=action==='return'?'stool':'ground';
    f.hat.x=action==='return'?HAT_HOME.x:p.x;
    f.hat.z=action==='return'?HAT_HOME.z:p.z;
    if(action==='return'){f.missingNoticed=false;f.pendingTheft=null;}
  }
  return true;
}

export function stepFisherman(f,dt,players=[],solid=[]){
  // Decisions run at 8 Hz. Rendering interpolates the authored acting beats.
  f.clock+=dt;
  while(f.clock>=.125){
    f.clock-=.125;
    f.previousX=f.x;f.previousZ=f.z;
    for(let i=0;i<2;i++){
      f.noticeCooldown[i]=Math.max(0,f.noticeCooldown[i]-.125);
      f.attention[i]=Math.max(0,f.attention[i]-.125*.9);
    }
    if(f.pendingTheft!==null&&f.motion.kind!=='chase'&&f.motion.kind!=='carry'){
      const thief=f.pendingTheft;
      f.pendingTheft=null;
      if(f.hat.place==='held'&&f.hat.heldBy===thief)reactToTheft(f,thief);
    }
    if(f.motion.kind!=='idle'){
      f.social=null;
      stepFishermanMovement(f,players,solid,FISHERMAN);continue;
    }
    // Notice a jump anywhere in its visible flight, once per jump. Looking up
    // halfway through an antic should count just as much as seeing takeoff.
    players.forEach((p,i)=>{
      if(p.air&&p.jumpSerial>f.seenJump[i]&&noticeMischief(f,p,i,'jump'))f.seenJump[i]=p.jumpSerial;
    });
    if(f.reaction){
      f.social=null;
      f.reaction.age+=.125;
      if(f.reaction.age>=(f.reaction.duration??5)){
        const r=f.reaction;f.facing=fishermanFacing(f);f.reaction=null;f.routine=0;
        if(r.tier===3&&players[r.player])startChase(f,r.player);
      }
      continue;
    }
    if(f.social){
      f.social.age+=.125;
      if(f.social.age>=3.5){f.social=null;f.routine=8.7;}
      continue;
    }
    if(f.routine+.125>=9)f.gestureCycle++;
    f.routine=(f.routine+.125)%9;
    if(f.routine>=6.25&&f.hat.place!=='stool'&&!f.missingNoticed){
      f.reaction={kind:'discover_missing',age:0,startFacing:fishermanFacing(f)};f.missingNoticed=true;
    }
  }
}
