// Shared anatomy keeps eyes and pupils together through every blink.
export function makeNeighbor(home,kind,h){
  const {group,ball,box,cyl,tube,textSprite}=h;
  const g=group(home.x,0,home.z),body=group();g.add(body);
  ball(home.color,0,1.25,0,kind===4?[.92,.85,.65]:kind===1?[.95,1,.62]:[.6,.85,.45],body);
  if(kind!==4)box(kind===1?'#f8e3b0':'#ead6ad',0,1.25,.48,[kind===1?1.5:.8,1.15,.13],body);
  if(kind===1)for(let y=.8;y<1.9;y+=.25)box('#d57759',0,y,.57,[1.35,.1,.06],body);
  if(kind===3)for(let k=0;k<5;k++)ball(['#df8067','#7fa879','#dfba59'][k%3],(k%3-1)*.22,1+(k%2)*.3,.56,[.09,.12,.02],body);
  const head=group(0,kind===4?2.2:2.5,0);body.add(head);ball('#e6ba8d',0,0,0,[.56,.62,.48],head);
  const eyes=[],legs=[],laces=[];
  for(const side of [-1,1]){
    const eye=group(side*.22,.09,.46);head.add(eye);
    ball('#fff6dd',0,0,0,[.14,.16,.065],eye);
    ball('#344e3e',0,0,.065,[.055,.075,.025],eye);eyes.push(eye);
    if(kind===0){
      const rim=Array.from({length:17},(_,k)=>[side*.22+Math.cos(k*Math.PI/8)*.175,.09+Math.sin(k*Math.PI/8)*.19,.55]);
      tube(rim,.018,'#596958',head);
    }
    if(kind===1)ball('#664c3b',side*.18,-.2,.5,[.29,.12,.1],head);
    const leg=group(side*.3,.7,0);body.add(leg);cyl('#4e6952',0,-.33,0,.2,.7,leg);ball(kind===4?'#b45f4e':'#685841',0,-.58,.16,kind===4?[.38,.22,.65]:[.27,.16,.39],leg);legs.push(leg);
    if(kind===4){box('#f7e7bf',0,-.7,.2,[.7,.09,1.15],leg);const lace=group(0,-.35,.3);leg.add(lace);tube([[-.25,0,0],[.2,0,.08],[-.2,0,.17],[.2,0,.26]],.025,'#fff3d1',lace);laces.push(lace);}
  }
  if(kind===0)box('#596958',0,.12,.55,[.12,.025,.025],head);
  ball('#dcad7f',0,-.06,.54,[.12,.13,.12],head);
  const mouth=ball('#814f43',0,-.31,.44,[.15,.14,.06],head);
  if(kind===1){cyl('#e8c362',0,.52,0,.75,.12,head);cyl('#e8c362',0,.67,0,.43,.25,head);tube([[-.3,.85,0],[0,1.05,0],[.3,.95,0]],.1,'#ffe277',head);}
  else if(kind===4){ball('#7a513b',0,.46,-.08,[.55,.22,.4],head);tube([[-.15,.55,0],[0,.85,0],[.2,.65,0]],.09,'#7a513b',head);box('#f6df99',0,1.5,.64,[.25,.5,.05],body);}
  else if(kind===3){ball('#57668d',0,.54,0,[.66,.2,.53],head);cyl('#57668d',0,.76,0,.06,.12,head);}
  else if(kind===2){for(const side of [-1,1])ball('#9b6547',side*.5,-.04,-.05,[.3,.42,.3],head);ball('#cf7183',0,.51,0,[.56,.2,.48],head);}
  else{ball('#74604c',0,.36,-.2,[.57,.4,.37],head);ball('#74604c',0,.68,-.2,[.32,.33,.3],head);ball('#ffcd71',.23,.73,0,[.18,.14,.1],head);}
  const arms=[];for(const side of [-1,1]){const arm=group(side*(kind===1||kind===4?.85:.55),1.9,0);body.add(arm);cyl(home.color,0,-.35,0,.18,.75,arm);ball('#e6ba8d',0,-.8,0,[.2,.22,.19],arm);arms.push(arm);}
  const label=textSprite(home.name.toUpperCase(),0,4.1,0,.65);g.add(label);
  const alert=textSprite('!',0,4.85,0,.75,'#fff5bc','#a55944');g.add(alert);alert.visible=false;
  const stars=group(0,3.2,0);body.add(stars);stars.visible=false;
  if(kind===4)for(let k=0;k<5;k++)ball('#ffe07b',Math.sin(k*1.26)*.8,0,Math.cos(k*1.26)*.8,[.12,.12,.12],stars);
  return {g,body,head,eyes,mouth,arms,legs,alert,laces,stars};
}

export function applyNeighborMotion(r,n,t){
  const moving=n.motion.kind==='chase'||n.motion.kind==='return';
  const blend=Math.min(1,n.clock/.125);
  r.g.position.set(n.previousX+(n.x-n.previousX)*blend,0,n.previousZ+(n.z-n.previousZ)*blend);
  if(moving||n.motion.kind==='rest')r.g.rotation.y=n.facing;
  r.alert.visible=n.motion.kind==='chase';
  r.legs.forEach((leg,k)=>leg.rotation.x=moving?Math.sin(n.walk+k*Math.PI)*.65:0);
  if(moving){r.body.position.y=Math.abs(Math.sin(n.walk))*.12;r.body.rotation.x=.14;r.arms.forEach((arm,k)=>{arm.rotation.x=n.reaction>0?-2.2:Math.sin(n.walk+k*Math.PI)*.9;});r.mouth.scale.y=.9;}
  else r.body.rotation.x=0;
  if(n.motion.kind==='rest')r.head.rotation.z=Math.sin(t*8)*.12;
}
