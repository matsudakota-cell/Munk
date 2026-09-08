import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,ook,jump,interact,missions,DRUMS} from '../public/game-core.mjs';
import {mimicTarget,fishermanGesture} from '../public/mimicry.mjs';
import {pose} from '../public/monkey-personality.mjs';
import {fishermanPose} from '../public/fisherman-personality.mjs';
const advance=(s,n,axes=[[0,0],[0,0]])=>{for(let t=0;t<n;t+=.025)step(s,.025,axes)};
function nearFisherman(){const s=createState();Object.assign(s.players[0],{x:14,z:38});s.fisherman.routine=6.5;return s;}

test('each fisherman gesture can be copied and answered without attention or mission rewards',()=>{
 for(const [cycle,kind] of ['wave','stretch','salute'].entries()){
  const s=nearFisherman(),before=missions(s);s.fisherman.gestureCycle=cycle;
  assert.equal(fishermanGesture(s.fisherman),kind);ook(s,0);
  assert.equal(s.players[0].mimic.kind,kind);assert.equal(s.fisherman.social.kind,kind);
  advance(s,1);assert(fishermanPose(s.fisherman).rightArm<-1);
  assert.deepEqual(s.fisherman.attention,[0,0]);assert.deepEqual(missions(s),before);
  const social=s.fisherman.social;ook(s,0);assert.equal(s.fisherman.social,social,'spam does not restart the reply');
  advance(s,4);assert.equal(s.players[0].mimic,null);assert.equal(s.fisherman.social,null);
 }
});

test('Pip copies Momo with an exaggerated pose, and copying requires an explicit press',()=>{
 const s=createState();s.players.forEach(p=>p.z=20);s.players[1].idle=4;
 assert.equal(mimicTarget(s,0).source,1);ook(s,0);advance(s,.6);
 assert.equal(s.players[0].mimic.kind,'stretch');
 const pip=pose(s.players[0],0,s.time),momo=pose(s.players[1],1,s.time);
 assert(Math.abs(pip.bodyLean)>Math.abs(momo.bodyLean));assert(s.players[1].hello>0);
 s.events.length=0;advance(s,20);
 assert.equal(s.events.filter(e=>e.type==='mimic').length,0);
});

test('range, height and unfinished physical or social reactions retain ordinary ook behavior',()=>{
 const s=nearFisherman();s.players[0].x=30;assert.equal(mimicTarget(s,0),null);
 s.players[0].x=14;s.players[0].y=7;assert.equal(mimicTarget(s,0),null);
 s.players[0].y=0;s.players[0].reaction={kind:'pip_bow',duration:2,remaining:2};
 assert.equal(mimicTarget(s,0),null);const r=s.players[0].reaction;ook(s,0);assert.equal(s.players[0].reaction,r);
 s.fisherman.motion.kind='chase';assert.equal(fishermanGesture(s.fisherman),null);
});

test('movement, jumps and mission interactions work throughout an imitation; restart clears it',()=>{
 const s=nearFisherman();ook(s,0);const x=s.players[0].x;
 advance(s,.2,[[1,0],[0,0]]);assert(s.players[0].x>x);
 jump(s,0);advance(s,.2);assert(s.players[0].y>0);
 Object.assign(s.players[0],{...DRUMS[0],y:0,air:false,vy:0});interact(s,0);assert.equal(s.band,1);
 assert(!createState().players[0].mimic);assert.equal(createState().fisherman.social,null);
});

test('idle fisherman cycles gestures and high attention still leads to a chase',()=>{
 const s=createState(),seen=new Set();
 for(let n=0;n<1200;n++){step(s,.025,[]);const g=fishermanGesture(s.fisherman);if(g)seen.add(g);}
 assert.equal(seen.size,3);
 s.fisherman.reaction={kind:'mischief',player:0,tier:3,age:4.875,startFacing:0};
 advance(s,.125);assert.equal(s.fisherman.motion.kind,'chase');assert.equal(s.fisherman.social,null);
});
