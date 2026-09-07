import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,interact,step,jump,ook,missions} from '../public/game-core.mjs';
import {fishermanSees,FISHERMAN} from '../public/fisherman.mjs';
import {fishermanPose} from '../public/fisherman-personality.mjs';
const advance=(s,n)=>{for(let t=0;t<n;t+=.025)step(s,.025,[[0,0],[0,0]])};
function setup(){const s=createState();Object.assign(s.players[0],{x:14,z:37});return s;}

test('seen theft double-takes immediately; unseen theft waits for a shoreward glance',()=>{
 const s=setup(),f=s.fisherman;
 f.routine=7;assert(fishermanSees(f,s.players[0]));interact(s,0);
 assert.equal(f.reaction.kind,'double_take');
 advance(s,5.5);assert.equal(f.reaction,null);
 const sneaky=setup();interact(sneaky,0);assert.equal(sneaky.fisherman.reaction,null);
 advance(sneaky,5);assert.equal(sneaky.fisherman.reaction,null);
 advance(sneaky,1.5);assert.equal(sneaky.fisherman.reaction.kind,'discover_missing');
 advance(sneaky,20);assert.equal(sneaky.fisherman.reaction,null,'does not rediscover forever');
});

test('one hat can be returned, dropped, picked up by the partner and replayed',()=>{
 const s=setup();interact(s,0);assert.equal(s.players[0].heldItem,'fisherman-hat');
 Object.assign(s.players[1],{x:14,z:37});interact(s,1);assert.equal(s.players[1].heldItem,null);
 Object.assign(s.players[0],{x:20,z:39});interact(s,0);assert.equal(s.fisherman.hat.place,'ground');
 Object.assign(s.players[1],{x:20,z:39});interact(s,1);assert.equal(s.fisherman.hat.heldBy,1);
 Object.assign(s.players[1],{x:14,z:37});interact(s,1);assert.equal(s.fisherman.hat.place,'stool');
 s.fisherman.routine=7;interact(s,1);assert.equal(s.fisherman.reaction.kind,'double_take');
});

test('range, height and direction apply; hat never gates controls or adds progress',()=>{
 const s=setup(),before=missions(s);s.players[0].y=7;interact(s,0);assert.equal(s.fisherman.hat.place,'stool');
 s.players[0].y=0;s.players[0].x=22;interact(s,0);assert.equal(s.fisherman.hat.place,'stool');
 s.players[0].x=14;interact(s,0);jump(s,0);ook(s,0);step(s,.04,[[1,0],[0,0]]);
 assert(s.players[0].x>14&&s.players[0].y>0&&s.players[0].ook>0);
 assert.deepEqual(missions(s),before);
 assert.equal(fishermanSees(s.fisherman,{x:FISHERMAN.x,z:40,y:0}),false);
});

test('acting is finite and decisions tick at eight Hz',()=>{
 const s=setup();step(s,.04,[]);assert.equal(s.fisherman.routine,0);
 advance(s,.1);assert.equal(s.fisherman.routine,.125);
 for(const kind of ['double_take','discover_missing'])for(let age=0;age<5;age+=.05){
  s.fisherman.reaction={kind,age};assert(Object.values(fishermanPose(s.fisherman)).every(Number.isFinite));
 }
});
