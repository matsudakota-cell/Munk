export const FISHERMAN={x:12,z:36};
export const HAT_HOME={x:14,z:37};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export function fishermanFacing(f){
  const t=f.routine+f.clock;
  return Math.PI*(1-smooth((t-5.5)/.8)*(1-smooth((t-8.3)/.7)));
}

export function createFisherman(){
  return {routine:0,clock:0,reaction:null,missingNoticed:false,
    hat:{place:'stool',heldBy:null,x:HAT_HOME.x,z:HAT_HOME.z}};
}

export function fishermanSees(f,p){
  // The fishing beat faces the pond; the shoreward glance is easy to read.
  const facing=fishermanFacing(f);
  const dx=p.x-FISHERMAN.x,dz=p.z-FISHERMAN.z,d=distance(p,FISHERMAN);
  return p.y<2.5&&d<7&&(dx*Math.sin(facing)+dz*Math.cos(facing))>d*.25;
}

export function hatAction(f,p,i){
  if(p.heldItem==='fisherman-hat')return distance(p,HAT_HOME)<2.5&&p.y<1?'return':'drop';
  if(f.hat.heldBy===null&&distance(p,f.hat)<2.5&&p.y<1)return 'take';
  return null;
}

export function interactHat(f,p,i){
  const action=hatAction(f,p,i);
  if(!action)return false;
  if(action==='take'){
    const seen=fishermanSees(f,p);
    f.hat.place='held';f.hat.heldBy=i;p.heldItem='fisherman-hat';
    if(seen&&!f.reaction){f.reaction={kind:'double_take',age:0,startFacing:fishermanFacing(f)};f.missingNoticed=true;}
  }else{
    p.heldItem=null;f.hat.heldBy=null;
    f.hat.place=action==='return'?'stool':'ground';
    f.hat.x=action==='return'?HAT_HOME.x:p.x;
    f.hat.z=action==='return'?HAT_HOME.z:p.z;
    if(action==='return')f.missingNoticed=false;
  }
  return true;
}

export function stepFisherman(f,dt){
  // Decisions run at 8 Hz. Rendering interpolates the authored acting beats.
  f.clock+=dt;
  while(f.clock>=.125){
    f.clock-=.125;
    if(f.reaction){
      f.reaction.age+=.125;
      if(f.reaction.age>=5){f.reaction=null;f.routine=0;}
      continue;
    }
    f.routine=(f.routine+.125)%9;
    if(f.routine>=6.25&&f.hat.place!=='stool'&&!f.missingNoticed){
      f.reaction={kind:'discover_missing',age:0,startFacing:fishermanFacing(f)};f.missingNoticed=true;
    }
  }
}
