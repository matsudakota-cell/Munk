import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,interact,jump,missions} from '../public/game-core.mjs';
import {FINDS,NEST,nestSave,nestWants,cleanNestSave} from '../public/nest.mjs';
import {loadNest,saveNest,NEST_STORAGE_KEY} from '../public/nest-storage.mjs';
import {startChase} from '../public/fisherman-movement.mjs';
const advance=(s,n)=>{for(let t=0;t<n;t+=.025)step(s,.025,[[0,0],[0,0]])};
function collect(s,id,i=0){
 const p=s.players[i],item=s.finds.find(o=>o.id===id);Object.assign(p,{x:item.x,z:item.z,y:item.y});
 interact(s,i);assert.equal(p.heldItem,id);
 Object.assign(p,{x:NEST.ladder.x,z:NEST.ladder.z,y:0});interact(s,i);
}

test('both monkeys enter, deposit different finds and leave; all five missions stay unchanged',()=>{
 const s=createState(),before=missions(s);collect(s,'cushion');collect(s,'shell',1);
 assert.deepEqual(s.nest.deposited,['cushion','shell']);assert(s.players.every(p=>p.y===5&&p.heldItem===null));
 assert.deepEqual(nestWants(s).map(w=>w.filled),[true,true]);
 advance(s,.5);assert(s.players.every(p=>p.y===5));
 jump(s,0);advance(s,1);assert.equal(s.players[0].y,5);
 interact(s,0);assert.equal(s.players[0].y,0);assert.equal(s.players[1].y,5);
 assert.deepEqual(missions(s),before);
});

test('each pictorial want has two alternatives; dropped finds can be exchanged without duplicating',()=>{
 for(const id of ['cushion','feather','shell','spoon']){
  const s=createState();collect(s,id);
  assert(nestWants(s).find(w=>w.kind===FINDS.find(o=>o.id===id).kind).filled);
  const item=s.finds.find(o=>o.id===id);Object.assign(s.players[1],{x:item.x,z:item.z,y:0});interact(s,1);
  assert.equal(s.players[1].heldItem,null);assert.equal(s.nest.deposited.length,1);
 }
 const s=createState(),p=s.players[0];Object.assign(p,{x:-9,z:21});interact(s,0);
 Object.assign(p,{x:-8,z:24});jump(s,0);advance(s,.3);interact(s,0);
 assert.equal(s.finds[0].y,0,'airborne drops go to the ground');
 Object.assign(s.players[1],{x:-8,z:24});interact(s,1);assert.equal(s.finds[0].heldBy,1);
});

test('hat is permanently displayed after reload and cannot be stolen back or reclaimed in a catch',()=>{
 const s=createState();Object.assign(s.players[0],{x:14,z:37});interact(s,0);
 Object.assign(s.players[0],{x:-12,z:38});interact(s,0);
 const restored=createState(nestSave(s));assert.equal(restored.fisherman.hat.place,'nest');
 Object.assign(restored.players[0],{x:14,z:37});interact(restored,0);assert.equal(restored.players[0].heldItem,null);
 startChase(restored.fisherman,0);advance(restored,3);
 assert.equal(restored.fisherman.hat.place,'nest');assert.deepEqual(restored.nest.deposited,['fisherman-hat']);
});

test('catch returns only an undeposited held find and cannot remove nest progress',()=>{
 const s=createState();collect(s,'feather',1);
 Object.assign(s.players[0],{x:-9,z:21,y:0});interact(s,0);
 Object.assign(s.players[0],{x:12,z:37});startChase(s.fisherman,0);advance(s,3);
 assert.equal(s.players[0].heldItem,null);assert.equal(s.finds[0].place,'world');
 assert.deepEqual(s.nest.deposited,['feather']);
});

test('save only contains validated collection IDs; reload and unavailable storage are safe',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const s=createState();collect(s,'spoon');assert(saveNest(storage,nestSave(s)));
 const raw=JSON.parse(data.get(NEST_STORAGE_KEY));assert.deepEqual(Object.keys(raw),['version','deposited']);
 const restored=createState(loadNest(storage));assert.equal(restored.finds.find(o=>o.id==='spoon').place,'nest');
 assert(restored.fisherman.attention.every(n=>n===0));assert.equal(restored.players[0].heldItem,null);
 data.set(NEST_STORAGE_KEY,'broken');assert.deepEqual(loadNest(storage).deposited,[]);
 assert.deepEqual(cleanNestSave({version:1,deposited:['spoon','spoon','bad',{},null]}).deposited,['spoon']);
 assert.deepEqual(cleanNestSave({version:99,deposited:['spoon']}).deposited,[]);
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('full')}};
 assert.deepEqual(loadNest(denied).deposited,[]);assert.equal(saveNest(denied,nestSave(s)),false);
 assert.deepEqual(s.nest.deposited,['spoon'],'failed persistence leaves the current adventure intact');
});
