import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,jump,interact,ook,missions} from '../public/game-core.mjs';
import {startChase,isCarried} from '../public/fisherman-movement.mjs';
import {FISHERMAN} from '../public/fisherman.mjs';
const advance=(s,n,axes=[[0,0],[0,0]])=>{for(let t=0;t<n;t+=.025)step(s,.025,axes)};
function ready(){const s=createState();Object.assign(s.players[0],{x:12,z:37,y:0});return s;}

test('repeat theft interrupts rest or returning instead of being forgotten',()=>{
 for(const kind of ['rest','return']){
  const s=ready(),f=s.fisherman;Object.assign(s.players[0],{x:14,z:37});
  f.motion={kind,player:null,age:0};f.facing=0;
  f.trail=[{x:12,z:36},{x:12,z:37}];
  interact(s,0);assert.equal(f.reaction?.player,0);assert.equal(f.reaction?.tier,3);
  advance(s,1.25);assert.equal(f.motion.kind,'chase');
  assert.equal(f.trail[0].z,36,'return route is retained');
  advance(s,20);assert.equal(f.motion.kind,'idle');assert.equal(f.hat.place,'stool');
 }
});

test('five complete hat theft and catch cycles remain repeatable',()=>{
 const s=ready(),f=s.fisherman;
 for(let cycle=0;cycle<5;cycle++){
  Object.assign(s.players[0],{x:14,z:37,y:0,air:false});f.routine=7;
  interact(s,0);advance(s,1.25);assert.equal(f.motion.kind,'chase');
  advance(s,20);assert.equal(f.motion.kind,'idle');assert.equal(f.hat.place,'stool');
  assert.equal(f.trail.length,0);assert.equal(f.pendingTheft,null);
 }
});

test('a theft seen during a carry waits for release and never swaps the passenger',()=>{
 const s=ready(),f=s.fisherman;startChase(f,0);advance(s,.15);
 assert(isCarried(f,0));f.facing=0;
 Object.assign(s.players[1],{x:14,z:37});interact(s,1);
 assert.equal(f.pendingTheft,1);assert(isCarried(f,0));assert(!isCarried(f,1));
 advance(s,2.4);assert(!isCarried(f,0));assert.equal(f.reaction?.player,1);
 assert.equal(s.players[0].y,0);
 advance(s,1.25);assert.equal(f.motion.player,1);
});

test('one witnessed theft interrupts mimicry and starts a faster chase without extra antics',()=>{
 const s=ready(),f=s.fisherman;Object.assign(s.players[0],{x:14,z:37});
 f.routine=7;f.social={kind:'wave',age:.5,player:1};f.noticeCooldown[0]=.6;
 interact(s,0);assert.equal(f.social,null);assert.equal(f.reaction.tier,3);
 assert.equal(f.reaction.duration,1.25);assert.equal(f.attention[1],0);
 s.players[0].x=18;advance(s,1.25);assert.equal(f.motion.kind,'chase');
 const start={x:f.x,z:f.z};advance(s,.25);
 assert(Math.hypot(f.x-start.x,f.z-start.z)>1.4,'run speed exceeds the former slow jog');
});

test('exasperated performance ends in a chase of only its own monkey',()=>{
 const s=ready();s.fisherman.reaction={kind:'mischief',tier:3,player:0,age:4.875,startFacing:0};
 advance(s,.125);assert.equal(s.fisherman.motion.kind,'chase');assert.equal(s.fisherman.motion.player,0);
});

test('catch carries a short distance, returns only that hat, preserves missions and frees partner',()=>{
 const s=ready(),f=s.fisherman,p=s.players[0];
 p.heldItem='fisherman-hat';f.hat.place='held';f.hat.heldBy=0;f.attention=[80,31];
 s.bells=[true,true];s.band=2;s.bandPlayers=[0,1];
 const before=missions(s),partnerX=s.players[1].x;
 startChase(f,0);advance(s,.15);assert(isCarried(f,0));assert(!isCarried(f,1));
 assert.equal(p.heldItem,null);assert.equal(f.hat.place,'stool');assert.equal(f.attention[0],0);
 const pickup={x:p.x,z:p.z};jump(s,0);interact(s,0);ook(s,0);
 advance(s,.5,[[1,0],[1,0]]);assert.equal(p.y,1.65);assert(s.players[1].x>partnerX);
 advance(s,2);assert(!isCarried(f,0));assert.equal(p.y,0);
 assert(Math.hypot(p.x-pickup.x,p.z-pickup.z)<6);
 assert.deepEqual(missions(s),before);assert(f.attention[1]>25);
 jump(s,0);advance(s,.1);assert(p.y>0,'movement resumes immediately');
 advance(s,15);assert.equal(f.motion.kind,'idle');assert.equal(f.x,FISHERMAN.x);assert.equal(f.z,FISHERMAN.z);
});

test('vertical escape and running away give up; the other monkey cannot be substituted',()=>{
 const s=ready(),f=s.fisherman;
 Object.assign(s.players[0],{x:12,z:38,y:7,vy:0});Object.assign(s.players[1],{x:12,z:36});
 startChase(f,0);advance(s,.15);assert.equal(f.motion.kind,'rest');assert.equal(s.players[1].y,0);
 advance(s,4);assert.equal(f.motion.kind,'idle');
 s.players[0].y=0;s.players[0].z=40;startChase(f,0);
 advance(s,8,[[1,0],[0,0]]);assert.notEqual(f.motion.kind,'chase');assert(!isCarried(f,1));
});

test('obstacles stop a catch through scenery and return retraces clear ground',()=>{
 const s=ready(),f=s.fisherman;
 s.solid=[{x:12,z:37.5,r:.5,h:3}];s.players[0].z=39;
 startChase(f,0);
 for(let i=0;i<320;i++){
  step(s,.025,[[0,0],[0,0]]);
  assert(Math.hypot(f.x-12,f.z-37.5)>=1.29,'fisherman respects obstacle radius');
 }
 advance(s,20);assert.equal(f.motion.kind,'idle');
});

test('catching an empty-handed monkey leaves the partner hat untouched',()=>{
 const s=ready(),f=s.fisherman;s.players[1].heldItem='fisherman-hat';f.hat.place='held';f.hat.heldBy=1;
 startChase(f,0);advance(s,3);
 assert.equal(s.players[1].heldItem,'fisherman-hat');assert.equal(f.hat.heldBy,1);
});

test('ordinary jumps do not cancel a chase or permit a catch in midair',()=>{
 const s=ready(),f=s.fisherman;startChase(f,0);jump(s,0);
 advance(s,.4);assert.equal(f.motion.kind,'chase');assert(s.players[0].y>.8);
 advance(s,.2);assert.equal(f.motion.kind,'chase');
 advance(s,.7);assert.equal(f.motion.kind,'carry','he can catch after landing');
});

test('jumping with a stolen hat is noticed during flight and leads to real pursuit',()=>{
 const s=ready(),f=s.fisherman;Object.assign(s.players[0],{x:14,z:37});
 interact(s,0);assert.equal(f.reaction,null,'theft was unseen');
 let pursuitTicks=0;
 for(let n=0;n<1200;n++){
  if(n%40===0)jump(s,0);
  step(s,.025,[[0,0],[0,0]]);
  if(f.motion.kind==='chase')pursuitTicks++;
 }
 assert(pursuitTicks>=12,'ordinary hopping produces a visible chase, not an immediate give-up');
});
