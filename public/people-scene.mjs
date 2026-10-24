import {OWNERS} from './belongings.mjs';
import {makeNeighbor,applyNeighborMotion} from './neighbor-rig.mjs';
import {neighborPose} from './neighbor-personality.mjs';
export function buildPeople(h){
  const {group,box,ball,cyl,textSprite,terrainDisc,path}=h;
  const rigs=OWNERS.slice(2).map((n,j)=>makeNeighbor(n,j+2,h));
  terrainDisc(-16,-12,6,'#a4bf77');path([[-9,-8],[-16,-10]],2.5);
  box('#e8aab0',-16,.08,-15,[7,.08,5]);for(let k=0;k<7;k++)box('#f5dbb9',-19+k,.13,-15,[.25,.015,5]);
  textSprite('Poppy’s picnic',-16,4.8,-18,1);
  terrainDisc(16,-14,6,'#d4c48d');path([[8,-8],[16,-12]],2.5);
  textSprite('Dot’s painting patch',16,4.8,-20,1);
  const easel=group(20,0,-17);for(const x of [-.8,.8])box('#a47b50',x,1.5,0,[.15,3,.2],easel);
  box('#f6e5b6',0,2.1,.15,[2.4,2,.12],easel);ball('#82b699',0,2.1,.23,[.8,.7,.035],easel);ball('#e8c660',.65,2.6,.28,[.24,.24,.03],easel);
  for(const x of [12,14]){cyl('#a07e59',x,.25,-18,.35,.5);ball(x===12?'#de806f':'#89b9cd',x,.52,-18,[.3,.04,.3]);}
  return {rigs,animate(s){rigs.forEach((r,j)=>{
    const n=s.owners[j+2],a=neighborPose({reaction:n.reaction,attention:[1,1],target:0},j+2,s.time,false);
    r.body.position.y=a.hop;r.body.rotation.z=a.lean;r.head.rotation.z=a.tilt;r.eyes.forEach(eye=>eye.scale.y=a.eyes);r.mouth.scale.y=a.mouth;
    r.arms.forEach((arm,k)=>arm.rotation.x=a.arms[k]);
    if(n.motion.kind==='idle')r.g.rotation.y=Math.sin(s.time*.7+j)*.2;
    applyNeighborMotion(r,n,s.time);
  });}};
}
