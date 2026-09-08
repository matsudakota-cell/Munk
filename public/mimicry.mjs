const GESTURES=['wave','stretch','salute'];
const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function fishermanGesture(f){
  if(f.motion.kind!=='idle'||f.reaction||f.social)return null;
  return f.routine>=6.4&&f.routine<8.7?GESTURES[(f.gestureCycle??0)%3]:null;
}
export function monkeyGesture(p,i){
  if(p.air||p.bump>0||p.cheer>0)return null;
  if(p.mimic)return p.mimic.kind;
  if(p.reaction?.kind==='pip_salute')return 'salute';
  if(p.reaction?.kind==='momo_wave')return 'wave';
  if(p.reaction)return null;
  const phase=(p.idle+i*2)%11;
  return p.idle>2.5&&phase>4&&phase<8?(i?'stretch':'salute'):null;
}
export function mimicTarget(s,i){
  const p=s.players[i],friend=s.players[1-i],f=s.fisherman;
  if(p.air||p.bump>0||p.cheer>0||p.mimic||p.reaction||f.motion.kind==='carry'&&f.motion.player===i)return null;
  const kind=fishermanGesture(f);
  if(kind&&gap(p,f)<7&&p.y<2.5)return {kind,source:'fisherman'};
  const buddy=monkeyGesture(friend,1-i);
  return buddy&&gap(p,friend)<7&&Math.abs(p.y-friend.y)<2?{kind:buddy,source:1-i}:null;
}
export function tryMimic(s,i){
  const target=mimicTarget(s,i);if(!target)return false;
  const p=s.players[i];
  p.mimic={...target,duration:2.8,remaining:2.8};p.reaction=null;
  if(target.source==='fisherman')s.fisherman.social={kind:target.kind,age:0,player:i};
  else s.players[target.source].hello=3;
  // Every imitation is a deliberate button press, never an automatic reply chain.
  s.events.push({type:'mimic',player:i,kind:target.kind});
  if(s.events.length>20)s.events.shift();
  return true;
}
export function stepMimicry(s,dt){
  for(const p of s.players){
    if(!p.mimic)continue;
    p.mimic.remaining=Math.max(0,p.mimic.remaining-dt);
    if(!p.mimic.remaining)p.mimic=null;
  }
}
export function applyMonkeyGesture(acting,kind,i,age,blend=1){
  acting.habit=false;acting.greet=false;acting.calling=false;
  acting.eyeOpen=i?.8:1.15;acting.mouthOpen=i?.04:.09;
  acting.headTilt=(i?-.12:.22)*blend;
  const wobble=Math.sin(age*(i?7:12))*blend;
  if(kind==='wave')acting.armPose=[[0,0],[-.25,(i?2.5:2.8)+wobble*(i?.2:.5)]];
  if(kind==='salute'){
    acting.armPose=[[0,0],[-.35,-2.55+wobble*(i?.03:.16)]];
    if(!i){acting.tilt=wobble*.13;acting.earWiggle=.15;}
  }
  if(kind==='stretch'){
    acting.armPose=[[-2.6,-.35],[-2.6,.35]];
    acting.bodyLean=(i?-.08:-.24)*blend;
    acting.tilt=wobble*(i?.04:.2);acting.headNod=-.15*blend;
    if(!i)acting.hop=Math.abs(wobble)*.12;
  }
  acting.armPose=acting.armPose.map(([x,z])=>[x*blend,z*blend]);
  return acting;
}
