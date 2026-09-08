import test from 'node:test';
import assert from 'node:assert/strict';
import {createFisherman,noticeMischief,stepFisherman,attentionTier,interactHat} from '../public/fisherman.mjs';
import {fishermanPose} from '../public/fisherman-personality.mjs';
const p={x:14,z:37,y:0,heldItem:null};
const tick=(f,n)=>{for(let i=0;i<n*8;i++)stepFisherman(f,.125)};

test('witnessed antics rise through exactly three tiers, independently for each monkey',()=>{
 const f=createFisherman();f.routine=7;
 noticeMischief(f,p,0,'ook');assert.equal(attentionTier(f.attention[0]),1);assert.equal(f.reaction,null);
 tick(f,.75);noticeMischief(f,p,0,'ook');assert.equal(f.reaction.tier,2);
 for(let i=0;i<4;i++){tick(f,.75);noticeMischief(f,p,0,'ook');}
 assert.equal(attentionTier(f.attention[0]),3);assert.equal(f.reaction.tier,3);
 assert.equal(f.attention[1],0);
 const age=f.reaction.age;noticeMischief(f,p,1,'ook');
 assert.equal(f.reaction.player,0);assert.equal(f.reaction.age,age);
 assert(f.attention[1]>0&&f.attention[1]<22);
});

test('unseen actions, missing hats and handoffs do not transfer attention',()=>{
 const f=createFisherman(),a={...p},b={...p};
 noticeMischief(f,a,0,'ook');assert.deepEqual(f.attention,[0,0]);
 interactHat(f,a,0);tick(f,6.5);assert.deepEqual(f.attention,[0,0]);
 interactHat(f,a,0);assert.equal(f.hat.place,'stool');
 // Taking the hat is a new action by this monkey, never inherited blame.
 f.reaction=null;f.routine=7;interactHat(f,b,1);
 assert.equal(f.attention[0],0);assert.equal(f.attention[1],60);
 assert.equal(noticeMischief(f,{...p,y:7},0,'ook'),false);
 assert.equal(noticeMischief(f,{...p,x:40},0,'ook'),false);
});

test('spam is bounded, attention cools completely and poses get visibly bigger',()=>{
 const f=createFisherman();f.routine=7;
 for(let i=0;i<1000;i++)noticeMischief(f,p,0,'hat');
 assert.equal(f.attention[0],60);
 f.reaction={kind:'mischief',player:0,tier:2,age:2,startFacing:0};
 const mild=fishermanPose(f);f.reaction.tier=3;const big=fishermanPose(f);
 assert(big.leftArm<mild.leftArm&&big.mouth>mild.mouth&&big.rod>mild.rod);
 tick(f,120);assert.deepEqual(f.attention,[0,0]);assert.equal(f.reaction,null);
 assert.deepEqual(createFisherman().attention,[0,0]);
});
