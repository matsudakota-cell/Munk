import {isCarried} from './fisherman-movement.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const gusOf=s=>s.owners.find(n=>n.id==='gus');
function say(s,text,n){s.events.push({type:'owner',text,x:n.x,z:n.z});if(s.events.length>20)s.events.shift();}
export function gusShoeAction(s,i){
  const n=gusOf(s),p=s.players[i];if(!n||n.tumble||p.heldItem||p.air||p.y>.5||isCarried(s.fisherman,i))return false;
  // Approach either side to reach the shoes; straight ahead reaches the glasses.
  const facing=n.motion.kind==='idle'?0:n.facing;
  const side=(p.x-n.x)*Math.cos(facing)-(p.z-n.z)*Math.sin(facing);
  return distance(p,n)<2.7&&Math.abs(side)>1.1;
}
export function loosenGusShoes(s,i){
  if(!gusShoeAction(s,i))return false;
  const n=gusOf(s);n.lacesLoose=true;
  say(s,'Loose laces! Give Gus an OOK… or borrow his glasses.',n);return true;
}
export function tumbleGus(s,n){
  if(n.tumble||n.tumbleCooldown>0)return false;
  n.tumble={age:0};n.lacesLoose=false;n.tumbleCooldown=5;
  say(s,'WHOOPS! Gus meant to sit down. Obviously.',n);return true;
}
export function startleGus(s,i){
  const n=gusOf(s),p=s.players[i];if(!n||p.y>2||distance(p,n)>5||isCarried(s.fisherman,i))return;
  tumbleGus(s,n);
}
// Called at the owner's 8 Hz tick. A tumble finishes before another can begin.
export function stepGus(s,n){
  if(n.id!=='gus')return false;
  n.tumbleCooldown=Math.max(0,(n.tumbleCooldown??0)-.125);
  if(!n.tumble&&n.lacesLoose&&n.motion.kind==='chase'&&n.motion.age>.85)tumbleGus(s,n);
  if(!n.tumble)return false;
  n.tumble.age+=.125;
  if(n.tumble.age>=2.75){n.tumble=null;n.reaction=.5;}
  return true;
}
export function gusPose(n,clock){
  const t=(n.tumble?.age??0)+clock;
  if(!n.tumble)return null;
  const down=Math.min(1,Math.max(0,(t-.35)/.4));
  const up=Math.min(1,Math.max(0,(t-1.8)/.9));
  return {tilt:-1.08*down*(1-up),wobble:t<.65?Math.sin(t*26)*.23:0,
    lift:Math.sin(Math.min(1,t/.65)*Math.PI)*.28,arms:-2.2*(1-up),legs:1.15*down*(1-up),
    stars:t>.55&&t<1.85,eyes:t<.65?1.1:.55+.45*up};
}
