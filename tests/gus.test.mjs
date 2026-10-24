import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,interact,ook,step,missions} from '../public/game-core.mjs';
import {gusOf,gusShoeAction,gusPose} from '../public/gus.mjs';
import {nestSave,depositAtNest} from '../public/nest.mjs';
const wait=(s,seconds)=>{for(let t=0;t<seconds;t+=.025)step(s,.025,[[0,0],[0,0]]);};
const put=(p,x,z)=>Object.assign(p,{x,z,y:0,air:false,vy:0});

test('either monkey can loosen the shoes and make Gus trip during his glasses chase',()=>{
  for(const i of [0,1]){
    const s=createState(),n=gusOf(s),p=s.players[i];put(p,n.x+1.8,n.z);put(s.players[1-i],0,20);
    assert(gusShoeAction(s,i));interact(s,i);assert(n.lacesLoose);assert.equal(p.heldItem,null);
    put(p,n.x,n.z+2);interact(s,i);assert.equal(p.heldItem,'gus-glasses');assert.equal(n.motion.kind,'chase');
    put(p,n.x,n.z+6);wait(s,1);assert(n.tumble);assert(!n.lacesLoose);
    assert.equal(p.heldItem,'gus-glasses');const originalGoals=missions(s).map(m=>m.done);
    wait(s,3);assert.equal(n.tumble,null);assert.deepEqual(missions(s).map(m=>m.done),originalGoals);
  }
});

test('startles make repeatable comic falls, but spam cannot keep Gus down forever',()=>{
  const s=createState(),n=gusOf(s),p=s.players[0];put(p,n.x,n.z+3);
  for(let round=0;round<4;round++){
    p.ook=0;ook(s,0);assert(n.tumble);
    wait(s,1);const age=n.tumble.age;p.ook=0;ook(s,0);assert.equal(n.tumble.age,age);
    wait(s,2);assert.equal(n.tumble,null,'gets back up even when startled again');
    wait(s,2.25);
  }
  put(p,0,20);p.ook=0;ook(s,0);assert.equal(n.tumble,null);
});

test('taking glasses during a fall waits for him to stand, then resumes pursuit',()=>{
  const s=createState(),n=gusOf(s),p=s.players[0];put(p,n.x,n.z+2);ook(s,0);interact(s,0);
  assert.equal(p.heldItem,'gus-glasses');wait(s,1);assert(n.tumble);assert.equal(n.motion.age,0);
  wait(s,6);assert.equal(p.heldItem,null);assert.equal(s.finds.find(o=>o.id==='gus-glasses').worn,true);
  wait(s,8);put(p,n.x,n.z+2);interact(s,0);assert.equal(p.heldItem,'gus-glasses');assert.equal(n.motion.kind,'chase');
});

test('glasses remain a single object through drops and catches, and the nest keeps a display with a spare',()=>{
  const s=createState(),n=gusOf(s),p=s.players[0],item=s.finds.find(o=>o.id==='gus-glasses');
  put(p,n.x,n.z+2);interact(s,0);assert(!item.worn);
  put(p,-10,14);interact(s,0);assert.equal(item.place,'world');assert.equal(item.worn,false);
  wait(s,1);assert.equal(item.x,-10,'dropped glasses do not snap back to Gus');
  interact(s,0);Object.assign(p,{x:-12,z:34,y:5});assert(depositAtNest(s,0));
  const fresh=createState(nestSave(s));assert(fresh.nest.deposited.includes(item.id));
  assert(fresh.finds.find(o=>o.id===item.id).worn);assert.equal(gusOf(fresh).tumble,null);assert(!gusOf(fresh).lacesLoose);
});

test('pratfall poses stay finite and return to standing; shoes require reachable empty hands',()=>{
  const s=createState(),n=gusOf(s),p=s.players[0];
  for(let t=0;t<2.75;t+=.01){n.tumble={age:t};assert(Object.values(gusPose(n,0)).every(v=>typeof v==='boolean'||Number.isFinite(v)));}
  n.tumble=null;assert.equal(gusPose(n,0),null);
  put(p,n.x+1.8,n.z);p.heldItem='shell';assert(!gusShoeAction(s,0));
  p.heldItem=null;p.y=5;assert(!gusShoeAction(s,0));
});
