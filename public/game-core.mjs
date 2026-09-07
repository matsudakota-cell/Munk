import {createFisherman,interactHat,stepFisherman,noticeMischief} from './fisherman.mjs';
import {isCarried} from './fisherman-movement.mjs';
export const ZONES=[{id:'bells',name:'Canopy Club',x:-29,z:-28,color:'#ebc95b'},{id:'band',name:'Jungle Jam',x:28,z:-28,color:'#eb987c'},{id:'bubbles',name:'Bubble Works',x:-29,z:25,color:'#8edce3'},{id:'bowling',name:'Coconut Lanes',x:29,z:25,color:'#bfcc72'},{id:'bounce',name:'Cloud Hoppers',x:0,z:0,color:'#d2b3e9'}];
export const PADS=[{x:-34,z:25},{x:-24,z:25}];
export const LADDERS=[{x:-34,z:-23,top:7},{x:-24,z:-23,top:7}];
export const DRUMS=[{x:22,z:-28,note:'DO'},{x:26,z:-30,note:'MI'},{x:30,z:-30,note:'SO'},{x:34,z:-28,note:'LA'}];
export const SONG=[0,1,2,3,2,0];
export const TRAMPOLINES=[{x:-5,z:0},{x:0,z:-3},{x:5,z:0}];
export const TARGETS=Array.from({length:6},(_,i)=>({x:26+(i%3)*3,z:16-Math.floor(i/3)*3}));
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createState(){return {players:[{x:-2,z:12,y:0,vy:0,angle:0,walk:0,ook:0,air:false,bump:0,bumpCooldown:0,land:0,cheer:0,hello:0,idle:0,moving:false,reaction:null,lastReaction:null,heldItem:null},{x:2,z:12,y:0,vy:0,angle:0,walk:0,ook:0,air:false,bump:0,bumpCooldown:0,land:0,cheer:0,hello:0,idle:0,moving:false,reaction:null,lastReaction:null,heldItem:null}],fisherman:createFisherman(),time:0,reactionSeed:0x6d756e6b,birds:Array.from({length:7},(_,i)=>({x:-12+i*4,z:10+i%2*6,phase:i*.87,scatter:null,cooldown:0})),bells:[false,false],bellUntil:[0,0],bellPlayers:[-1,-1],band:0,bandPlayers:[],songComplete:false,foam:0,bubbles:false,pins:TARGETS.map(t=>({...t,down:false})),balls:[{x:26,z:32,vx:0,vz:0},{x:29,z:32,vx:0,vz:0},{x:32,z:32,vx:0,vz:0}],hoops:[false,false,false],bouncers:[],events:[],celebrated:false,solid:[]}}
export function missions(s){return[{name:'Ring in a ridiculous morning',short:'Treetop bell duet',detail:'Climb the two ladders with E / Enter. Ring both bells together.',done:s.bells.every(Boolean),progress:s.bells.every(Boolean)?'Duet complete':'Two monkeys · two bells',zone:ZONES[0]},{name:'Start an extremely loud band',short:'Play the jungle melody',detail:'Play DO · MI · SO · LA · SO · DO. Both monkeys must play a note.',done:s.songComplete,progress:s.songComplete?'Standing ovation':`${s.band}/6 notes · ${new Set(s.bandPlayers).size}/2 musicians`,zone:ZONES[1]},{name:'Give the island a bubble bath',short:'Power the bubble fountain',detail:'Stand on a different blue pedal each. Keep both pressed for four seconds.',done:s.bubbles,progress:s.bubbles?'Bubbles everywhere':`${Math.min(100,Math.floor(s.foam/4*100))}% bubble power`,zone:ZONES[2]},{name:'Invent coconut bowling',short:'Bowl over six pineapple pins',detail:'Stand behind a coconut and press E / Enter to roll it down the lane.',done:s.pins.every(p=>p.down),progress:`${s.pins.filter(p=>p.down).length}/6 pins toppled`,zone:ZONES[3]},{name:'Teach monkeys to fly',short:'Bounce through three sky hoops',detail:'Jump on each trampoline. Both monkeys need a turn in the air.',done:s.hoops.every(Boolean)&&new Set(s.bouncers).size===2,progress:`${s.hoops.filter(Boolean).length}/3 hoops · ${new Set(s.bouncers).size}/2 monkeys`,zone:ZONES[4]}]}
export function emit(s,text,type='info',x=0,z=0,details={}){if(type==='win'||type==='complete')s.players.forEach(p=>p.cheer=2.4);s.events.push({...details,text,type,x,z});if(s.events.length>20)s.events.shift()}
export function nearZone(p){return [...ZONES].sort((a,b)=>dist(p,a)-dist(p,b))[0]}
export function platformHeight(p){return p.x>-39&&p.x<-19&&p.z>-35&&p.z<-22?7:0}
export function jump(s,i){const p=s.players[i];if(!p.air&&!isCarried(s.fisherman,i)){p.vy=9;p.air=true;p.jumpSerial=(p.jumpSerial??0)+1}}
// A handful of authored beats, not a general behavior engine. Durations only
// pace the acting; reactions never gate player movement or interactions.
const OOK_RESPONSES = [
  {regular:['pip_bow','pip_salute','pip_dance'],rare:'pip_echo'},
  {regular:['momo_giggle','momo_wave','momo_clap'],rare:'momo_missed'},
];
const RESPONSE_LENGTHS = {pip_bow:2.1,pip_salute:2,pip_dance:2.5,pip_echo:2.5,momo_giggle:2.3,momo_wave:2.3,momo_clap:2.5,momo_missed:2.8};

