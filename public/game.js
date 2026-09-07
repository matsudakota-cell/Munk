import * as THREE from './vendor/three.module.js';
import {pose,PERSONALITIES} from './monkey-personality.mjs';
import {FISHERMAN,HAT_HOME,hatAction} from './fisherman.mjs';
import {fishermanPose} from './fisherman-personality.mjs';
import {createState,step,interact,jump,ook,missions,nearZone,dist,birdPose,ZONES,PADS,LADDERS,DRUMS,SONG,TRAMPOLINES,TARGETS} from './game-core.mjs';
const $=id=>document.getElementById(id);let state=createState(),running=false,started=false,muted=true,ac,time=0,last=performance.now(),toastUntil=0,split=false,winAt=0;const keys=new Set(),touchAxes=[[0,0],[0,0]];
const scene=new THREE.Scene();scene.background=new THREE.Color('#b7d9cd');scene.fog=new THREE.Fog('#b7d9cd',70,160);
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){$('start').textContent='3D graphics are unavailable';$('startOverlay').querySelector('p').textContent='Try opening Munks in a browser with hardware acceleration enabled.';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#b7d9cd');$('world').appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight('#fff4d7','#71916a',2.4);scene.add(hemi);const sun=new THREE.DirectionalLight('#fff0cf',3);sun.position.set(-30,55,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-66,right:66,top:66,bottom:-66,near:1,far:140});sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;scene.add(sun);scene.add(sun.target);
const cameras=[0,1,2].map(()=>new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,230));const targets=cameras.map(()=>new THREE.Vector3(0,0,4));const materials=new Map();function mat(c){if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.87,metalness:0}));return materials.get(c)}
const sphereGeo=new THREE.SphereGeometry(1,12,10),boxGeo=new THREE.BoxGeometry(1,1,1);function mesh(geo,c,x,y,z,scale=[1,1,1],parent=scene){const m=new THREE.Mesh(geo,typeof c==='string'?mat(c):c);m.position.set(x,y,z);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}function ball(c,x,y,z,scale=[1,1,1],parent=scene){return mesh(sphereGeo,c,x,y,z,scale,parent)}function box(c,x,y,z,scale,parent=scene){return mesh(boxGeo,c,x,y,z,scale,parent)}function cyl(c,x,y,z,r,h,parent=scene,rt=r){return mesh(new THREE.CylinderGeometry(rt,r,h,10),c,x,y,z,[1,1,1],parent)}function tube(points,r,c,parent=scene){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),16,r,7,false),c,0,0,0,[1,1,1],parent)}function group(x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);return g}
function terrainDisc(x,z,r,c,y=.025){const m=mesh(new THREE.CircleGeometry(r,48),c,x,y,z);m.rotation.x=-Math.PI/2;m.castShadow=false;return m}
function textSprite(text,x,y,z,size=1.4,color='#fff4d1',bg='#30583fe8'){const can=document.createElement('canvas');can.width=512;can.height=112;const c=can.getContext('2d');c.fillStyle=bg;c.beginPath();c.roundRect(0,0,512,112,25);c.fill();c.textAlign='center';c.textBaseline='middle';c.font='800 42px system-ui';c.fillStyle=color;c.fillText(text,256,58,480);const tex=new THREE.CanvasTexture(can);tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false}));sprite.position.set(x,y,z);sprite.scale.set(size*4.57,size,1);scene.add(sprite);return sprite}
const water=box('#7bbfba',0,-1.1,0,[250,.7,250]);water.castShadow=false;const land=box('#c8bd87',0,-1.3,0,[103,2.6,98]);const grass=box('#98b96b',0,-.12,0,[98,.3,93]);grass.castShadow=false;terrainDisc(0,0,12,'#a9c980');
// Broad sandy paths connect each playable neighborhood.
function path(points,width=4){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i],d=Math.hypot(bx-ax,bz-az),m=box('#ddcf9f',(ax+bx)/2,.05,(az+bz)/2,[width,.08,d]);m.rotation.y=Math.atan2(bx-ax,bz-az);terrainDisc(ax,az,width/2,'#ddcf9f',.095);terrainDisc(bx,bz,width/2,'#ddcf9f',.095)}}path([[0,36],[0,13],[0,0],[0,-18],[0,-37]],4.7);path([[-40,-28],[-29,-28],[-16,-10],[0,0],[17,-10],[28,-28],[40,-28]],4);path([[-41,25],[-29,25],[-16,17],[0,9],[17,17],[29,25],[41,25]],4.4);
let seed=12;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function tree(x,z,h=7,kind=0){const g=group(x,0,z);cyl('#886848',0,h*.38,0,.43,h*.76,g,.29);const top=kind?'#5c8a53':'#6b9a53';ball(top,0,h*.79,0,[2.45,2.2,2.1],g);ball(kind?'#729d5d':'#81a861',-1.35,h*.71,.5,[1.7,1.6,1.6],g);ball('#8fb56c',.8,h*.95,-.2,[1.45,1.35,1.4],g);state.solid.push({x,z,r:.52,h:3});return g}
for(let i=0;i<55;i++){let x=-46+rand()*92,z=-43+rand()*86;const clear=ZONES.some(a=>Math.hypot(x-a.x,z-a.z)<14)||Math.abs(x)<6||Math.hypot(x-12,z-35)<8;if(!clear)tree(x,z,5+rand()*4,i%2)}for(let i=0;i<23;i++){let x=-47+i*4.2;tree(x,-44,5+rand()*3,i%2);if(i%2===0)tree(x,44,5+rand()*2,1)}
for(let i=0;i<90;i++){let x=-46+rand()*92,z=-43+rand()*86;if(ZONES.some(a=>Math.hypot(x-a.x,z-a.z)<12)||Math.abs(x)<5)continue;const g=group(x,.1,z);for(let j=0;j<3;j++){let leaf=mesh(new THREE.ConeGeometry(.15,.7,3),'#6f9c52',j*.19,.2,0,[1,1,1],g);leaf.rotation.z=(j-1)*.35}if(i%4===0){cyl('#799855',0,.4,0,.045,.8,g);ball(i%3?'#f4da78':'#e4a29a',0,.83,0,[.25,.16,.25],g)}}
// Home base, little rope fences, and useful signposts.
const hut=group(0,0,34);box('#b88859',0,2,0,[7,4,5],hut);const roof=mesh(new THREE.ConeGeometry(5.8,3.1,4),'#71926a',0,5.3,0,[1,1,1],hut);roof.rotation.y=Math.PI/4;box('#59725a',0,1.5,2.53,[1.6,3,.1],hut);box('#f3d982',-2.1,2.4,2.54,[1.1,1.1,.1],hut);box('#f3d982',2.1,2.4,2.54,[1.1,1.1,.1],hut);textSprite('MUNKS HQ',0,6.8,34,1.1);state.solid.push({x:0,z:34,r:3,h:4});
for(const z of ZONES){cyl('#9d7950',z.x-8,1.5,z.z+7,.14,3);const sign=box('#fff1c3',z.x-8,2.8,z.z+7,[4.4,.9,.18]);textSprite(z.name,z.x,5,z.z+7,1.1,'#fff4d1','#36543eda')}
// Canopy Club: an elevated platform and two climbable ladders.
terrainDisc(-29,-28,13,'#87aa60');tree(-39,-32,11);tree(-19,-32,11);box('#ad8152',-29,6.7,-28.5,[20,.5,13]);for(let i=0;i<17;i++)box(i%2?'#b78f60':'#c69b67',-38.5+i*1.2,7,-28.5,[1.1,.15,13]);for(let x of [-38.8,-19.2]){box('#96724f',x,7.8,-28.5,[.16,1.5,13]);for(let z=-34;z<-22;z+=3)cyl('#866747',x,7.7,z,.1,1.7)}
LADDERS.forEach(l=>{for(const d of [-.65,.65])box('#eed295',l.x+d,3.5,l.z,[.18,7,.2]);for(let y=.5;y<7;y+=.65)box('#d9b276',l.x,y,l.z,[1.45,.13,.3]);textSprite('E / ↵  CLIMB',l.x,1.3,l.z+2,.7)});const bellMeshes=[];[-35,-23].forEach(x=>{cyl('#896b4e',x,9,-30,.12,4);box('#896b4e',x+.6,10.9,-30,[1.5,.17,.2]);let b=group(x+.6,10.2,-30);mesh(new THREE.CylinderGeometry(.35,.75,.95,14),'#efc359',0,0,0,[1,1,1],b);ball('#805d35',0,-.53,0,[.14,.14,.14],b);bellMeshes.push(b)});
// Jungle Jam: a bamboo stage with four playable notes.
terrainDisc(28,-28,12,'#b6c280');box('#a87f53',28,.3,-28,[18,.5,10]);for(let i=0;i<18;i++)box('#c3a072',19.5+i,.58,-28,[.85,.08,10]);const drums=[];DRUMS.forEach((d,i)=>{cyl(['#d69476','#c3b460','#86b4aa','#a798bc'][i],d.x,1.15,d.z,.9,1.6);const top=cyl('#f4e5be',d.x,2,d.z,.97,.16);drums.push(top);for(let j=0;j<8;j++){const a=j/8*Math.PI*2;cyl('#e4cca2',d.x+Math.cos(a)*.9,1.2,d.z+Math.sin(a)*.9,.035,1.5)}textSprite(d.note,d.x,3.1,d.z,.62,'#3c543d','#fff4d8')});textSprite('DO · MI · SO · LA · SO · DO',28,4.7,-34,1.1);const bunting=[];for(let i=0;i<10;i++){let flag=mesh(new THREE.ConeGeometry(.55,.9,3),['#e9b658','#d9917e','#8bb7ab'][i%3],19+i*2,5.2,-34);flag.rotation.z=Math.PI;bunting.push(flag)}tube([[18,5.9,-34],[28,5.2,-34],[38,5.9,-34]],.035,'#827153');
// Bubble Works: two pressure pedals and a rising fountain.
terrainDisc(-29,25,12,'#a8cbaa');cyl('#b7d0b4',-29,.25,22,3.4,.5);cyl('#82b6b2',-29,.51,22,2.8,.15);cyl('#dbd8b3',-29,1.05,22,.8,1.25);ball('#e9e2c3',-29,1.8,22,[1.15,.45,1.15]);const pedals=PADS.map((p,i)=>{tube([[p.x,.1,p.z],[p.x,.15,22],[-29,.15,22]],.16,'#76999a');const disk=cyl(i?'#8fcbd6':'#f2ca61',p.x,.2,p.z,1.8,.3);textSprite('STAND HERE',p.x,2.2,p.z+1,.65);return disk});const bubbleMat=new THREE.MeshPhysicalMaterial({color:'#c1eeee',transparent:true,opacity:.38,roughness:.08,metalness:.04,iridescence:.9,side:THREE.FrontSide,depthWrite:false});const bubbles=Array.from({length:35},(_,i)=>{const b=ball(bubbleMat,-29,2,22,[.3,.3,.3]);b.castShadow=false;b.userData={phase:i/35,dx:(rand()-.5)*9,dz:(rand()-.5)*9,r:.2+rand()*.5};b.visible=false;return b});
// Coconut Lanes: physical rolling balls knock over pineapple pins.
terrainDisc(29,25,13,'#b8bd78');box('#d4bf88',29,.06,23,[12,.15,24]);for(let i=0;i<3;i++)box(i%2?'#dec997':'#d6c18b',26+i*3,.15,23,[2.9,.05,24]);for(let x of [22.8,35.2])box('#af905f',x,.3,23,[.2,.5,24]);for(let i=0;i<3;i++)textSprite('E / ↵  ROLL',26+i*3,1.6,34,.6);const pins=TARGETS.map(t=>{const g=group(t.x,.4,t.z);ball('#e8c56c',0,.8,0,[.66,.94,.66],g);for(let i=0;i<6;i++){const leaf=mesh(new THREE.ConeGeometry(.18,1.2,4),'#6f985c',Math.cos(i)*.22,1.9,Math.sin(i)*.22,[1,1,1],g);leaf.rotation.z=Math.cos(i)*.4;leaf.rotation.x=Math.sin(i)*.4}return g});const coconuts=state.balls.map(b=>{const g=group(b.x,.7,b.z);ball('#8b684b',0,0,0,[.63,.63,.63],g);for(let a=0;a<3;a++)ball('#604f3b',Math.sin(a*2.1)*.2,.54,Math.cos(a*2.1)*.2,[.065,.03,.065],g);return g});
// Cloud Hoppers: springy pads and overhead hoops.
terrainDisc(0,0,10,'#b6cb8c');const trampMeshes=[],hoopMeshes=[];TRAMPOLINES.forEach((t,i)=>{const g=group(t.x,.15,t.z);cyl('#577c69',0,.3,0,1.8,.3,g);cyl(['#ebbc61','#9ec3d1','#c1add6'][i],0,.51,0,1.58,.12,g);for(let n=0;n<8;n++){const a=n*Math.PI/4;cyl('#c6b68e',Math.cos(a)*1.65,.25,Math.sin(a)*1.65,.07,.6,g)}trampMeshes.push(g);let hoop=mesh(new THREE.TorusGeometry(1.55,.13,8,32),'#f7d978',t.x,5,t.z);hoop.rotation.x=Math.PI/2;hoopMeshes.push(hoop)});textSprite('JUMP IN!',0,2.2,4,.8);
// Friendly local inhabitants roam independently.
function critter(x,z,c){let g=group(x,0,z);ball(c,0,.6,0,[.55,.5,.7],g);ball(c,0,1,.35,[.42,.4,.4],g);mesh(new THREE.ConeGeometry(.13,.5,6),'#f0c274',0,.94,.82,[1,1,1],g).rotation.x=Math.PI/2;for(let d of [-.17,.17])ball('#31463e',d,1.08,.68,[.045,.05,.035],g);return g}const birds=state.birds.map((bird,i)=>({g:critter(bird.x,bird.z,i%2?'#e6dfb9':'#dbac7e')}));
// One quiet fishing spot, with a hat on its own low stool.
terrainDisc(12,31,4.3,'#d6c392');terrainDisc(12,31,3.6,'#79b9b5',.06);
path([[5,36],[12,36],[14,37]],2);
const fishermanRig=(()=>{
 const g=group(FISHERMAN.x,0,FISHERMAN.z),body=new THREE.Group();g.add(body);
 box('#ad8059',0,.65,0,[1.65,.2,1.35],g);
 for(const x of [-.65,.65])for(const z of [-.5,.5])cyl('#8b694d',x,.32,z,.08,.65,g);
 ball('#e8ad7e',0,1.65,0,[.77,.9,.52],body);
 ball('#81a5a1',0,1.45,.08,[.79,.67,.54],body);
 const head=new THREE.Group();head.position.set(0,2.9,0);body.add(head);
 ball('#e8bd91',0,0,0,[.67,.7,.58],head);
 for(const side of [-1,1]){ball('#e8bd91',side*.65,0,0,[.16,.23,.17],head);ball('#e7e2cb',side*.51,.22,-.15,[.2,.32,.36],head);}
 const eyes=[],brows=[];
 for(const side of [-1,1]){
  const eye=ball('#fff7e6',side*.23,.09,.51,[.18,.17,.09],head);eyes.push(eye);
  ball('#394d48',side*.23,.08,.59,[.07,.09,.035],head);
  brows.push(box('#ded7bc',side*.23,.34,.54,[.34,.08,.08],head));
 }
 ball('#dfab7e',0,-.09,.66,[.22,.2,.23],head);
 for(const side of [-1,1])ball('#f0e7cd',side*.19,-.27,.59,[.27,.13,.14],head);
 const mouth=ball('#695342',0,-.42,.52,[.15,.03,.055],head);
 const arms=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.7,2.1,0);body.add(arm);
  ball('#81a5a1',0,-.3,0,[.23,.44,.23],arm);ball('#e8bd91',0,-.72,0,[.22,.23,.23],arm);arms.push(arm);
  ball('#536d72',side*.37,.69,.37,[.29,.43,.47],body);ball('#795e46',side*.37,.27,.62,[.3,.24,.46],body);
 }
 const rod=new THREE.Group();rod.position.set(-.72,1.1,.55);body.add(rod);
 tube([[0,0,0],[0,1.4,1.5],[0,2,3.4]],.045,'#9c8055',rod);
 tube([[0,2,3.4],[0,.1,3.6]],.015,'#e8e3cb',rod);
 ball('#e99879',0,.12,3.6,[.12,.15,.12],rod);
 return {g,body,head,eyes,brows,mouth,arms,rod};
})();
state.solid.push({x:FISHERMAN.x,z:FISHERMAN.z,r:.8,h:3});
cyl('#b58c5f',HAT_HOME.x,.4,HAT_HOME.z,.65,.8);
const fishermanHat=group();
cyl('#edce83',0,0,0,.82,.12,fishermanHat);
cyl('#edce83',0,.23,0,.49,.42,fishermanHat,.39);
cyl('#88a6a0',0,.1,0,.5,.13,fishermanHat);
const feather=tube([[.38,.2,0],[.64,.65,0],[.55,.95,0]],.065,'#e49a7f',fishermanHat);
function animateFisherman(){
 const f=state.fisherman,a=fishermanPose(f),m=fishermanRig;
 m.g.rotation.y=a.facing;m.body.position.y=a.bounce;m.body.rotation.x=a.lean;
 m.head.rotation.set(0,a.headTurn,a.headTilt);
 m.eyes.forEach(e=>e.scale.y=a.eyeOpen*.17);
 m.brows.forEach(b=>b.position.y=.34+a.brow);m.mouth.scale.y=a.mouth;
 m.arms.forEach((arm,i)=>arm.rotation.set(i?a.rightArm:a.leftArm,0,(i?1:-1)*a.shrug));
 m.rod.rotation.x=a.rod;
 const hat=f.hat,holder=hat.heldBy;
 if(holder!==null){
  // Parent to the animated head: it stays attached through jumps and bonks.
  if(fishermanHat.parent!==monkeys[holder].head)monkeys[holder].head.add(fishermanHat);
  fishermanHat.position.set(0,.67,0);fishermanHat.rotation.set(.08,0,holder?-.18:.18);
 }else{
  if(fishermanHat.parent!==scene)scene.add(fishermanHat);
  fishermanHat.position.set(hat.x,hat.place==='stool'?.88:.18,hat.z);
  fishermanHat.rotation.set(0,0,hat.place==='ground'?.13:0);
 }
 feather.rotation.z=Math.sin(state.time*3)*.06;
}
// Articulated 3D monkeys, each with a contrasting scarf and curly tail.
function monkey(color,i){
 const personality=PERSONALITIES[i],fur=personality.fur,skin=personality.skin;
 const g=group(),body=new THREE.Group();g.add(body);
 ball(fur,0,1.04,0,[i?.55:.46,i?.65:.67,.38],body);
 ball(skin,0,1.1,.29,[i?.37:.29,.43,.15],body);
 const head=new THREE.Group();head.position.set(0,2,0);body.add(head);
 ball(fur,0,0,0,[i?.75:.7,.64,.56],head);
 const ears=[],eyes=[],pupils=[],brows=[],cheeks=[];
 for(const side of [-1,1]){
  const ear=new THREE.Group();ear.position.set(side*.7,.01,0);head.add(ear);ball(fur,0,0,0,[i?.27:.32,.31,.2],ear);ball('#ddaa85',side*.025,0,.16,[.18,.21,.055],ear);ears.push(ear);
  ball(skin,side*.24,-.005,.43,[.31,.34,.18],head);
  const eye=new THREE.Group();eye.position.set(side*.245,.08,.555);head.add(eye);
  ball('#fff9e8',0,0,0,[.146,.181,.065],eye);
  const pupil=new THREE.Group();pupil.position.set(0,-.012,.055);eye.add(pupil);ball('#334133',0,0,0,[.083,.108,.036],pupil);ball('#fffdf2',-.02,.04,.032,[.03,.034,.012],pupil);eyes.push(eye);pupils.push(pupil);
  const brow=tube([[-.12,0,0],[0,.04,.025],[.12,.005,0]],.031,i?'#6c5545':'#795332',head);brow.position.set(side*.245,.315,.55);brows.push(brow);
  cheeks.push(ball(i?'#df9e91':'#e2ac83',side*.43,-.17,.5,[.105,.065,.027],head));
 }
 ball(skin,0,-.22,.49,[.33,.21,.2],head);ball('#6b4d34',0,-.14,.673,[.075,.05,.032],head);
 const smile=new THREE.Group();head.add(smile);tube([[-.17,-.25,.655],[0,-.32,.706],[.17,-.25,.655]],.027,'#78533b',smile);
 if(!i)box('#fff9df',.05,-.306,.716,[.095,.09,.024],smile);
 const mouth=new THREE.Group();mouth.position.set(0,-.28,.677);head.add(mouth);ball('#674835',0,0,0,[.13,1,.045],mouth);ball('#eeaa9f',0,-.45,.035,[.083,.35,.015],mouth);mouth.visible=false;
 // Their silhouettes remain different even when the camera is far away.
 if(!i){for(let j=0;j<3;j++)tube([[j*.09-.1,.52,0],[j*.12-.14,.79+j*.05,.02],[j*.14-.1,.86+j*.04,.12]],.07,fur,head)}
 else tube([[-.18,.54,.02],[-.11,.76,.02],[.17,.74,.05],[.24,.57,.08],[.06,.55,.12]],.085,fur,head);
 cyl(color,0,1.55,0,.42,.18,body);const scarf=box(color,i?-.28:.3,1.27,-.22,[.25,.62,.12],body);scarf.rotation.z=i?.25:-.25;
 const arms=[],legs=[];for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.46,1.43,0);body.add(arm);ball(fur,side*.09,-.35,0,[.17,.46,.17],arm);ball(skin,side*.13,-.75,.05,[.2,.19,.21],arm);arms.push(arm);
  const leg=new THREE.Group();leg.position.set(side*.23,.58,0);body.add(leg);ball(fur,0,-.18,0,[.19,.33,.2],leg);ball(skin,0,-.46,.13,[.23,.15,.3],leg);legs.push(leg);
 }
 const tail=tube([[0,.75,-.22],[.2,.67,-.85],[.65,.95,-1.1],[.86,1.48,-.93],[.57,1.71,-.88],[.41,1.46,-.88]],i?.095:.085,fur,body);
 const marker=mesh(new THREE.RingGeometry(.55,.67,32),color,0,.07,0);scene.remove(marker);g.add(marker);marker.rotation.x=-Math.PI/2;marker.castShadow=false;
 const stars=new THREE.Group();g.add(stars);const shape=new THREE.Shape();for(let n=0;n<10;n++){const a=n*Math.PI/5+Math.PI/2,r=n%2?.08:.18;if(n===0)shape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else shape.lineTo(Math.cos(a)*r,Math.sin(a)*r)}shape.closePath();const starGeo=new THREE.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:false});for(let j=0;j<3;j++){const a=j*Math.PI*2/3;mesh(starGeo,'#ffda6d',Math.cos(a)*.68,2.95,Math.sin(a)*.4,[1,1,1],stars)}stars.visible=false;
 const dust=new THREE.Group();scene.add(dust);const dustMaterial=new THREE.MeshBasicMaterial({color:'#f6e6bd',transparent:true,opacity:0,depthWrite:false});for(let j=0;j<6;j++){const a=j*Math.PI/3;ball(dustMaterial,Math.cos(a),0,Math.sin(a),[.22,.12,.22],dust).castShadow=false}
 return {g,body,head,eyes,pupils,brows,ears,cheeks,mouth,smile,scarf,arms,legs,tail,stars,dust,dustMaterial};
}
const monkeys=[monkey('#f1c453',0),monkey('#8ecddf',1)];const names=[textSprite('PIP',-2,3,12,.6,'#3a523b','#f4d078'),textSprite('MOMO',2,3,12,.6,'#3a523b','#a5d8e3')];const ookLabels=[textSprite('OOOK!',0,4,0,.9),textSprite('OOOK!',0,4,0,.9)];ookLabels.forEach(l=>l.visible=false);
const bonkLabels=[textSprite('BONK!',0,4,0,.72,'#604b3d','#ffe1a6'),textSprite('oops!',0,4,0,.72,'#604b3d','#f6dbd7')];const loveLabels=[textSprite('hey, buddy ♥',0,4,0,.65,'#854f4f','#ffe6d9'),textSprite('oh, hello ♥',0,4,0,.65,'#854f4f','#ffe6d9')];[...bonkLabels,...loveLabels].forEach(l=>l.visible=false);
let confetti=[];function celebrate(x,z){for(let i=0;i<24;i++){const m=box(['#f4cd65','#91ccd7','#eda891','#b4c47b'][i%4],x,2,z,[.13,.2,.08]);m.castShadow=false;confetti.push({m,v:new THREE.Vector3((rand()-.5)*9,5+rand()*6,(rand()-.5)*9),life:2.4})}}
function sound(freq,d=.18,delay=0,volume=.045){if(muted)return;try{ac??=new(window.AudioContext||window.webkitAudioContext)();ac.resume();const o=ac.createOscillator(),g=ac.createGain(),start=ac.currentTime+delay;o.type='sine';o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.001,start+d);o.connect(g);g.connect(ac.destination);o.start(start);o.stop(start+d)}catch{}}
const REPLY_NOTES={
 pip_bow:[370,290],pip_salute:[460],pip_dance:[350,440,390],
 pip_echo:[480,320,480,320],momo_giggle:[390,430,390],
 momo_wave:[280,330],momo_clap:[330,370,410],
};
function handleOokEvent(event){
 if(event.type==='ook-reaction')return true;
 if(event.type==='bird-scatter'){
   sound(980,.08,0,.018);sound(1220,.07,.12,.014);return true;
 }
 if(event.type!=='ook'&&event.type!=='ook-reply')return false;
 const notes=event.type==='ook'?(event.player===0?[360,440]:[270,310]):REPLY_NOTES[event.kind]||[];
 const volume=event.kind==='pip_echo'?.06:.035;
 notes.forEach((note,index)=>sound(note,.14,index*.16,volume));
 return true;
}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;toastUntil=time+4.5}
function begin(){started=true;running=true;keys.clear();$('startOverlay').hidden=true;$('pauseOverlay').hidden=true;$('winOverlay').hidden=true;$('world').focus();last=performance.now()}
function pause(){if(!started)return;running=false;keys.clear();$('pauseOverlay').hidden=false}
function restart(){const solids=state.solid;state=createState();state.solid=solids;confetti.forEach(p=>scene.remove(p.m));confetti=[];toastUntil=0;winAt=0;begin();refresh()}
$('start').onclick=begin;$('resume').onclick=begin;$('pause').onclick=pause;$('restart').onclick=restart;$('playAgain').onclick=restart;$('keepPlaying').onclick=begin;$('audio').onclick=()=>{muted=!muted;$('audio').textContent=muted?'♫ Sound off':'♫ Sound on';$('audio').setAttribute('aria-pressed',String(!muted));sound(500)};
$('missionToggle').onclick=()=>{const list=$('missionList');list.hidden=!list.hidden;$('missionToggle').setAttribute('aria-expanded',String(!list.hidden))};let mapResume=false;function closeMap(){ $('mapOverlay').hidden=true;$('mapButton').setAttribute('aria-expanded','false');if(mapResume)begin() }$('mapButton').onclick=()=>{mapResume=running;running=false;keys.clear();$('mapOverlay').hidden=false;$('mapButton').setAttribute('aria-expanded','true');drawMap()};$('closeMap').onclick=closeMap;
const handled=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','Enter','KeyQ','Slash','Space','ShiftLeft','ShiftRight','Escape'];window.addEventListener('keydown',e=>{if(!handled.includes(e.code))return;if(e.target.tagName==='BUTTON'&&!running&&e.code==='Enter')return;e.preventDefault();if(e.repeat)return;if(e.code==='Escape'){if(!$('mapOverlay').hidden)closeMap();else if(running)pause();else if(started)begin();return}keys.add(e.code);if(!running)return;if(e.code==='KeyE')interact(state,0);if(e.code==='Enter')interact(state,1);if(e.code==='KeyQ')ook(state,0);if(e.code==='Slash')ook(state,1);if(e.code==='Space')jump(state,0);if(e.code==='ShiftLeft'||e.code==='ShiftRight')jump(state,1)});window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(running)pause()});
for(const pad of document.querySelectorAll('.touchpad')){const i=Number(pad.dataset.player),codes=i?['ArrowLeft','ArrowUp','ArrowDown','ArrowRight']:['KeyA','KeyW','KeyS','KeyD'];['←','↑','↓','→','Do','Jump','Ook'].forEach((label,j)=>{const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',(i?'Momo ':'Pip ')+label);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!running)return;if(j<4)keys.add(codes[j]);else if(j===4)interact(state,i);else if(j===5)jump(state,i);else ook(state,i)};b.onpointerup=b.onpointercancel=()=>{if(j<4)keys.delete(codes[j])};pad.appendChild(b)})}
function contextHint(p,i){const key=i?'↵':'E';if(LADDERS.some(l=>dist(p,l)<3))return `${key} · ${p.y>3?'Climb down':'Climb into the canopy'}`;if(p.y>6&&[-35,-23].some(x=>dist(p,{x,z:-30})<3.5))return `${key} · Ring your bell — partner rings the other`;const d=DRUMS.find(d=>dist(p,d)<2.7);if(d)return `${key} · Play ${d.note}  |  Next: ${state.songComplete?'Encore!':DRUMS[SONG[state.band]].note}`;if(state.balls.some(b=>dist(p,b)<3.4))return `${key} · Roll this coconut`;if(PADS.some(t=>dist(p,t)<2))return 'Stay on your pedal. Your partner takes the other!';if(TRAMPOLINES.some(t=>dist(p,t)<3))return 'Bounce up through the golden hoop!';const hat=hatAction(state.fisherman,p,i);if(hat)return `${key} · ${hat==='take'?'Try on the hat':hat==='return'?'Put the hat back':'Put the hat down'}`;return ''}
let lastUI='';function refresh(){const ms=missions(state),nearest=nearZone(state.players[0]);const signature=JSON.stringify(ms.map(m=>[m.done,m.progress]))+nearest.id;if(signature!==lastUI){lastUI=signature;$('missionList').innerHTML=ms.map((m,i)=>`<div class="mission ${m.done?'done':m.zone.id===nearest.id?'active':''}"><div class="num">${m.done?'✓':i+1}</div><div><b>${m.short}</b><small>${m.zone.name} · ${m.progress}</small></div></div>`).join('');$('score').textContent=`${ms.filter(m=>m.done).length} / 5`}$('hint0').textContent=contextHint(state.players[0],0);$('hint1').textContent=contextHint(state.players[1],1);$('location').innerHTML=split?'Off on your own adventures<span>A WHOLE ISLAND TO EXPLORE</span>':`${nearest.name}<span>MONKEY ISLAND</span>`;$('location').style.opacity=($('hint0').textContent||$('hint1').textContent)?'0':'1'}
function drawMap(){const c=$('map').getContext('2d');c.clearRect(0,0,640,530);c.fillStyle='#92c5ba';c.beginPath();c.roundRect(0,0,640,530,28);c.fill();c.fillStyle='#abc580';c.beginPath();c.roundRect(30,25,580,480,55);c.fill();const pt=(x,z)=>[320+x*5.4,260+z*5];c.strokeStyle='#e6d5a7';c.lineWidth=15;c.lineCap='round';ZONES.forEach(z=>{c.beginPath();c.moveTo(320,300);c.lineTo(...pt(z.x,z.z));c.stroke()});missions(state).forEach((m,i)=>{const [x,z]=pt(m.zone.x,m.zone.z);c.fillStyle=m.done?'#4e855f':m.zone.color;c.beginPath();c.arc(x,z,27,0,7);c.fill();c.fillStyle='#304f3c';c.textAlign='center';c.font='bold 20px system-ui';c.fillText(m.done?'✓':String(i+1),x,z+7);c.font='bold 14px system-ui';c.fillText(m.zone.name,x,z+49)});state.players.forEach((p,i)=>{const [x,z]=pt(p.x,p.z);c.fillStyle=i?'#75bedb':'#f5c94f';c.strokeStyle='#fff8dc';c.lineWidth=3;c.beginPath();c.arc(x,z,9,0,7);c.fill();c.stroke();c.fillStyle='#304c3d';c.font='bold 12px system-ui';c.fillText(i?'Momo':'Pip',x,z-16)})}
const cameraDesired=new THREE.Vector3();function cameraFor(cam,target,index,aspect,distance,dt){cam.aspect=aspect;cam.updateProjectionMatrix();targets[index].lerp(target,1-Math.exp(-dt*4));const t=targets[index];const portrait=Math.max(1,1.25/aspect);cameraDesired.set(t.x,t.y+distance*.88*portrait,t.z+distance*1.08*portrait);cam.position.lerp(cameraDesired,1-Math.exp(-dt*4));cam.lookAt(t.x,t.y+.8,t.z);}
function render(dt){const a=state.players[0],b=state.players[1],gap=dist(a,b);if(gap>27)split=true;else if(gap<21)split=false;$('splitLine').hidden=!split;let w=innerWidth,h=innerHeight;renderer.setScissorTest(split);if(split){for(let i=0;i<2;i++){const p=state.players[i],cw=w/2;cameraFor(cameras[i+1],new THREE.Vector3(p.x,p.y*.6,p.z),i+1,cw/h,18,dt);renderer.setViewport(i*cw,0,cw,h);renderer.setScissor(i*cw,0,cw,h);renderer.render(scene,cameras[i+1])}}else{const cam=cameras[0];cameraFor(cam,new THREE.Vector3((a.x+b.x)/2,(a.y+b.y)*.3,(a.z+b.z)/2),0,w/h,Math.max(20,17+gap*.6),dt);renderer.setViewport(0,0,w,h);renderer.render(scene,cam)}}
function animate(t){const dt=Math.min(.04,(t-last)/1000);last=t;if(running){time+=dt;const axes=[[Number(keys.has('KeyD'))-Number(keys.has('KeyA')),Number(keys.has('KeyS'))-Number(keys.has('KeyW'))],[Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'))]];step(state,dt,axes);for(const e of state.events.splice(0)){if(handleOokEvent(e))continue;if(e.type==='bonk'){sound(135,.14)}else if(e.type==='land'){sound(95,.055)}else if(e.type==='note'){sound([262,330,392,440][Math.max(0,DRUMS.findIndex(d=>d.note===e.text))],.25);const j=DRUMS.findIndex(d=>d.note===e.text);if(j>=0)drums[j].scale.y=2}else if(e.type==='bounce'){sound(210,.16)}else if(e.type==='bell'){sound(880,.5);toast(e.text)}else{toast(e.text);if(e.type==='win'||e.type==='pin'){sound(e.type==='win'?660:170,.2);celebrate(e.x,e.z)}if(e.type==='complete'){winAt=time+2.6;}}}if(time>toastUntil)$('toast').hidden=true;if(winAt&&time>=winAt){winAt=0;$('winOverlay').hidden=false;running=false;keys.clear()}}
state.players.forEach((p,i)=>{
 const m=monkeys[i],acting=pose(p,i,time),moving=p.moving;
 m.g.position.set(p.x,p.y,p.z);const facing=p.idle>2.5?0:p.angle;const delta=THREE.MathUtils.euclideanModulo(facing-m.g.rotation.y+Math.PI,Math.PI*2)-Math.PI;m.g.rotation.y+=delta*Math.min(1,dt*12);
 m.body.scale.set(acting.scaleX,acting.scaleY,acting.scaleX);
 m.body.rotation.set((moving&&!p.air?.10:0)+acting.bodyLean,acting.spin,acting.tilt);
 m.body.position.y=acting.hop+(moving?Math.abs(Math.sin(p.walk))*.075:Math.sin(time*2+i)*.025);
 const friend=state.players[1-i],look=(!moving&&dist(p,friend)<9)?THREE.MathUtils.clamp(THREE.MathUtils.euclideanModulo(Math.atan2(friend.x-p.x,friend.z-p.z)-m.g.rotation.y+Math.PI,Math.PI*2)-Math.PI,-.38,.38):0;
 m.head.rotation.set((acting.air?-.13:acting.habit&&i?.1:0)+acting.headNod,look,acting.headTilt);
 m.eyes.forEach((e,j)=>e.scale.y=acting.eyeOpen*(acting.bonk&&j?.7:1));
 m.pupils.forEach(pupil=>{pupil.position.x=look*.055;pupil.position.y=-.012+(acting.air?.025:0)});
 m.brows.forEach((b,j)=>{b.position.y=.315+acting.browLift;b.rotation.z=acting.bonk?(j?-.35:.35):acting.habit&&!i?(j?-.16:.22):i?(j?-.08:.08):0});
 m.ears.forEach((e,j)=>{e.rotation.z=Math.sin(time*(acting.bonk?20:3)+j)* ((acting.bonk?.32:moving?.08:.025)+acting.earWiggle)});
 m.mouth.visible=acting.mouthOpen>0;m.mouth.scale.y=Math.max(.001,acting.mouthOpen);m.smile.visible=!m.mouth.visible;
 m.scarf.rotation.x=Math.sin(p.walk*.8)* (moving?.4:.08);
 m.arms.forEach((arm,j)=>{
  arm.rotation.set(p.air?-1.5:moving?Math.sin(p.walk+j*Math.PI)*.65:Math.sin(time*2+j)*.04,0,0);
  if(acting.bonk){arm.rotation.z=(j?1:-1)*1.1;arm.rotation.x=-.3}
  else if(acting.cheer){arm.rotation.x=i?-1.5:-2.6;arm.rotation.z=i?(j?-1:1)*(.45+Math.sin(time*14)*.23):(j?.55:-.55)}
  else if(acting.armPose){arm.rotation.x=acting.armPose[j][0];arm.rotation.z=acting.armPose[j][1]}
  else if(acting.calling){arm.rotation.x=-1.4;arm.rotation.z=j?-.32:.32}
  else if(acting.greet){arm.rotation.z=j===1?2.5+Math.sin(time*12)*.25:0;arm.rotation.x=j===1?-.2:0}
  else if(acting.habit){if(!i&&j===1){arm.rotation.z=-2.5+Math.sin(time*9)*.12;arm.rotation.x=-.1}else if(i){arm.rotation.x=-1;arm.rotation.z=(j?-1:1)*(.3+Math.sin(time*4)*.13)}}
 });
 m.legs.forEach((l,j)=>{l.rotation.x=p.air?.3:moving?Math.sin(p.walk+j*Math.PI)*.5:acting.cheer?Math.sin(time*8+j)*.15:0;l.rotation.z=acting.bonk?(j?.15:-.15):0});
 m.tail.rotation.z=Math.sin(time*(acting.greet?7:2)+i)*((acting.greet?.28:.1)+acting.tailSwing);m.tail.rotation.x=acting.air?.25:0;
 m.stars.visible=acting.bonk;m.stars.rotation.y=time*5;
 m.dust.position.set(p.x,p.y+.08,p.z);m.dust.scale.setScalar(1+(1-Math.min(1,p.land/.36))*1.2);m.dustMaterial.opacity=p.land>0?p.land/.36*.5:0;
 names[i].position.set(p.x,p.y+3.25,p.z);ookLabels[i].visible=(p.ook>0&&!acting.reactionKind)||acting.replying;ookLabels[i].position.set(p.x,p.y+4.1,p.z);ookLabels[i].scale.set(acting.replying?5.2:4.113,acting.replying?1.15:.9,1);
 bonkLabels[i].visible=acting.bonk;bonkLabels[i].position.set(p.x,p.y+3.85,p.z);
 loveLabels[i].visible=acting.greet&&!acting.bonk&&!acting.calling;loveLabels[i].position.set(p.x,p.y+3.8+Math.sin(time*3)*.12,p.z);
});
animateFisherman();
bellMeshes.forEach((b,i)=>b.rotation.z=state.bellUntil[i]>state.time?Math.sin(time*15)*.3:0);drums.forEach(d=>d.scale.y+=(1-d.scale.y)*dt*9);pedals.forEach((p,i)=>{const down=state.players.some(a=>dist(a,PADS[i])<1.9);p.position.y=down?.1:.2;p.material=mat(down?'#fff0a3':i?'#8fcbd6':'#f2ca61')});bubbles.forEach((b,i)=>{b.visible=state.bubbles||state.foam>1;if(!b.visible)return;const d=b.userData,t=(time*.17+d.phase)%1;b.position.set(-29+d.dx*t,1.7+t*11,22+d.dz*t);b.scale.setScalar(d.r*(.4+t));});pins.forEach((p,i)=>{const target=state.pins[i].down?-Math.PI/2:0;p.rotation.x+=(target-p.rotation.x)*dt*10});coconuts.forEach((g,i)=>{const b=state.balls[i];g.position.set(b.x,.74,b.z);if(running)g.rotation.x+=b.vz*dt*1.3});hoopMeshes.forEach((h,i)=>{h.material=mat(state.hoops[i]?'#9bd9a8':'#f4d474');h.rotation.z=time*.2;h.position.y=5+Math.sin(time*2+i)*.1});birds.forEach((bird,i)=>{const at=birdPose(state.birds[i],state.time);bird.g.position.set(at.x,at.y,at.z);bird.g.rotation.set(0,at.facing,at.tilt)});bunting.forEach((f,i)=>f.rotation.x=Math.sin(time*2+i)*.1);
if(running)confetti=confetti.filter(p=>{p.life-=dt;p.v.y-=12*dt;p.m.position.addScaledVector(p.v,dt);p.m.rotation.x+=dt*4;if(p.life<=0){scene.remove(p.m);return false}return true});refresh();render(Math.max(dt,.001));requestAnimationFrame(animate)}
function resize(){renderer.setSize(innerWidth,innerHeight);cameras.forEach(c=>{c.aspect=innerWidth/innerHeight;c.updateProjectionMatrix()})}window.addEventListener('resize',resize);resize();cameras.forEach(c=>{c.position.set(0,22,39);c.lookAt(0,0,8)});$('start').disabled=false;$('start').textContent='Let’s explore →';refresh();requestAnimationFrame(animate);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();toast('The 3D view paused. Reload the page to restore it.')});window.munks={getState:()=>({running,splitScreen:split,missions:missions(state).map(m=>({name:m.short,done:m.done,progress:m.progress})),players:state.players.map((p,i)=>({name:i?'Momo':'Pip',x:p.x,y:p.y,z:p.z}))}),restart};
if(document.modelContext?.registerTool){const lifecycle=new AbortController();for(const tool of [{name:'get_munks_progress',description:'Read the monkey island missions and both player positions.',annotations:{readOnlyHint:true},execute:()=>window.munks.getState()},{name:'restart_munks_game',description:'Clear mission progress and restart the 3D monkey adventure.',annotations:{readOnlyHint:false},execute:input=>{if(input&&Object.keys(input).length)throw Error('No arguments accepted');restart();return window.munks.getState()}}]){try{Promise.resolve(document.modelContext.registerTool({...tool,inputSchema:{type:'object',properties:{},additionalProperties:false}},{signal:lifecycle.signal})).catch(()=>{})}catch{}}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}
