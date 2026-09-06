// Shared character acting rules: pure poses keep expressions consistent at any frame rate.
export const PERSONALITIES=[{name:'Pip',trait:'The little show-off',fur:'#a27646',skin:'#f0c896',scarf:'#f1c453'},{name:'Momo',trait:'The cuddly daydreamer',fur:'#826751',skin:'#efd7b1',scarf:'#8ecddf'}];
export function pose(p,i,t){
 const bump=Math.max(0,p.bump||0),land=Math.max(0,p.land||0),cheer=Math.max(0,p.cheer||0),hello=Math.max(0,p.hello||0),idle=p.idle||0;
 const bonk=bump>0,celebrate=cheer>0,greet=hello>0,calling=p.ook>0,air=p.air;
 const idlePhase=(idle+i*2)%11,habit=idle>2.5&&idlePhase>4&&idlePhase<8;
 const blinkPhase=(t+i*1.7)%4.6,blink=blinkPhase<.13?Math.max(.06,Math.abs(blinkPhase-.065)/.065):1;
 const squash=land>0?Math.sin(Math.min(1,land/.36)*Math.PI)*.26:0;
 return {expression:bonk?'bonk':celebrate?'delight':calling?'ook':air?'surprise':greet?'love':habit?(i?'dreamy':'cheeky'):'happy',
 scaleY:bonk?1-.16*Math.sin(bump*17):air?1.10:1-squash,scaleX:bonk?1+.09*Math.sin(bump*17):air?.95:1+squash*.6,
 tilt:bonk?Math.sin(bump*22)*bump*.24:habit?(i?Math.sin(t*2)*.1:-.13):0,
 headTilt:bonk?Math.sin(bump*18)*.26:greet?(i?-.18:.18):habit?(i?.18:-.19):Math.sin(t*1.8+i)*.035,
 eyeOpen:bonk?.12:celebrate?.24:calling?1.05:air?1.3:habit&&i?.38:blink,
 browLift:bonk?.13:air?.17:calling?.11:celebrate?.06:0,
 mouthOpen:calling?.13+Math.sin(t*18)*.035:bonk?.13:air?.11:celebrate?.17:0,
 habit,cheer:celebrate,greet,bonk,calling,air,
 hop:celebrate?Math.abs(Math.sin((2.4-cheer)*8))*.25:0,
 spin:celebrate&&!i?Math.min(1,(2.4-cheer)/1.4)*Math.PI*2:0,
 };
}
