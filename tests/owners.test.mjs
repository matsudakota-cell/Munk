import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,step,interact,missions,BOWLING_RESET} from '../public/game-core.mjs';
import {EXTRA_BELONGINGS} from '../public/belongings.mjs';
import {nestSave,depositAtNest} from '../public/nest.mjs';
const wait=(s,seconds)=>{for(let t=0;t<seconds;t+=.025)step(s,.025,[[0,0],[0,0]]);};
const put=(p,o)=>Object.assign(p,{x:o.x,z:o.z,y:0,air:false,vy:0});

test('every owned find triggers its owner, is recovered, and can be stolen repeatedly by either player',()=>{
  for(const starter of [0,1])for(const id of ['watering-can','fruit-basket',...EXTRA_BELONGINGS.map(o=>o.id)]){
    const s=createState(),item=s.finds.find(o=>o.id===id),n=item.owner==='fisherman'?s.fisherman:s.owners.find(o=>o.id===item.owner);
    for(let round=0;round<4;round++){
      const i=(starter+round)%2;put(s.players[i],item);put(s.players[1-i],{x:0,z:18});
      interact(s,i);assert.equal(s.players[i].heldItem,id,`${id} picked up`);
      assert(n.motion.kind==='chase'||n.reaction?.tier===3,`${id} immediately alerts its owner`);
      wait(s,1.3);assert.notEqual(n.motion.kind,'idle');
      wait(s,30);assert.equal(s.players[i].heldItem,null,`${id} is reclaimed`);
      assert.equal(item.place,'world');assert.equal(item.x,item.homeX);assert.equal(item.z,item.homeZ);
      assert.equal(n.motion.kind,'idle',`${id} owner returned home`);
    }
  }
});

test('theft interrupts owner rest and return; a second monkey never replaces the active thief',()=>{
  for(const kind of ['rest','return']){
    const s=createState(),n=s.owners[0],item=s.finds.find(o=>o.id==='trowel');n.motion={kind,age:0};
    put(s.players[0],item);interact(s,0);assert.equal(n.motion.kind,'chase');
    const can=s.finds.find(o=>o.id==='watering-can');put(s.players[1],can);interact(s,1);
    assert.equal(n.motion.player,0);assert.equal(n.pending[0].player,1);
    wait(s,35);assert.equal(n.motion.kind,'idle');assert(s.players.every(p=>p.heldItem===null));
  }
});

test('new owners catch only their own belongings and cannot reach a monkey on high ground',()=>{
  const s=createState(),n=s.owners[2],item=s.finds.find(o=>o.id==='sandwich');
  put(s.players[0],item);interact(s,0);
  Object.assign(s.players[0],{x:-29,z:-5,y:3,vy:0,air:false});wait(s,.2);
  assert.equal(n.motion.kind,'rest');assert.equal(s.players[0].heldItem,'sandwich');
  assert.equal(s.players[1].heldItem,null);
});

test('owner movement respects solid scenery on the way out and home',()=>{
  const s=createState(),n=s.owners[2],item=s.finds.find(o=>o.id==='sandwich');
  s.solid=[{x:-17.5,z:-12,r:.6,h:3}];put(s.players[0],item);interact(s,0);
  for(let t=0;t<25;t+=.025){step(s,.025,[]);assert(Math.hypot(n.x+17.5,n.z+12)>=1.39);}
  assert.equal(n.motion.kind,'idle');
});

test('all new belongings persist in the nest with usable spares and no ownership duplication',()=>{
  let s=createState();
  for(const def of EXTRA_BELONGINGS){const item=s.finds.find(o=>o.id===def.id);put(s.players[0],item);interact(s,0);
    Object.assign(s.players[0],{x:-12,z:34,y:5});assert(depositAtNest(s,0));assert.equal(item.heldBy,null);
    s=createState(nestSave(s));assert(s.nest.deposited.includes(def.id));assert.equal(s.finds.find(o=>o.id===def.id).place,'world');
  }
  assert.equal(s.nest.deposited.length,EXTRA_BELONGINGS.length);
});

test('bowling reset restores pins and coconuts, retains an earned mission tick, and can be used again',()=>{
  const s=createState();s.pins.forEach(p=>p.down=true);wait(s,.1);assert(missions(s)[3].done);
  put(s.players[0],BOWLING_RESET);interact(s,0);
  assert(s.pins.every(p=>!p.down));assert(s.balls.every(b=>b.vz===0&&b.z===32));assert(missions(s)[3].done);
  s.pins[0].down=true;s.balls[0].vz=-17;put(s.players[1],BOWLING_RESET);interact(s,1);
  assert(s.pins.every(p=>!p.down));assert(missions(s)[3].done);
  const fresh=createState();fresh.pins[0].down=true;put(fresh.players[0],BOWLING_RESET);interact(fresh,0);
  assert(!missions(fresh)[3].done,'reset cannot award a mission');
});