function reactionRandom(s){
  // Separate from scene decoration randomness, so a replay is testable.
  s.reactionSeed=(Math.imul(s.reactionSeed,1664525)+1013904223)>>>0;
  return s.reactionSeed/4294967296;
}

function chooseResponse(s,i){
  const table=OOK_RESPONSES[i],last=s.players[i].lastReaction;
  if(reactionRandom(s)<.08&&last!==table.rare)return table.rare;
  const choices=table.regular.filter(kind=>kind!==last);
  return choices[Math.floor(reactionRandom(s)*choices.length)];
}

export function birdPose(bird,t){
  const angle=t*.25+bird.phase;
  let x=bird.x+Math.sin(angle)*3,z=bird.z+Math.cos(angle)*2;
  let y=Math.abs(Math.sin(t*5+bird.phase))*.04;
  let facing=Math.atan2(Math.cos(angle)*3,-Math.sin(angle)*2),tilt=0;
  if(bird.scatter){
    const r=bird.scatter,age=r.duration-r.remaining;
    // Quick takeoff, then a leisurely curved return to the usual routine.
    const travel=age<.45?Math.sin(age/.45*Math.PI/2):
      Math.pow(Math.max(0,1-(age-.45)/(r.duration-.45)),.7);
    x+=r.dx*travel;z+=r.dz*travel;
    y+=Math.sin(Math.PI*age/r.duration)*1.8;
    facing=Math.atan2(r.dx,r.dz)+(age>.8?Math.PI:0);
    tilt=Math.sin(age*18+bird.phase)*.14*travel;
  }
  return {x,y,z,facing,tilt};
}

export function ook(s,i){
  const p=s.players[i];
  if(p.ook>.9)return;
  noticeMischief(s.fisherman,p,i,'ook');
  p.ook=1.6;p.idle=0;
  emit(s,'OOK!','ook',p.x,p.z,{player:i});
  const other=1-i,friend=s.players[other];
  if(dist(p,friend)<7&&Math.abs(p.y-friend.y)<2&&!friend.reaction){
    const kind=chooseResponse(s,other),duration=RESPONSE_LENGTHS[kind];
    friend.reaction={kind,duration,remaining:duration,sourcePlayer:i,voiced:false};
    friend.lastReaction=kind;
    // Do not restart an unfinished joke every time the keys are tapped.
    emit(s,'','ook-reaction',friend.x,friend.z,{player:other,sourcePlayer:i,kind});
  }
  // Proximity is evaluated on a real ook, never on every rendered frame.
  let scattered=0;
  for(const bird of s.birds){
    const at=birdPose(bird,s.time);
    if(bird.cooldown>0||dist(p,at)>=5||Math.abs(p.y-at.y)>=2.5)continue;
    const dx=at.x-p.x,dz=at.z-p.z,length=Math.hypot(dx,dz)||1;
    bird.scatter={dx:length===1&&dx===0&&dz===0?4:dx/length*4.5,dz:dz/length*4.5,duration:3.2,remaining:3.2};
    bird.cooldown=3.8;scattered++;
  }
  if(scattered)emit(s,'','bird-scatter',p.x,p.z,{player:i});
}

