import {fishermanFacing,fishermanReactionAge,attentionTier} from './fisherman.mjs';
import {fishermanGesture} from './mimicry.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export function fishermanPose(f){
  const t=f.routine+f.clock;
  const turn=smooth((t-5.5)/.8)*(1-smooth((t-8.3)/.7));
  const a={facing:fishermanFacing(f),headTurn:0,headTilt:Math.sin(t)*.035,
    lean:Math.sin(t*1.5)*.025,eyeOpen:1,brow:0,mouth:.025,
    leftArm:-.65,rightArm:-.85,shrug:0,bounce:0,rod:0,legSwing:0};
  if(f.motion.kind!=='idle'){
    const kind=f.motion.kind,beat=f.motion.age+f.clock;
    if(kind==='rest'){
      a.lean=.32+Math.sin(beat*6)*.06;a.headTilt=.12;
      a.leftArm=-.45;a.rightArm=-.45;a.eyeOpen=.65;
      a.mouth=.08+Math.max(0,Math.sin(beat*6))*.09;
    }else{
      a.legSwing=Math.sin(f.walk)*.5;a.bounce=Math.abs(Math.sin(f.walk))*.08;
      a.lean=kind==='chase'?.15:.05;
      a.leftArm=kind==='carry'?-1.55:Math.sin(f.walk)*.7;
      a.rightArm=kind==='carry'?-1.55:-Math.sin(f.walk)*.7;
      a.mouth=kind==='chase'?.13:.025+Math.max(0,Math.sin(beat*12))*.04;
      a.brow=kind==='chase'?.12:0;
    }
    return a;
  }
  if(!f.reaction){
    const gesture=f.social?.kind??fishermanGesture(f);
    if(gesture){
      const beat=f.social?Math.max(0,f.social.age+f.clock-.6):t-6.4;
      const blend=f.social?smooth(beat/.3)*(1-smooth((beat-2.4)/.5)):smooth(beat/.25);
      a.headTilt=Math.sin(beat*5)*.08*blend;a.mouth=.025+(f.social?.06:0)*blend;
      if(gesture==='wave'){a.rightArm=-2.5*blend;a.shrug=(.3+Math.sin(beat*8)*.18)*blend;}
      if(gesture==='salute'){a.rightArm=-2.35*blend;a.headTilt=-.12*blend;}
      if(gesture==='stretch'){a.leftArm=-2.7*blend;a.rightArm=-2.7*blend;a.lean=-.12*blend;a.eyeOpen=.7;}
      return a;
    }
    if(t>3&&t<4.5)a.rightArm=-.85-Math.sin((t-3)/1.5*Math.PI)*1.3;
    a.headTurn=turn*.5;a.eyeOpen=Math.sin(t*2.2)> .98?.12:1;
    const tier=f.lastNoticed===null?1:attentionTier(f.attention[f.lastNoticed]);
    if(tier>1&&turn>.2){
      a.eyeOpen*=.65;a.headTurn+=Math.sin(t*4)*.18;
      a.brow=-.06;a.mouth=.025+Math.max(0,Math.sin(t*13))*.045;
    }
    return a;
  }
  const age=fishermanReactionAge(f);
  const first=smooth(age/.65),second=smooth((age-1.5)/.45),settle=1-smooth((age-3.8)/1.2);
  // Look, look away, then a bigger second look. A missing hat starts with a pat.
  a.headTurn=(first*.7-smooth((age-.85)/.4)*1.2+second*1.1)*settle;
  a.headTilt=(first*.15-second*.35)*settle;
  a.lean=-second*.23*settle;a.eyeOpen=1+second*.45*settle;
  a.brow=second*.18*settle;a.mouth=.025+second*.18*settle;
  a.leftArm=-.65-second*1.5*settle;a.rightArm=-.85-second*1.3*settle;
  if(f.reaction.kind==='discover_missing'&&age<1.4)a.rightArm=-2.1;
  a.shrug=second*.65*settle;a.bounce=second*.12*settle;a.rod=second*.45*settle;
  const tier=f.reaction.tier??1;
  if(tier===2){
    // Suspicious squint, left-right search, then a little mutter.
    a.headTurn+=Math.sin(age*4)*.22*settle;
    if(age>2.5){a.eyeOpen=.65;a.brow=-.06*settle;a.mouth=.025+Math.max(0,Math.sin(age*15))*.06*settle;}
  }else if(tier===3){
    // Full pantomime: rod droops, both hands fly up, moustache bobs.
    a.leftArm=-.65-second*2.3*settle;a.rightArm=-.85-second*2.1*settle;
    a.shrug=second*.9*settle;a.bounce=second*(.18+Math.abs(Math.sin(age*8))*.12)*settle;
    a.mouth=.025+second*.3*settle;a.eyeOpen=1+second*.6*settle;
    a.headTilt+=Math.sin(age*9)*.16*second*settle;a.rod=second*1.1*settle;
  }
  return a;
}
