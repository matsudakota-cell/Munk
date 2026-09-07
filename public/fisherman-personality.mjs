import {fishermanFacing} from './fisherman.mjs';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
export function fishermanPose(f){
  const t=f.routine+f.clock;
  const turn=smooth((t-5.5)/.8)*(1-smooth((t-8.3)/.7));
  const a={facing:fishermanFacing(f),headTurn:0,headTilt:Math.sin(t)*.035,
    lean:Math.sin(t*1.5)*.025,eyeOpen:1,brow:0,mouth:.025,
    leftArm:-.65,rightArm:-.85,shrug:0,bounce:0,rod:0};
  if(!f.reaction){
    if(t>3&&t<4.5)a.rightArm=-.85-Math.sin((t-3)/1.5*Math.PI)*1.3;
    a.headTurn=turn*.5;a.eyeOpen=Math.sin(t*2.2)> .98?.12:1;
    return a;
  }
  const age=f.reaction.age+f.clock;
  const first=smooth(age/.65),second=smooth((age-1.5)/.45),settle=1-smooth((age-3.8)/1.2);
  a.facing=(f.reaction.startFacing??0)*(1-first)+Math.PI*smooth((age-4)/1);
  // Look, look away, then a bigger second look. A missing hat starts with a pat.
  a.headTurn=(first*.7-smooth((age-.85)/.4)*1.2+second*1.1)*settle;
  a.headTilt=(first*.15-second*.35)*settle;
  a.lean=-second*.23*settle;a.eyeOpen=1+second*.45*settle;
  a.brow=second*.18*settle;a.mouth=.025+second*.18*settle;
  a.leftArm=-.65-second*1.5*settle;a.rightArm=-.85-second*1.3*settle;
  if(f.reaction.kind==='discover_missing'&&age<1.4)a.rightArm=-2.1;
  a.shrug=second*.65*settle;a.bounce=second*.12*settle;a.rod=second*.45*settle;
  return a;
}
