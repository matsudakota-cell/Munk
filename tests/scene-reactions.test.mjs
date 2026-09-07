import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('real character rigs render reaction states, freeze on pause, and recover on restart',async()=>{
  // Exercise the actual scene and input code. Only browser APIs and GPU drawing
  // are substituted; this is not a screenshot or browser playtest.
  let now=1000,frame;
  const nodes=new Map(),listeners=new Map();
  const context=new Proxy({},{get:()=>()=>{}});
  const element=()=>({hidden:false,style:{},textContent:'',innerHTML:'',
    addEventListener(){},appendChild(){},setAttribute(){},focus(){},
    getContext(){return context},querySelector(){return element()}});
  globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)},
    createElement:element,querySelectorAll:()=>[]};
  globalThis.window={addEventListener(type,fn){listeners.set(type,fn)}};
  globalThis.innerWidth=1440;globalThis.innerHeight=900;globalThis.devicePixelRatio=1;
  globalThis.requestAnimationFrame=fn=>{frame=fn};
  Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>now}});

  const vendor=new URL('../public/vendor/three.module.js',import.meta.url).href;
  let source=await readFile(new URL('../public/game.js',import.meta.url),'utf8');
  source=source.replace("import * as THREE from './vendor/three.module.js';",`
    import * as RealThree from '${vendor}';
    class TestRenderer {
      constructor(){this.domElement={addEventListener(){}};this.shadowMap={};}
      setPixelRatio(){} setClearColor(){} setSize(){} setScissorTest(){}
      setViewport(){} setScissor(){}
      render(scene,camera){
        scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
        scene.traverse(node=>{
          if(!node.matrixWorld.elements.every(Number.isFinite))throw Error('Non-finite transform');
        });
      }
    }
    const THREE={...RealThree,WebGLRenderer:TestRenderer};
  `);
  for(const name of ['game-core.mjs','monkey-personality.mjs','fisherman.mjs','fisherman-personality.mjs','fisherman-movement.mjs']){
    source=source.replace(`from './${name}'`,`from '${new URL('../public/'+name,import.meta.url).href}'`);
  }
  const game=await import('data:text/javascript;base64,'+Buffer.from(source+'\nexport {state,scene,monkeys,birds,fishermanRig,fishermanHat};').toString('base64'));
  function advance(seconds){for(let n=0;n<Math.ceil(seconds/.02);n++){now+=20;frame(now)}}
  function key(code){listeners.get('keydown')({code,repeat:false,target:{tagName:'DIV'},preventDefault(){}})}
  const count=()=>{let n=0;game.scene.traverse(()=>n++);return n};
  nodes.get('start').onclick();game.state.players.forEach(p=>p.z=20);
  const objects=count();key('KeyQ');advance(.8);
  assert(game.state.players[1].reaction);
  assert(game.monkeys[1].arms.some(arm=>Math.abs(arm.rotation.x)>.2||Math.abs(arm.rotation.z)>.2));
  const remaining=game.state.players[1].reaction.remaining;
  nodes.get('pause').onclick();advance(3);
  assert.equal(game.state.players[1].reaction.remaining,remaining);
  nodes.get('resume').onclick();advance(3);
  assert.equal(game.state.players[1].reaction,null);
  for(let n=0;n<25;n++){key(n%2?'Slash':'KeyQ');advance(3.1)}
  assert.equal(count(),objects,'replies reuse the existing meshes');
  assert.equal(nodes.get('toast').textContent,'','reaction events do not flood the mission toast');
  Object.assign(game.state.players[0],{x:14,z:37,y:0});
  game.state.fisherman.routine=7;
  key('KeyE');advance(2.2);
  assert.equal(game.fishermanHat.parent,game.monkeys[0].head);
  assert(game.fishermanRig.mouth.scale.y>.1,'double take has a readable open mouth');
  nodes.get('pause').onclick();const age=game.state.fisherman.reaction.age;
  advance(1);assert.equal(game.state.fisherman.reaction.age,age);
  nodes.get('resume').onclick();key('KeyE');advance(.1);
  assert.equal(game.fishermanHat.parent,game.scene);
  assert.equal(count(),objects,'hat exchanges reuse one model');
  Object.assign(game.state.players[0],{x:12,z:37,y:0});
  game.state.fisherman.reaction={kind:'mischief',tier:3,player:0,age:4.875,startFacing:0};
  advance(.6);assert.equal(game.state.fisherman.motion.kind,'carry');
  assert.equal(game.fishermanRig.rod.parent,game.scene,'rod stays beside the chair');
  const carryAge=game.state.fisherman.motion.age;
  nodes.get('pause').onclick();advance(1);
  assert.equal(game.state.fisherman.motion.age,carryAge);
  nodes.get('resume').onclick();advance(.3);
  assert(game.fishermanRig.g.position.z>36,'walking rig follows simulation');
  key('KeyQ');nodes.get('restart').onclick();
  assert(game.state.players.every(p=>p.reaction===null));
  assert(game.state.birds.every(b=>b.scatter===null));
  assert.equal(game.state.fisherman.hat.place,'stool');
  assert.equal(game.state.fisherman.motion.kind,'idle');
  assert(game.state.players.every(p=>p.heldItem===null));
  advance(.1);assert(window.munks.getState().running);
  assert.equal(game.fishermanRig.rod.parent,game.fishermanRig.body);
  assert.equal(count(),objects,'chases and restart do not accumulate models');
});
