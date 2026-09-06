import assert from 'node:assert/strict';
import test from 'node:test';
import {createState,step,interact,jump,missions,PADS,LADDERS,DRUMS,SONG,TRAMPOLINES} from '../public/game-core.mjs';

function tick(state,seconds,axes=[[0,0],[0,0]]){
  for(let n=0;n<Math.ceil(seconds/.02);n++)step(state,.02,axes);
}

test('the five existing missions still complete with their existing cooperation rules',()=>{
  const s=createState();
  Object.assign(s.players[0],LADDERS[0]);interact(s,0);assert.equal(s.players[0].y,7);
  Object.assign(s.players[0],{x:-35,z:-30});interact(s,0);
  Object.assign(s.players[0],{x:-23,z:-30});interact(s,0);
  assert(!missions(s)[0].done,'one monkey cannot do both bells');
  Object.assign(s.players[1],LADDERS[1]);interact(s,1);
  Object.assign(s.players[1],{x:-23,z:-30});interact(s,1);assert(missions(s)[0].done);
  for(let n=0;n<SONG.length;n++){
    Object.assign(s.players[n%2],{...DRUMS[SONG[n]],y:0});interact(s,n%2);
  }
  assert(missions(s)[1].done);
  s.players.forEach((p,i)=>Object.assign(p,{...PADS[i],y:0}));tick(s,4.1);
  assert(missions(s)[2].done);
  s.players.forEach(p=>Object.assign(p,{x:0,z:10,y:0}));
  for(let i=0;i<3;i++){
    Object.assign(s.players[0],{x:26+i*3,z:33,y:0});interact(s,0);tick(s,1.8);
  }
  assert(missions(s)[3].done);
  for(let j=0;j<3;j++){
    Object.assign(s.players[j%2],{...TRAMPOLINES[j],y:0,vy:0});tick(s,1.2);
  }
  assert(missions(s)[4].done);assert(s.celebrated);
});

test('existing bell timing, movement, and safe landings remain intact',()=>{
  const s=createState();tick(s,.2,[[1,0],[-1,0]]);
  assert(s.players[0].x>-2&&s.players[1].x<2);
  s.players.forEach((p,i)=>Object.assign(p,{x:i?-23:-35,z:-30,y:7}));
  interact(s,0);tick(s,3.4);interact(s,1);assert(!missions(s)[0].done);
  interact(s,0);assert(missions(s)[0].done);
  Object.assign(s.players[0],{x:-20,z:-28,y:7});tick(s,2,[[1,0],[0,0]]);
  assert.equal(s.players[0].y,0);
  jump(s,0);tick(s,.4);assert(s.players[0].y>0);tick(s,1.4);assert.equal(s.players[0].y,0);
});
