// Shared character acting rules: pure poses keep expressions consistent at any frame rate.
export const PERSONALITIES=[{name:'Pip',trait:'The little show-off',fur:'#a27646',skin:'#f0c896',scarf:'#f1c453'},{name:'Momo',trait:'The cuddly daydreamer',fur:'#826751',skin:'#efd7b1',scarf:'#8ecddf'}];
export function pose(p,i,t){
 const bump=Math.max(0,p.bump||0),land=Math.max(0,p.land||0),cheer=Math.max(0,p.cheer||0),hello=Math.max(0,p.hello||0),idle=p.idle||0;
 const bonk=bump>0,celebrate=cheer>0,greet=hello>0,calling=p.ook>0,air=p.air;
 const idlePhase=(idle+i*2)%11,habit=idle>2.5&&idlePhase>4&&idlePhase<8;
 const blinkPhase=(t+i*1.7)%4.6,blink=blinkPhase<.13?Math.max(.06,Math.abs(blinkPhase-.065)/.065):1;
 const squash=land>0?Math.sin(Math.min(1,land/.36)*Math.PI)*.26:0;
 const acting={expression:bonk?'bonk':celebrate?'delight':calling?'ook':air?'surprise':greet?'love':habit?(i?'dreamy':'cheeky'):'happy',
 scaleY:bonk?1-.16*Math.sin(bump*17):air?1.10:1-squash,scaleX:bonk?1+.09*Math.sin(bump*17):air?.95:1+squash*.6,
 tilt:bonk?Math.sin(bump*22)*bump*.24:habit?(i?Math.sin(t*2)*.1:-.13):0,
 headTilt:bonk?Math.sin(bump*18)*.26:greet?(i?-.18:.18):habit?(i?.18:-.19):Math.sin(t*1.8+i)*.035,
 eyeOpen:bonk?.12:celebrate?.24:calling?1.05:air?1.3:habit&&i?.38:blink,
 browLift:bonk?.13:air?.17:calling?.11:celebrate?.06:0,
 mouthOpen:calling?.13+Math.sin(t*18)*.035:bonk?.13:air?.11:celebrate?.17:0,
 habit,cheer:celebrate,greet,bonk,calling,air,
 hop:celebrate?Math.abs(Math.sin((2.4-cheer)*8))*.25:0,
 spin:celebrate&&!i?Math.min(1,(2.4-cheer)/1.4)*Math.PI*2:0,
 reactionKind:null,reactionAge:0,armPose:null,bodyLean:0,headNod:0,earWiggle:0,tailSwing:0,replying:false,
 };
 const r=p.reaction;
 // Physical reactions stay readable. A social beat never changes the simulation.
 if(!r||bonk||celebrate||air)return acting;
 const age=r.duration-r.remaining;
 if(age<.15)return acting;
 const blend=Math.min(1,(age-.15)/.18,r.remaining/.28);
 const beat=age-.15,startled=i===1&&r.kind!=='momo_missed'&&beat<.38;
 acting.reactionKind=r.kind;acting.reactionAge=age;
 acting.habit=false;acting.greet=false;acting.calling=false;acting.mouthOpen=0;
 acting.expression=startled?'surprise':r.kind==='momo_missed'?'dreamy':i?'delight':'cheeky';
 acting.armPose=[[0,0],[0,0]];
 if(startled){
   acting.eyeOpen=1.35;acting.browLift=.17*blend;acting.mouthOpen=.12*blend;
   acting.headNod=-.18*blend;acting.hop=Math.sin(beat/.38*Math.PI)*.13;
   acting.armPose=[[-.6,-.8],[-.6,.8]];
 }else{
   switch(r.kind){
     case 'pip_bow': {
       const bow=Math.sin(Math.min(1,Math.max(0,beat-.15)/1.25)*Math.PI);
       acting.bodyLean=bow*.68;acting.headNod=bow*.18;
       acting.eyeOpen=blink*(1-bow*.55);acting.headTilt=-.1*blend;
       acting.armPose=[[-.6,.6],[.4,-.55]];break;
     }
     case 'pip_salute':
       acting.eyeOpen=blink;acting.headTilt=.14*blend;
       acting.armPose=[[0,-.18],[-.38,-2.55+Math.sin(beat*7)*.06]];
       acting.earWiggle=.12*blend;break;
     case 'pip_dance':
       acting.tilt=Math.sin(beat*10)*.17*blend;
       acting.hop=Math.abs(Math.sin(beat*8))*.13*blend;
       acting.eyeOpen=.35;acting.mouthOpen=.09*blend;
       acting.armPose=[[-1.8,-.55+Math.sin(beat*10)*.35],[-1.8,.55+Math.sin(beat*10)*.35]];
       acting.tailSwing=.2*blend;break;
     case 'pip_echo':
       acting.bodyLean=-.17*blend;acting.scaleX=1+.1*blend;
       acting.eyeOpen=1.2;acting.browLift=.12*blend;
       acting.replying=age>=.55&&age<1.25;
       acting.mouthOpen=acting.replying?(.18+Math.sin(beat*22)*.035)*blend:.02;
       acting.armPose=[[-1.4,.35],[-1.4,-.35]];acting.earWiggle=.17*blend;break;
     case 'momo_giggle':
       acting.eyeOpen=.22;acting.headTilt=Math.sin(beat*11)*.11*blend;
       acting.mouthOpen=(.1+Math.sin(beat*14)*.035)*blend;
       acting.bodyLean=.12*blend;acting.armPose=[[-1.7,.35],[-1.7,-.35]];
       acting.hop=Math.abs(Math.sin(beat*11))*.055*blend;break;
     case 'momo_wave':
       acting.eyeOpen=blink*.8;acting.headTilt=-.18*blend;
       acting.armPose=[[0,.15],[-.2,2.6+Math.sin(beat*11)*.28]];
       acting.tailSwing=.13*blend;break;
     case 'momo_clap':
       acting.eyeOpen=.3;acting.mouthOpen=.1*blend;
       acting.armPose=[[-1.5,.45+Math.sin(beat*13)*.25],[-1.5,-.45-Math.sin(beat*13)*.25]];
       acting.hop=Math.abs(Math.sin(beat*7))*.12*blend;break;
     case 'momo_missed':
       acting.eyeOpen=.3+.08*Math.sin(beat*2);
       acting.headTilt=.23*blend;acting.headNod=-.12*blend;
       acting.mouthOpen=0;acting.armPose=[[-.9,.25],[-.9,-.25]];
       acting.tilt=Math.sin(beat*2)*.07*blend;break;
   }
 }
 acting.armPose=acting.armPose.map(([x,z])=>[x*blend,z*blend]);
 return acting;
}
