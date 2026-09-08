import {NEIGHBORS} from './island-activities.mjs';
import {neighborPose} from './neighbor-personality.mjs';

export function buildNeighborhoods({group,box,ball,cyl,tube,textSprite,terrainDisc,path,mat}){
  const rigs=[],stations=[];
  NEIGHBORS.forEach((n,j)=>{
    terrainDisc(n.x,n.z,10,j?'#d6c285':'#a8c777');path([[j?17:-17,0],[n.x,0]],3.6);
    textSprite(n.name,n.x,5.8,6,1.05);
    const g=group(n.x,0,-7),body=group();g.add(body);
    // Tilly: tall apron, round glasses, a leafy bun. Bongo: striped shirt,
    // round belly, enormous moustache, banana-shaped hat decoration.
    ball(j?'#f3aa6c':'#658e67',0,1.25,0,j?[.95,1,.62]:[.6,.85,.45],body);
    box(j?'#f8e3b0':'#e6d093',0,1.25,.48,[j?1.5:.8,1.15,.13],body);
    if(j)for(let y=.8;y<1.9;y+=.25)box('#d57759',0,y,.57,[1.35,.1,.06],body);
    const head=group(0,2.5,0);body.add(head);ball('#e6ba8d',0,0,0,[.56,.62,.48],head);
    const eyes=[];
    for(const side of [-1,1]){
      if(!j)ball('#506858',side*.23,.08,.44,[.22,.22,.07],head);
      const eye=ball('#fff6dd',side*.22,.09,.5,[.14,.17,.06],head);eyes.push(eye);
      ball('#344e3e',side*.22,.08,.558,[.06,.09,.03],head);
      if(j)ball('#664c3b',side*.18,-.2,.5,[.29,.12,.1],head);
      cyl('#4e6952',side*.3,.37,0,.2,.7,body);ball('#685841',side*.3,.12,.16,[.27,.16,.39],body);
    }
    ball('#dcad7f',0,-.06,.55,[.16,.16,.16],head);
    const mouth=ball('#814f43',0,-.31,.44,[.15,.14,.06],head);
    if(j){cyl('#e8c362',0,.52,0,.75,.12,head);cyl('#e8c362',0,.67,0,.43,.25,head);tube([[-.3,.85,0],[0,1.05,0],[.3,.95,0]],.1,'#ffe277',head);}
    else{ball('#74604c',0,.36,-.2,[.57,.4,.37],head);ball('#74604c',0,.68,-.2,[.32,.33,.3],head);ball('#ffcd71',.23,.73,0,[.18,.14,.1],head);}
    const arms=[];for(const side of [-1,1]){const arm=group(side*(j?.85:.55),1.9,0);body.add(arm);cyl(j?'#f3aa6c':'#658e67',0,-.35,0,.18,.75,arm);ball('#e6ba8d',0,-.8,0,[.2,.22,.19],arm);arms.push(arm);}
    textSprite(j?'BONGO':'TILLY',n.x,4.3,-7,.65);
    rigs.push({g,body,head,eyes,mouth,arms});

    const holdMark=terrainDisc(n.hold.x,n.hold.z,1.6,'#ffe8a1',.12);
    const useMark=terrainDisc(n.use.x,n.use.z,1.6,'#a9e1e6',.12);
    textSprite(j?'✋  ↻':'✋  ↓',n.hold.x,1.1,n.hold.z+.8,.7);
    textSprite(j?'↻  ☂':'↑  ❀',n.use.x,1.1,n.use.z+1,.7);
    textSprite(j?'🍊  ↔  🍊':'💧  ↔  💧',n.x,1.4,5.7,.75);
    let mechanism,ladder,flower;
    if(!j){
      box('#af956a',-29,1.45,-5,[4.4,2.9,4]);box('#b8ce7c',-29,3,-5,[4.5,.15,4.1]);
      cyl('#75985a',-29,4.4,-6,.15,2.8);
      flower=group(-29,5.8,-6);ball('#ffe39a',0,0,0,[.5,.5,.25],flower);
      for(let k=0;k<7;k++){const angle=k*Math.PI*2/7;ball('#f0b2bf',Math.cos(angle)*.7,Math.sin(angle)*.7,0,[.46,.5,.2],flower);}
      tube([[-38,0,-3],[-38,5,-4],[-34,6,-5],[-29,5,-5]],.11,'#698a4f');
      mechanism=group(-38,1,-3);ball('#749c51',0,0,0,[.3,.6,.25],mechanism);
      ladder=group(-29,0,-3);for(const side of [-1,1])box('#d9bc7d',side*.65,1.5,.15,[.12,3,.13],ladder);for(let y=.3;y<3;y+=.5)box('#e7d499',0,y,.15,[1.4,.1,.15],ladder);
      for(const x of [-36,-33,-30]){box('#957956',x,.25,-9,[2,.5,2]);for(let k=0;k<3;k++)ball('#7eaa57',x+(k-1)*.45,.6,-9,[.35,.45,.35]);}
    }else{
      box('#a77c53',33,.85,-5,[6,1.7,2]);
      for(const x of [30,36])cyl('#98754e',x,2,-6,.14,4);
      flower=group(33,4,-6);for(let k=0;k<6;k++)box(k%2?'#f8e6b9':'#e89862',k-2.5,0,0,[1,.2,3.5],flower);
      for(let k=0;k<10;k++)ball(k%2?'#ffc862':'#ef9863',31+k%5,.1+1.7,-5+Math.floor(k/5)*.5,[.32,.3,.3]);
      mechanism=group(38,1,-3);cyl('#98754e',38,.55,-3,.13,1.1);box('#e7c771',0,0,0,[1.7,.13,.15],mechanism);ball('#df8855',.8,0,.15,[.22,.22,.22],mechanism);
      // A personal umbrella springs up when fruit starts falling.
      ladder=group(33,3.6,-7);for(let k=0;k<8;k++){const angle=k*Math.PI/4;ball(k%2?'#ffce67':'#d58362',Math.cos(angle)*.55,0,Math.sin(angle)*.55,[.6,.15,.6],ladder);}
    }
    const bits=[];for(let k=0;k<14;k++)bits.push(ball(j?'#ffe075':'#fff0a8',n.x,0,n.z,j?[.15,.4,.13]:[.1,.1,.1]));
    stations.push({holdMark,useMark,mechanism,ladder,flower,bits});
  });
  return {rigs,stations,animate(s){
    NEIGHBORS.forEach((n,j)=>{
      const a=s.activities.areas[j],r=rigs[j],station=stations[j],t=s.time;
      const pose=neighborPose(a.npc,j,t,a.splash>0);
      r.body.position.y=pose.hop;r.body.rotation.z=pose.lean;r.head.rotation.z=pose.tilt;
      r.g.rotation.y=pose.facing?Math.atan2(s.players[a.npc.target].x-n.x,s.players[a.npc.target].z+7):Math.sin(t*.5)*.2;
      r.eyes.forEach(e=>e.scale.y=pose.eyes);r.mouth.scale.y=pose.mouth;r.arms.forEach((arm,k)=>{arm.rotation.x=pose.arms[k];arm.rotation.z=(k?1:-1)*(a.splash>0?.5:0);});
      station.holdMark.material=mat(a.holder===null?'#ffe8a1':'#84cc9e');station.useMark.material=mat(a.anchorDone?'#84cc9e':'#a9e1e6');
      station.mechanism.rotation.z=a.holder===null?Math.sin(t)*.07:j?t*3:Math.sin(t*4)*.2;
      station.ladder.visible=j?a.splash>0:a.holder!==null||s.players.some(p=>p.y>2.6&&Math.abs(p.x+29)<2.2&&Math.abs(p.z+5)<2);
      station.flower.rotation.z=Math.sin(t*(a.splash>0?12:2))*(a.splash>0?.2:.025);
      station.bits.forEach((bit,k)=>{bit.visible=a.splash>0;if(!bit.visible)return;const phase=(t*.8+k/14)%1;bit.position.set(n.x+Math.sin(k*2.4)*3,5-phase*4,n.z-3+Math.cos(k*2.4)*2);bit.rotation.z=t+k;});
    });
  }};
}
