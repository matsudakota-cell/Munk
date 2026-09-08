import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,interact,jump,ook,missions} from '../public/game-core.mjs';
import {NEIGHBORS,activityMissions} from '../public/island-activities.mjs';
import {nestSave,depositAtNest} from '../public/nest.mjs';

const wait=(s,seconds=1)=>{for(let t=0;t<seconds;t+=.02)step(s,.02,[[0,0],[0,0]]);};
const put=(p,at)=>Object.assign(p,{...at,y:0,air:false,vy:0});

test('both anchor activities work with either monkey holding, and preserve all original goals',()=>{
  for(const holder of [0,1])for(const [j,n] of NEIGHBORS.entries()){
    const s=createState(),a=s.activities.areas[j],before=missions(s).map(m=>m.done);
    put(s.players[holder],n.hold);put(s.players[1-holder],n.use);
    interact(s,holder);assert.equal(a.holder,holder);interact(s,1-holder);
    assert(a.anchorDone);assert.equal(s.players[1-holder].y,j?0:3);
    assert.deepEqual(missions(s).map(m=>m.done),before);
    assert.equal(s.celebrated,false);
    // Walking away always releases the mechanism; the explorer can descend.
    put(s.players[holder],{x:0,z:12});wait(s);
    assert.equal(a.holder,null);
    if(!j){assert.equal(s.players[1-holder].y,3);interact(s,1-holder);assert.equal(s.players[1-holder].y,0);}
  }
});

test('solo play is repeatable, switching ends cannot complete an anchor, and jumping releases the grip',()=>{
  for(const n of NEIGHBORS){const s=createState(),a=s.activities.areas[NEIGHBORS.indexOf(n)];
    put(s.players[1],{x:0,z:12});put(s.players[0],n.use);
    interact(s,0);assert(a.splash>0);assert(!a.anchorDone);
    put(s.players[0],n.hold);interact(s,0);jump(s,0);wait(s,.2);assert.equal(a.holder,null);
    put(s.players[0],n.hold);interact(s,0);put(s.players[0],n.use);interact(s,0);assert(!a.anchorDone);
  }
});

test('four automatic catches complete each relay with either starter and no timer between throws',()=>{
  for(const starter of [0,1])for(const [j,n] of NEIGHBORS.entries()){
    const s=createState(),a=s.activities.areas[j],item=s.finds.find(o=>o.id===n.item);
    put(s.players[starter],item);put(s.players[1-starter],{x:n.x+4,z:4});
    interact(s,starter);assert.equal(s.players[starter].heldItem,n.item);
    for(let k=0;k<4;k++){
      const owner=(starter+k)%2;interact(s,owner);assert.equal(item.place,'flight');
      assert(s.players.every(p=>p.heldItem!==n.item));wait(s);
      assert.equal(item.heldBy,1-owner);assert.equal(a.passes,k+1);
      wait(s,12);assert.equal(a.passes,k+1,'there is no deadline to pass back');
    }
    assert(a.relayDone);assert.equal(activityMissions(s).filter(m=>m.done).length,1);
    assert.equal(s.celebrated,false);
  }
});

test('solo juggling does not award relay progress, missed catches drop safely and can be replayed',()=>{
  const s=createState(),n=NEIGHBORS[0],a=s.activities.areas[0],item=s.finds.find(o=>o.id===n.item);
  put(s.players[0],item);put(s.players[1],{x:0,z:12});interact(s,0);
  for(let k=0;k<3;k++){interact(s,0);wait(s);assert.equal(item.heldBy,0);assert.equal(a.passes,0);}
  put(s.players[1],{x:-29,z:4});interact(s,0);wait(s);assert.equal(a.passes,1);
  interact(s,1);put(s.players[0],{x:0,z:12});wait(s);
  assert.equal(a.passes,0);assert.equal(item.place,'world');assert.equal(item.y,0);
  put(s.players[0],item);interact(s,0);assert.equal(item.heldBy,0);
});

test('busy hands never duplicate or overwrite a prop; flight and grip stop safely around catches',()=>{
  const s=createState(),item=s.finds.find(o=>o.id==='fruit-basket'),a=s.activities.areas[1];
  put(s.players[0],item);put(s.players[1],{x:37,z:4});interact(s,0);interact(s,0);
  const shell=s.finds.find(o=>o.id==='shell');Object.assign(shell,{place:'held',heldBy:1});s.players[1].heldItem='shell';
  wait(s);assert.equal(s.players[1].heldItem,'shell');assert.equal(item.place,'world');
  put(s.players[0],NEIGHBORS[1].hold);interact(s,0);assert.equal(a.holder,0);
  s.fisherman.motion={kind:'carry',player:0,age:0};
  // Direct activity tick isolates the same carried-state release from chase movement.
  return import('../public/island-activities.mjs').then(({stepActivities})=>{stepActivities(s,.2);assert.equal(a.holder,null);});
});

test('new props stay in the nest across reloads while neighbors provide spares for another game',()=>{
  const s=createState();
  for(const [i,n] of NEIGHBORS.entries()){
    const item=s.finds.find(o=>o.id===n.item);put(s.players[i],item);interact(s,i);
    Object.assign(s.players[i],{x:-12,z:34,y:5});assert(depositAtNest(s,i));
    assert(s.nest.deposited.includes(n.item));assert.equal(item.place,'world');assert.equal(item.heldBy,null);
  }
  const fresh=createState(nestSave(s));assert.equal(fresh.nest.deposited.length,2);
  assert(fresh.finds.filter(o=>o.kind==='play').every(o=>o.place==='world'));
  assert(fresh.activities.areas.every(a=>!a.anchorDone&&!a.relayDone&&!a.flight));
});

test('new NPC awareness is per monkey, cools down, and never gates movement',()=>{
  const s=createState();put(s.players[0],NEIGHBORS[0]);put(s.players[1],{x:0,z:12});ook(s,0);
  assert(s.activities.areas[0].npc.attention[0]>0);assert.equal(s.activities.areas[0].npc.attention[1],0);
  const x=s.players[0].x;step(s,.04,[[1,0],[0,0]]);assert(s.players[0].x>x);
  wait(s,30);assert.equal(s.activities.areas[0].npc.reaction,0);assert.equal(s.activities.areas[0].npc.attention[0],0);
});
