import assert from 'node:assert/strict';
import test from 'node:test';
import {createState,step,ook,jump,interact,birdPose,missions,DRUMS} from '../public/game-core.mjs';
import {pose} from '../public/monkey-personality.mjs';

const still=[[0,0],[0,0]];
function tick(state,seconds,axes=still){
  for(let n=0;n<Math.ceil(seconds/.02);n++)step(state,.02,axes);
}
function nearby(){
  const state=createState();
  state.players.forEach(p=>p.z=20);
  return state;
}
function sampleResponses(seed,count=240){
  const state=nearby(),trace=[[],[]];state.reactionSeed=seed;
  for(let n=0;n<count;n++){
    ook(state,n%2);
    const r=state.players[1-n%2].reaction;
    assert(r);trace[1-n%2].push(r.kind);
    tick(state,3);state.events.length=0;
  }
  return trace;
}

test('responses are reproducible, character-specific, varied, and avoid immediate repeats',()=>{
  const trace=sampleResponses(713,1200);
  assert.deepEqual(trace,sampleResponses(713,1200));
  assert.notDeepEqual(trace,sampleResponses(714,1200));
  trace.forEach((kinds,i)=>{
    assert.equal(new Set(kinds).size,4);
    assert(kinds.every(kind=>kind.startsWith(i?'momo_':'pip_')));
    assert(kinds.every((kind,n)=>n===0||kind!==kinds[n-1]));
    const rare=kinds.filter(kind=>kind===(i?'momo_missed':'pip_echo')).length/kinds.length;
    assert(rare>.025&&rare<.12,`rare response rate: ${rare}`);
  });
});

test('range and height matter; an active reaction is allowed to finish under repeated input',()=>{
  const state=nearby();ook(state,0);
  const original=state.players[1].reaction;
  assert.equal(original.sourcePlayer,0);
  tick(state,.72);ook(state,0);
  assert.equal(state.players[1].reaction,original);
  assert(original.remaining<original.duration);
  const ownOok=state.players[0].ook;ook(state,0);
  assert.equal(state.players[0].ook,ownOok,'existing call cooldown retained');
  tick(state,4);assert.equal(state.players[1].reaction,null);
  state.players[1].x=30;ook(state,0);assert.equal(state.players[1].reaction,null);
  tick(state,2);state.players[1].x=2;state.players[1].y=7;
  ook(state,0);assert.equal(state.players[1].reaction,null);
});

test('replies carry explicit identity and never trigger automatic reply chains',()=>{
  const state=nearby();ook(state,1);
  assert.equal(state.events.find(e=>e.type==='ook').player,1);
  assert.equal(state.events.find(e=>e.type==='ook-reaction').player,0);
  state.events.length=0;tick(state,4);
  assert.equal(state.events.filter(e=>e.type==='ook-reply').length,1);
  assert.equal(state.events.filter(e=>e.type==='ook').length,0);
  state.events.length=0;tick(state,15);
  assert.equal(state.events.length,0);
});

test('all reaction kinds preserve movement, jumping, interactions, and direct ooks',()=>{
  const kinds=sampleResponses(73,200).flat();
  for(const kind of new Set(kinds)){
    const state=nearby(),i=kind.startsWith('pip_')?0:1,p=state.players[i];
    p.reaction={kind,duration:2.8,remaining:2.8,sourcePlayer:1-i,voiced:false};
    const x=p.x;const axes=still.map(a=>[...a]);axes[i]=[1,0];tick(state,.2,axes);
    assert(p.x>x,kind);jump(state,i);tick(state,.2);assert(p.y>0,kind);
    Object.assign(p,{...DRUMS[0],y:0,vy:0,air:false});interact(state,i);
    assert.equal(state.band,1,kind);
    ook(state,i);assert(p.ook>0,kind);
  }
});

test('Momo starts surprised, then delighted; the rare daydream is silent',()=>{
  const p=nearby().players[1];
  p.reaction={kind:'momo_giggle',duration:2.3,remaining:2,sourcePlayer:0,voiced:false};
  assert.equal(pose(p,1,1).expression,'surprise');
  p.reaction.remaining=1.2;
  assert.equal(pose(p,1,1).expression,'delight');
  const state=nearby();state.players[1].reaction={kind:'momo_missed',duration:2.8,remaining:2.8,sourcePlayer:0,voiced:false};
  tick(state,1);assert.equal(pose(state.players[1],1,1).expression,'dreamy');
  assert(!state.events.some(e=>e.type==='ook-reply'));
});

test('nearby birds take off, cannot be perpetually restarted, and return to their routine',()=>{
  const state=nearby(),bird=state.birds[0],initial=birdPose(bird,state.time);
  Object.assign(state.players[0],{x:initial.x,z:initial.z});
  ook(state,0);assert(bird.scatter);const flight=bird.scatter;
  tick(state,.8);const flying=birdPose(bird,state.time);
  assert(flying.y>.5);assert(Math.hypot(flying.x-initial.x,flying.z-initial.z)>1);
  ook(state,0);assert.equal(bird.scatter,flight);
  tick(state,4);assert.equal(bird.scatter,null);
  assert.deepEqual(birdPose(bird,state.time),birdPose({...bird,scatter:null},state.time));
  const before=birdPose(bird,state.time);
  Object.assign(state.players[0],{x:before.x,z:before.z,y:7});
  ook(state,0);assert.equal(bird.scatter,null,'ground birds ignore a distant canopy ook');
});

test('five simulated minutes of rapid two-player ooking stay bounded and preserve mission state',()=>{
  const state=nearby(),before=missions(state).map(m=>m.done),seen=[new Set(),new Set()];
  let queued=0;
  for(let frame=0;frame<15000;frame++){
    if(frame%3===0){ook(state,0);ook(state,1)}
    step(state,.02,still);queued=Math.max(queued,state.events.length);
    state.players.forEach((p,i)=>{
      if(p.reaction)seen[i].add(p.reaction.kind);
      const acting=pose(p,i,state.time);
      for(const value of Object.values(acting))if(typeof value==='number')assert(Number.isFinite(value));
      assert(acting.scaleX>0&&acting.scaleY>0&&acting.eyeOpen>0);
    });
    state.events.length=0;
  }
  assert(queued<=20);seen.forEach(kinds=>assert.equal(kinds.size,4));
  assert.deepEqual(missions(state).map(m=>m.done),before);
  tick(state,5);assert(state.players.every(p=>p.reaction===null));
  assert(state.birds.every(b=>b.scatter===null));
  const reset=createState();assert(reset.players.every(p=>p.reaction===null&&p.lastReaction===null));
});