function stepOokReactions(s,dt){
  s.players.forEach((p,i)=>{
    const r=p.reaction;
    if(!r)return;
    r.remaining=Math.max(0,r.remaining-dt);
    const age=r.duration-r.remaining;
    if(!r.voiced&&age>=.55){
      r.voiced=true;
      // Replies are audiovisual only: they never call ook() or start chains.
      if(r.kind!=='momo_missed')emit(s,'','ook-reply',p.x,p.z,{player:i,kind:r.kind});
    }
    if(r.remaining===0)p.reaction=null;
  });
  for(const bird of s.birds){
    bird.cooldown=Math.max(0,bird.cooldown-dt);
    if(!bird.scatter)continue;
    bird.scatter.remaining=Math.max(0,bird.scatter.remaining-dt);
    if(bird.scatter.remaining===0)bird.scatter=null;
  }
}
export function interact(s,i){if(isCarried(s.fisherman,i))return;const p=s.players[i];const ladder=LADDERS.find(l=>dist(p,l)<3);if(ladder){if(p.y<3){p.y=7;p.z=-25;p.vy=0;p.air=false;emit(s,'Up in the canopy! Ring a bell with E / Enter.')}else{p.y=0;p.z=-19;p.vy=0;p.air=false;emit(s,'Back on the ground.')}return}
if(p.y>6){const b=[{x:-35,z:-30},{x:-23,z:-30}].findIndex(b=>dist(p,b)<3.5);if(b>=0){s.bellUntil[b]=s.time+3;s.bellPlayers[b]=i;emit(s,'DING! Your partner has three seconds to ring the other bell.','bell',p.x,p.z);if(s.bellUntil.every(t=>t>s.time)&&s.bellPlayers[0]!==s.bellPlayers[1]&&!s.bells.every(Boolean)){s.bells=[true,true];emit(s,'Canopy duet! Even the birds are applauding.','win',p.x,p.z)}return}}
const drum=DRUMS.findIndex(d=>dist(p,d)<2.7);if(drum>=0&&!s.songComplete){if(drum===SONG[s.band]){s.band++;s.bandPlayers.push(i);emit(s,DRUMS[drum].note,'note',p.x,p.z);if(s.band===SONG.length){if(new Set(s.bandPlayers).size===2){s.songComplete=true;emit(s,'The Munks Band is officially very loud.','win',p.x,p.z)}else{s.band=0;s.bandPlayers=[];emit(s,'Great tune! This time let your partner play a note too.')}}}else{s.band=drum===SONG[0]?1:0;s.bandPlayers=s.band?[i]:[];emit(s,'A little jazz! Start again: DO · MI · SO · LA · SO · DO.','note',p.x,p.z)}return}
const ball=s.balls.filter(b=>dist(p,b)<3.4).sort((a,b)=>dist(p,a)-dist(p,b))[0];if(ball){ball.vx=0;ball.vz=-17;emit(s,'Coconut coming through!','roll',ball.x,ball.z);return}
if(interactHat(s.fisherman,p,i))return;
const zone=nearZone(p);emit(s,missions(s).find(m=>m.zone.id===zone.id).detail)}
export function step(s,dt,axes){dt=Math.max(0,Math.min(.04,dt));s.time+=dt;stepOokReactions(s,dt);stepFisherman(s.fisherman,dt,s.players,s.solid);
s.players.forEach((p,i)=>{if(isCarried(s.fisherman,i)){p.ook=Math.max(0,p.ook-dt);return;}for(const key of ['bump','bumpCooldown','land','cheer','hello'])p[key]=Math.max(0,p[key]-dt);let [dx,dz]=axes[i]||[0,0],len=Math.hypot(dx,dz);p.moving=len>0;p.idle=len>0||p.air?0:p.idle+dt;if(len>0){dx/=Math.max(1,len);dz/=Math.max(1,len);const speed=8.3,x=p.x+dx*speed*dt,z=p.z+dz*speed*dt;const blocked=(x,z)=>s.solid.some(o=>p.y<o.h&&Math.hypot(x-o.x,z-o.z)<o.r+.48);if((blocked(x,p.z)||blocked(p.x,z))&&p.bumpCooldown<=0){p.bump=1;p.bumpCooldown=1.2;emit(s,i?'Oops!':'BONK!','bonk',p.x,p.z)}if(!blocked(x,p.z))p.x=Math.max(-46,Math.min(46,x));if(!blocked(p.x,z))p.z=Math.max(-43,Math.min(43,z));p.angle=Math.atan2(dx,dz);p.walk+=dt*13}
const ground=p.y>5.8&&platformHeight(p)>0?7:(p.x>19&&p.x<37&&p.z>-33&&p.z<-23?.65:0);if(p.y<ground){p.y=ground;p.vy=0;p.air=false;}if(p.y>ground+.01||p.vy!==0){p.vy-=22*dt;p.y+=p.vy*dt;p.air=true;if(p.y<=ground){if(p.vy < -3){p.land=.36;emit(s,'puff','land',p.x,p.z)}p.y=ground;p.vy=0;p.air=false}}else p.air=false;
TRAMPOLINES.forEach((t,j)=>{if(dist(p,t)<1.75&&p.y<.65&&p.vy<=0){p.vy=16;p.air=true;emit(s,'Boing!','bounce',p.x,p.z)}if(dist(p,t)<2&&p.y>4.1&&!s.hoops[j]){s.hoops[j]=true;s.bouncers.push(i);emit(s,'Sky hoop! That is definitely not how walking works.','win',p.x,p.z)}else if(dist(p,t)<2&&p.y>4.1&&!s.bouncers.includes(i)){s.bouncers.push(i)}});
p.ook=Math.max(0,p.ook-dt)});
// Soft body contact. Separate gently, never push a monkey through scenery.
const a=s.players[0],b=s.players[1],gap=dist(a,b);if(!isCarried(s.fisherman,0)&&!isCarried(s.fisherman,1)&&gap<1.04&&Math.abs(a.y-b.y)<1.5){const nx=gap>.001?(b.x-a.x)/gap:1,nz=gap>.001?(b.z-a.z)/gap:0,push=(1.04-gap)/2;for(const [p,sign] of [[a,-1],[b,1]]){const x=p.x+nx*push*sign,z=p.z+nz*push*sign;if(!s.solid.some(o=>p.y<o.h&&Math.hypot(x-o.x,z-o.z)<o.r+.48)){p.x=Math.max(-46,Math.min(46,x));p.z=Math.max(-43,Math.min(43,z));}}if((a.moving||b.moving)&&a.bumpCooldown<=0&&b.bumpCooldown<=0){for(const p of [a,b]){p.bump=.85;p.bumpCooldown=1.2;p.hello=1.6;}emit(s,'Boop!','bonk',(a.x+b.x)/2,(a.z+b.z)/2)}}
const onPads=PADS.map(t=>s.players.some(p=>dist(p,t)<1.9&&p.y<1));if(onPads.every(Boolean)&&!s.bubbles){s.foam+=dt;if(s.foam>=4){s.bubbles=true;emit(s,'Bubble bath activated. The entire island says thank you!','win',-29,25)}}else if(!s.bubbles)s.foam=Math.max(0,s.foam-dt*.4);
s.balls.forEach((b,i)=>{b.x+=b.vx*dt;b.z+=b.vz*dt;b.vx*=1-dt*.13;b.vz*=1-dt*.13;s.pins.forEach(p=>{if(!p.down&&Math.hypot(b.x-p.x,b.z-p.z)<1.2&&Math.abs(b.vz)>1){p.down=true;emit(s,'Pineapple down!','pin',p.x,p.z)}});if(b.z<8||b.z>38||Math.abs(b.x-29)>10){b.x=26+i*3;b.z=32;b.vx=0;b.vz=0}});
if(!s.celebrated&&missions(s).every(m=>m.done)){s.celebrated=true;emit(s,'Island legends! Five experiments. Two magnificent monkeys.','complete')}
}
