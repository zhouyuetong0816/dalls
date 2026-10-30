import {archiveMembers} from './archive-members.js?v=necklace1';
import * as THREE from './vendor/three.module.js';
// World anchors use the same scene coordinates as future doll placements.
// Image-relative percentages are projected from the fixed reference camera.
export const photoSpots = [
 {id:'photoSpot_01',name:'椅子',position:[-2.95,.525,1.08]},
 {id:'photoSpot_02',name:'咖啡桌',position:[.05,.93,1.75]},
 {id:'photoSpot_03',name:'沙发',position:[2.43,1.915,-2.02]},
 {id:'photoSpot_04',name:'展示架',position:[-7.28,2.055,1.55]},
 {id:'photoSpot_05',name:'蛋糕陈列柜',position:[-.35,1.575,-.85]},
 {id:'photoSpot_06',name:'展示柜',position:[-6.05,1.575,-.81]},
 {id:'photoSpot_07',name:'展示架',position:[-5.35,.925,3.7],extraPositions:[[-6.65,1.175,3.75]]}
];
const page=document.createElement('section');page.id='cafe-page';page.hidden=true;
page.innerHTML='<div class="cafe-heading"><h1>SNOOT CLUB CAFÉ</h1><p>a little place for little things.</p><p class="cafe-help"><span>拖动娃娃，自由摆放。</span><span>出现地点提示时松手，即可查看对应照片。</span><span>拖动空白处调整视角，点「归位」恢复摆放。</span></p></div><div class="cafe-scene" aria-label="奶油色微缩咖啡厅，拖动可小幅调整视角"><div class="cafe-fallback" hidden>咖啡厅场景需要支持 WebGL 的浏览器。</div></div>';
document.querySelector('#home-page').before(page);
let mounted=false,renderScene;
function mount(){
 const host=page.querySelector('.cafe-scene');const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-6,6,6,-6,.1,80);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,2),3));renderer.setClearColor(0xffffff,0);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','SNOOT CLUB CAFÉ 三维场景');
 const root=new THREE.Group();scene.add(root);
 const material=(color,extras={})=>new THREE.MeshStandardMaterial({color,roughness:.95,...extras});
 const cream=material('#eee6d8'),wall=material('#f5efe5'),wood=material('#ae713d'),pale=material('#c6965a'),green=material('#536c44'),pot=material('#986340'),stone=material('#ded2be'),cake=material('#e8c99a'),pink=material('#caa998'),mustard=material('#d6b149'),seat=material('#aa5038');
 // Small procedural textures keep materials lightweight and avoid external downloads.
 function surfaceTexture(kind){const c=document.createElement('canvas');c.width=c.height=256;const t=c.getContext('2d');t.fillStyle=kind==='wood'?'#b78250':'#efe5d2';t.fillRect(0,0,256,256);let seed=17;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};if(kind==='wood'){for(let i=0;i<65;i++){t.strokeStyle=i%3?'rgba(80,43,18,.08)':'rgba(255,235,190,.12)';t.lineWidth=.5+rand();t.beginPath();const y=rand()*256;for(let x=0;x<=256;x+=8){const yy=y+Math.sin(x*.026+i)*2.5;x?t.lineTo(x,yy):t.moveTo(x,yy);}t.stroke();}}else{for(let i=0;i<1800;i++){t.fillStyle=i%2?'rgba(125,104,72,.055)':'rgba(255,255,255,.16)';t.fillRect(rand()*256,rand()*256,1,1);}for(let x=16;x<256;x+=32){t.strokeStyle='rgba(148,123,80,.05)';t.beginPath();t.moveTo(x,0);t.lineTo(x,256);t.stroke();}}const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(kind==='wood'?2:3,kind==='wood'?2:3);return texture;}
 const timberTexture=surfaceTexture('wood');wood.map=timberTexture;pale.map=timberTexture;wood.color.set('#d9b78b');pale.color.set('#f0d6ad');wall.map=surfaceTexture('wall');wall.color.set('#ffffff');
 function mesh(geometry,mat,x,y,z,parent=root){const o=new THREE.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,x,y,z,mat=cream,parent=root)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
 const cylinder=(r,h,x,y,z,mat=wood,parent=root,r2=r)=>mesh(new THREE.CylinderGeometry(r,r2,h,32),mat,x,y,z,parent);
 const ball=(r,x,y,z,mat,parent=root)=>mesh(new THREE.SphereGeometry(r,16,12),mat,x,y,z,parent);
 box(8,.42,6,0,-.21,0);box(7.88,.06,5.88,0,.03,0,material('#879368'));
 // Mustard wall skirts echo the reference cafe, above olive floors.
 box(.025,1.22,5.94,-3.865,.67,0,mustard);box(4.82,1.22,.025,-1.55,.67,-2.865,mustard);
 box(3.04,.62,.025,2.45,1.57,-2.865,mustard);
 // Two back walls only; all spectator-facing edges stay open.
 box(.16,4.1,6,-3.96,2.05,0,wall);box(4.9,4.1,.16,-1.55,2.05,-2.96,wall);
 box(3.1,.72,.16,2.45,1.56,-2.96,wall);box(3.1,.55,.16,2.45,4.075,-2.96,wall);
 box(.4,2,.16,1.1,2.85,-2.96,wall);box(.35,2,.16,3.78,2.85,-2.96,wall);
 const windowMat=material('#edf3ef',{transparent:true,opacity:.28,depthWrite:false});
 box(2.32,1.84,.035,2.4,2.83,-2.95,windowMat);
 for(const x of [1.2,3.6])box(.07,2,.11,x,2.85,-2.84,pale);
 for(const y of [1.86,3.84])box(2.48,.07,.14,2.4,y,-2.84,pale);
 box(.045,1.98,.08,2.4,2.85,-2.84,pale);box(2.6,.09,.35,2.4,1.84,-2.75,cream);
 // Half-open vintage curtains: softly pleated linen with muted rose trim.
 const linen=material('#dfcbaa'),trim=material('#b98575');cylinder(.025,2.85,2.4,3.98,-2.68,pot).rotation.z=Math.PI/2;
 for(const side of [-1,1]){const curtain=new THREE.BufferGeometry(),v=[],idx=[];const N=24,M=12;for(let row=0;row<=M;row++)for(let col=0;col<=N;col++){const u=col/N,t=row/M;const width=.63-.2*Math.sin(t*Math.PI);v.push(2.4+side*(1.22-u*width),3.9-t*1.98,-2.66+Math.cos(u*Math.PI*10)*.035);}for(let row=0;row<M;row++)for(let col=0;col<N;col++){const A=row*(N+1)+col;idx.push(A,A+N+1,A+N+2,A,A+N+2,A+1);}curtain.setAttribute('position',new THREE.Float32BufferAttribute(v,3));curtain.setIndex(idx);curtain.computeVertexNormals();mesh(curtain,material('#dfcbaa',{side:THREE.DoubleSide}),0,0,0);box(.47,.045,.07,2.4+side*.99,2.83,-2.64,trim);}
 // Raised lounge and the six short connecting steps.
 box(2.85,1.2,4.1,2.48,.6,-.85,cream);box(2.85,.06,4.1,2.48,1.23,-.85,material('#879368'));
 for(let i=0;i<6;i++)box(1.02,.2*(i+1),.3,2.92,.1*(i+1),2.85-i*.3,cream);
 // Stair-side timber railing follows the six-step slope.
 for(const side of [2.38,3.46]){for(let i=0;i<6;i++)box(.065,.72,.065,side,.2*(i+1)+.36,2.85-i*.3,wood);const start=new THREE.Vector3(side,.96,2.99),end=new THREE.Vector3(side,2.16,1.2),direction=end.clone().sub(start);const rail=mesh(new THREE.CylinderGeometry(.055,.055,direction.length(),12),wood,...start.clone().add(end).multiplyScalar(.5).toArray());rail.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());}
 // Low side rail leaves lounge visible; front stays open for future figures.
 for(const z of [-1.5,-.5,.5])box(.055,.68,.055,1.08,1.57,z,pale);
 box(.065,.07,2.4,1.08,1.94,-.6,pale);
 // Wall bench.
 box(2.05,.28,.7,2.43,1.63,-2.08,pale);box(2.05,.72,.16,2.43,1.95,-2.4,wood);
 box(1.92,.15,.62,2.43,1.84,-2.02,material('#aa5038'));
 for(const x of [1.65,3.2])box(.11,.45,.55,x,1.43,-2.08,wood);
 function chair(x,z,level,angle=0){const g=new THREE.Group();g.position.set(x,level,z);g.rotation.y=angle;root.add(g);cylinder(.25,.09,0,.48,0,seat,g);for(const xx of [-.16,.16])for(const zz of [-.16,.16]){const leg=box(.048,.46,.048,xx,.23,zz,wood,g);leg.rotation.z=xx>0?-.06:.06;}for(const xx of [-.2,.2])box(.045,.58,.045,xx,.74,-.18,wood,g);box(.43,.28,.055,0,.9,-.18,pale,g);return g;}
 function cup(x,y,z){cylinder(.07,.105,x,y+.052,z,wall);cylinder(.054,.004,x,y+.107,z,material('#867261'));cylinder(.105,.014,x,y+.007,z,wall);const handle=mesh(new THREE.TorusGeometry(.045,.012,8,16),wall,x+.074,y+.066,z);handle.rotation.y=Math.PI/2;}
 function table(x,z,level,decor=true){cylinder(.58,.085,x,level+.88,z,pale);cylinder(.055,.8,x,level+.43,z,wood);cylinder(.28,.045,x,level+.04,z,wood);if(decor){cup(x-.18,level+.93,z+.05);cylinder(.12,.09,x+.18,level+.975,z+.1,cake);cylinder(.15,.015,x+.18,level+.935,z+.1,wall);cylinder(.055,.16,x+.05,level+1.01,z-.2,pot);cylinder(.009,.2,x+.05,level+1.17,z-.2,green);ball(.047,x+.05,level+1.28,z-.2,pink);}}
 function faceTable(x,z,level,tx,tz){const c=chair(x,z,level,Math.atan2(tx-x,tz-z));c.userData.table=[tx,tz];}
 table(-2.15,1.15,0,false);cup(-2.35,.93,1.2);faceTable(-2.95,1.08,0,-2.15,1.15);faceTable(-1.9,2.05,0,-2.15,1.15);
 table(.05,1.75,0,false);cup(-.18,.93,1.8);cup(.28,.93,1.8);box(.28,.035,.2,.05,.94,1.48,pale);faceTable(-.78,1.73,0,.05,1.75);faceTable(.73,2.28,0,.05,1.75);
 table(2.45,-.45,1.2,false);cup(2.2,2.13,-.4);box(.26,.035,.32,2.65,2.14,-.65,material('#56776c'));cylinder(.055,.16,2.45,2.21,-.72,pot);ball(.065,2.45,2.36,-.72,pink);faceTable(3.27,-.2,1.2,2.45,-.45);
 function cakeModel(x,y,z,flavor='strawberry',slice=false,scale=1){const g=new THREE.Group();root.add(g);g.position.set(x,y,z);g.scale.setScalar(scale);const color={strawberry:'#e7a39d',chocolate:'#694333',matcha:'#7e965a'}[flavor];const filling=material(color);cylinder(.23,.015,0,.008,0,wall,g);if(slice){const shape=new THREE.Shape();shape.moveTo(-.17,-.14);shape.lineTo(.19,-.14);shape.lineTo(-.17,.19);shape.closePath();for(let i=0;i<3;i++){const piece=mesh(new THREE.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,steps:1}),i===1?filling:cake,0,.02+i*.06,0,g);piece.rotation.x=-Math.PI/2;}}else{cylinder(.19,.19,0,.115,0,cake,g);cylinder(.195,.04,0,.13,0,filling,g);cylinder(.195,.035,0,.225,0,filling,g);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(.033,Math.cos(a)*.13,.26,Math.sin(a)*.13,wall,g);}}
 if(flavor==='strawberry'){for(const xx of [-.07,.05]){const berry=ball(.039,xx,slice?.25:.29,0,material('#ac4938'),g);berry.scale.set(.8,1.25,.8);}}else if(flavor==='chocolate'){box(.075,.055,.035,0,slice?.25:.28,0,material('#442b23'),g);}else{ball(.035,0,slice?.25:.28,0,material('#4e6f3d'),g);}g.userData={flavor,slice};return g;}
 cakeModel(-1.98,.93,1.12,'strawberry',true,.8);cakeModel(.15,.93,1.95,'chocolate',true,.7);cakeModel(2.5,2.13,-.3,'matcha',true,.65);
 // Glass cabinet: restrained tinted panels, clean shelf and simple cakes.
 box(2.15,.7,.88,-.45,.39,-.85,wood);box(2.23,.07,.95,-.45,.775,-.85,pale);
 const glass=material('#d6e5df',{transparent:true,opacity:.2,depthWrite:false});
 box(2.15,.74,.025,-.45,1.17,-.385,glass);box(2.15,.74,.025,-.45,1.17,-1.31,glass);
 for(const x of [-1.54,.64])box(.035,.78,.93,x,1.16,-.85,pale);
 box(2.2,.03,.95,-.45,1.56,-.85,glass);box(2.08,.035,.84,-.45,1.11,-.85,cream);
 const cakeSlots=[[-1.1,.81,-.83],[-.45,.81,-.83],[.2,.81,-.83],[-1.1,1.13,-.83],[-.45,1.13,-.83],[.2,1.13,-.83]];const cakeChoices=['strawberry','chocolate','matcha'];const cabinetCakes= cakeSlots.map((p,i)=>cakeModel(...p,cakeChoices[i%3],i>=3));
 function replaceCake(index,flavor,slice){const old=cabinetCakes[index];root.remove(old);old.traverse(o=>{o.geometry?.dispose();});cabinetCakes[index]=cakeModel(...cakeSlots[index],flavor,slice);renderer.render(scene,camera);}
 const controls=document.createElement('details');controls.className='cafe-cake-menu';controls.innerHTML='<summary>蛋糕柜 / Cake selection</summary><div><label>位置 <select data-slot>'+cakeSlots.map((_,i)=>`<option value="${i}">${i<3?'下层':'上层'} ${i%3+1}</option>`).join('')+'</select></label><label>蛋糕 <select data-flavor><option value="strawberry">草莓 / Strawberry</option><option value="chocolate">巧克力 / Chocolate</option><option value="matcha">抹茶 / Matcha</option></select></label><label>形状 <select data-shape><option value="whole">整蛋糕 / Whole</option><option value="slice">切块 / Slice</option></select></label></div>';// Cake options are no longer displayed.
 const slot=controls.querySelector('[data-slot]'),flavor=controls.querySelector('[data-flavor]'),shape=controls.querySelector('[data-shape]');slot.onchange=()=>{const c=cabinetCakes[Number(slot.value)].userData;flavor.value=c.flavor;shape.value=c.slice?'slice':'whole';};flavor.onchange=shape.onchange=()=>replaceCake(Number(slot.value),flavor.value,shape.value==='slice');
 function plant(x,z,level,size=1){const g=new THREE.Group();g.position.set(x,level,z);g.scale.setScalar(size);root.add(g);cylinder(.23,.38,0,.19,0,pot,g,.17);cylinder(.18,.02,0,.39,0,material('#574a36'),g);for(let i=0;i<7;i++){const a=i*2.4;const tip=new THREE.Vector3(Math.cos(a)*.3,.65+(i%3)*.18,Math.sin(a)*.3);const stem=new THREE.Vector3(0,.37,0),dir=tip.clone().sub(stem);const stalk=mesh(new THREE.CylinderGeometry(.012,.012,dir.length(),8),green,...stem.clone().add(tip).multiplyScalar(.5).toArray(),g);stalk.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());const leaf=ball(1,tip.x,tip.y,tip.z,green,g);leaf.scale.set(.13,.025,.27);leaf.rotation.set(.25,a,-.2);}return g;}
 plant(-3.35,-1.8,0,1.3);plant(1.35,1.4,0,.9);
 // Two pendant lights, supported from the surviving back walls.
 for(const [x,z,h] of [[-.35,-.9,3.5],[2.45,-.5,3.9]]){cylinder(.013,.9,x,h+.4,z,pot);mesh(new THREE.ConeGeometry(.25,.22,32,1,true),cream,x,h-.08,z);cylinder(.23,.02,x,h-.2,z,material('#ffe2a2',{emissive:0xffbb55,emissiveIntensity:.45}));const glow=new THREE.PointLight(0xffcc8c,15,8,2);glow.position.set(x,h-.24,z);scene.add(glow);}
 // Offset the collecting room forward, preserving its contents as one group.
 const existingRoomObjects=new Set(root.children);
 // Open vintage collecting room extends the cafe to the left.
 box(3.7,.42,6,-5.85,-.21,0,cream);box(3.58,.06,5.88,-5.85,.03,0,material('#879368'));
 box(.16,4.1,6,-7.68,2.05,0,wall);box(3.7,4.1,.16,-5.85,2.05,-2.96,wall);
 // Remove the entire dividing wall so the offset rooms connect openly.
 const dividingWall=root.children.find(o=>o.geometry?.type==='BoxGeometry'&&o.position.x===-3.96&&o.position.y===2.05);if(dividingWall){root.remove(dividingWall);dividingWall.geometry.dispose();}

 // Remove the mustard infill across the newly opened doorway.
 const oldSkirt=root.children.find(o=>o.position.x===-3.865&&o.position.y===.67);if(oldSkirt){root.remove(oldSkirt);oldSkirt.geometry.dispose();}
 // Cream open display cabinet with wooden shelves and small collectibles.
 box(2.35,.13,.75,-6.05,.14,-2.36,pale);box(2.35,.1,.75,-6.05,1.52,-2.36,pale);for(const x of [-7.2,-4.9])box(.09,1.4,.75,x,.84,-2.36,wall);box(2.3,1.37,.06,-6.05,.83,-2.7,wall);
 for(const y of [.62,1.08])box(2.25,.065,.73,-6.05,y,-2.36,pale);
 function littleDoll(x,y,z,color,size=.34){const g=new THREE.Group();root.add(g);g.position.set(x,y,z);g.rotation.y=Math.PI/4;g.userData.movable=true;g.name="exhibit-"+x+"-"+y+"-"+z;g.scale.setScalar(size);const fabric=material(color);const belly=ball(.28,0,.55,0,fabric,g);belly.scale.set(1,1.25,.65);ball(.26,0,1.05,0,fabric,g);for(const sign of [-1,1]){ball(.095,sign*.2,1.25,0,fabric,g);const arm=ball(.105,sign*.32,.67,0,fabric,g);arm.scale.y=1.6;ball(.12,sign*.14,.2,.02,fabric,g);ball(.025,sign*.085,1.1,.235,material('#30291f'),g);}ball(.045,0,1.01,.255,material('#30291f'),g);return g;}
 for(const [x,y,c] of [[-6.9,.21,'#a7aa85'],[-5.4,.21,'#c4a481'],[-6.4,.66,'#c9b6a3'],[-5.2,1.12,'#ab9276']])littleDoll(x,y,-2.2,c,.3);

 for(const x of [-6.95,-6.7,-5.8])box(.14,.25,.22,x,1.23,-2.35,material(x===-6.7?'#8e9d92':'#c4ad86'));
 // Three airy wall shelves on the empty outer wall of the collecting room.
 for(const y of [1.0,2.0,3.0]){box(.55,.09,3.7,-7.34,y,-.05,pale);for(const z of [-1.5,1.4]){box(.3,.055,.065,-7.46,y-.22,z,wall);box(.055,.38,.065,-7.55,y-.21,z,wall);}}
 function shelfPicture(z,y,color){box(.075,.53,.43,-7.49,y+.31,z,pale);box(.08,.44,.34,-7.44,y+.31,z,material(color));box(.09,.12,.26,-7.43,y+.22,z,wall);}
 shelfPicture(-1.2,3,'#879d8b');shelfPicture(.3,3,'#c08b78');shelfPicture(1.3,1,'#a2b0aa');for(let i=0;i<3;i++)box(.25,.32,.065,-7.35,1.2,-1.25+i*.08,material(['#b19d7b','#7b9584','#bd9a8b'][i]));
 const dollSlots=[[-7.28,2.055,-1.15],[-7.28,2.055,.02],[-7.28,2.055,1.2],[-7.28,1.055,-.3],[-5.35,.925,2.15],[-6.65,1.175,2.2]];
 const shelfDolls=new THREE.Group();root.add(shelfDolls);let shelfCount=0;const pendingShelfMembers=new Set();
 function shelfDoll(url,name,placement=null,wallMounted=false,memberId=null){if(!url||(!placement&&shelfCount>=dollSlots.length))return;if(memberId&&(pendingShelfMembers.has(memberId)||shelfDolls.children.some(d=>d.userData.memberId===memberId)))return;if(memberId)pendingShelfMembers.add(memberId);const pos=placement||dollSlots[shelfCount++];new THREE.TextureLoader().load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const image=texture.image,ratio=image.width/image.height,h=.76,w=Math.min(.84,h*ratio);const figure=new THREE.Group();
 const sample=document.createElement('canvas');const W=144,H=192;sample.width=W;sample.height=H;const sampleCtx=sample.getContext('2d');sampleCtx.drawImage(image,0,0,W,H);const pixels=sampleCtx.getImageData(0,0,W,H).data;const solid=(x,y)=>x>=0&&x<W&&y>=0&&y<H&&pixels[(y*W+x)*4+3]>65;
 let cr=0,cg=0,cb=0,cn=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]>200&&pixels[i]+pixels[i+1]+pixels[i+2]>120){cr+=pixels[i];cg+=pixels[i+1];cb+=pixels[i+2];cn++;}}const sideColor=new THREE.Color().setRGB(cr/(cn||1)/255,cg/(cn||1)/255,cb/(cn||1)/255,THREE.SRGBColorSpace);const positions=[],uvs=[],indices=[],sideIndices=[];let maxY=0;const distance=new Float32Array(W*H);distance.fill(1000);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!solid(x,y)){distance[i]=0;continue;}maxY=Math.max(maxY,y);distance[i]=Math.min(distance[i],x?distance[i-1]+1:1,y?distance[i-W]+1:1);}for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;distance[i]=Math.min(distance[i],x<W-1?distance[i+1]+1:1,y<H-1?distance[i+W]+1:1);}
 for(let pass=0;pass<4;pass++){const next=distance.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!solid(x,y))continue;let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)sum+=distance[i+dy*W+dx];next[i]=sum/9;}distance.set(next);}
 for(const sign of [1,-1]){const offset=positions.length/3;for(let y=0;y<=H;y++)for(let x=0;x<=W;x++){const near=[];for(const dx of [-1,0])for(const dy of [-1,0])near.push(solid(x+dx,y+dy)?distance[(y+dy)*W+x+dx]:0);const d=Math.min(...near),t=Math.min(1,d/18);positions.push((x/W-.5)*w,(.5-y/H)*h,sign*.16*Math.sqrt(Math.max(0,1-(1-t)*(1-t))));uvs.push(x/W,1-y/H);}for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!solid(x,y))continue;const A=offset+y*(W+1)+x,B=A+1,C=A+W+2,D=A+W+1;const target=distance[y*W+x]<18?sideIndices:indices;target.push(...(sign===1?[A,D,C,A,C,B]:[A,B,C,A,C,D]));}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex([...indices,...sideIndices]);geometry.addGroup(0,indices.length,0);geometry.addGroup(indices.length,sideIndices.length,1);geometry.computeVertexNormals();figure.add(new THREE.Mesh(geometry,[new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.035,roughness:1,side:THREE.DoubleSide}),new THREE.MeshStandardMaterial({color:sideColor,roughness:1,side:THREE.DoubleSide})]));figure.position.set(pos[0],pos[1]+(maxY/H-.5)*h,pos[2]);figure.rotation.y=wallMounted?0:Math.atan2(camera.position.x-pos[0],camera.position.z-(pos[2]+1.55));figure.name=name;figure.userData.memberId=memberId;figure.userData.familyDoll=true;figure.userData.movable=true;figure.userData.homePosition=figure.position.toArray();figure.userData.homeRotation=figure.rotation.y;figure.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});shelfDolls.add(figure);pendingShelfMembers.delete(memberId);renderer.render(scene,camera);},undefined,error=>{pendingShelfMembers.delete(memberId);console.warn('咖啡店娃娃图片暂时未加载：'+name,error);});}
 function dollPicture(url,x,y,z,lean=false,square=false){const frame=new THREE.Group();frame.position.set(x,y,z);root.add(frame);if(lean)frame.rotation.x=-.2;box(.68,square?.68:.83,.06,0,0,0,pale,frame);box(.6,square?.6:.75,.065,0,0,.015,wall,frame);new THREE.TextureLoader().load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const art=new THREE.Mesh(new THREE.PlaneGeometry(.53,square?.53:.65),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:1}));art.position.set(0,0,.06);frame.add(art);renderer.render(scene,camera);});}
 dollPicture('collection/001/front.webp?v=necklace1',-6.15,1.99,-2.47,true);dollPicture('collection/002/front.webp',-5.2,1.91,-2.47,true,true);
 // Curated brand dolls are site assets, never dependent on a live cloud index.
 const curatedPlacements={
  '001':[-7.28,2.055,-1.15],
  '002':[-7.28,2.055,.02],
  'ffe7602c192542c3bd0077ed9069d3fb':[-7.28,2.055,1.2],
  'b193675d-53b5-4c02-aa22-9eaa3db04bd2':[-5.55,1.57,-2.23],
  '43188f6c-bb58-4b62-8172-23cb5dc34b34':[-5.35,.925,2.15],
  'bbbaf213-9d21-4c25-9309-8721b73711cc':[-6.65,1.175,2.2],
  '8c560b2a-a833-42ba-bb5e-638324a2cc70':[-6.75,1.57,-2.23]
 };
 for(const member of archiveMembers)shelfDoll(member.src,member.name,curatedPlacements[member.id],false,member.id);

 // Two freestanding exhibition plinths and quiet labels frame a clear aisle.
 for(const [x,z,height] of [[-5.35,2.15,.88],[-6.65,2.2,1.13]]){box(.62,height,.62,x,height/2,z,wall);box(.67,.045,.67,x,height+.023,z,pale);box(.25,.12,.02,x,height-.18,z+.32,cream);}
 function exhibitLabel(x,y,z){box(.22,.075,.025,x,y,z,wall);box(.14,.01,.027,x,y+.015,z+.005,material('#8b806d'));}
 for(const [x,y,z] of [[-6.9,.52,-1.98],[-6.4,.98,-1.98],[-5.2,1.45,-1.98]])exhibitLabel(x,y,z);
 littleDoll(-5.9,.21,-2.18,'#d2b4a0',.32);littleDoll(-6.9,1.12,-2.2,'#93a69b',.29);littleDoll(-5.7,.66,-2.2,'#c2ae76',.3);
 // Wall title uses a small canvas, leaving the surrounding wall uncluttered.
 const exhibitCanvas=document.createElement('canvas');exhibitCanvas.width=512;exhibitCanvas.height=128;const exhibitCtx=exhibitCanvas.getContext('2d');exhibitCtx.fillStyle='#eee5d2';exhibitCtx.fillRect(0,0,512,128);exhibitCtx.fillStyle='#625848';exhibitCtx.font='27px Arial';exhibitCtx.textAlign='center';exhibitCtx.fillText('LITTLE THINGS · EXHIBITION',256,65);exhibitCtx.font='14px Arial';exhibitCtx.fillText('a collection of soft imaginations',256,94);const exhibitTexture=new THREE.CanvasTexture(exhibitCanvas);exhibitTexture.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(2.5,.625),material('#ffffff',{map:exhibitTexture}),-5.8,3.65,-2.805);
 // An open notebook rests on the cabinet beneath the leaning print.
 const notebook=new THREE.Group();notebook.position.set(-6.15,1.595,-2.12);root.add(notebook);notebook.rotation.y=.15;for(const sign of [-1,1]){const cover=box(.22,.015,.28,sign*.115,0,0,material('#8e9b84'),notebook);const paper=box(.21,.018,.265,sign*.11,.017,0,wall,notebook);paper.rotation.z=sign*.1;for(let line=0;line<4;line++)box(.15,.001,.004,sign*.11,.035,-.08+line*.038,material('#b7b1a1'),notebook);}cylinder(.009,.28,-6.15,1.626,-2.12,pale).rotation.x=Math.PI/2;
 // Low vintage display table leaves a clear passage through the room.
 const ovalTable=new THREE.Group();ovalTable.position.set(-5.85,0,.1);ovalTable.scale.set(.7,1.18,.7);ovalTable.rotation.y=Math.PI/2;root.add(ovalTable);const top=cylinder(1,.12,0,.91,0,material('#65856d'),ovalTable);top.scale.set(1.45,1,.65);for(const x of [-.95,.95]){cylinder(.075,.84,x,.44,0,wood,ovalTable);const foot=cylinder(.3,.055,x,.04,0,wood,ovalTable);foot.scale.z=.7;}
 function postcard(url,x,z,angle){const card=box(.4,.012,.28,x,.982,z,wall,ovalTable);card.rotation.y=angle;new THREE.TextureLoader().load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const print=new THREE.Mesh(new THREE.PlaneGeometry(.35,.23),new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:1}));print.rotation.set(-Math.PI/2,0,angle);print.position.set(x,.99,z);ovalTable.add(print);renderer.render(scene,camera);});}
 postcard('collection/001/front.webp?v=necklace1',-.7,-.18,.16);postcard('collection/002/front.webp',-.25,.12,-.25);postcard('collection/001/front.webp?v=necklace1',.25,-.23,-.12);
 box(.3,.05,.24,.8,1,0,pale,ovalTable);box(.27,.012,.21,.8,1.033,0,wall,ovalTable);cylinder(.07,.16,.35,1.06,.2,pot,ovalTable);ball(.055,.35,1.21,.2,pink,ovalTable);for(const [x,z,c] of [[-.85,.24,'#d3ac86'],[.05,.25,'#8ca09b'],[.95,-.22,'#c6a69b']])ball(.06,x,1.035,z,material(c),ovalTable);

 plant(-7.1,1.9,0,.85);
 cylinder(.012,.8,-5.85,4.05,-.6,pot);mesh(new THREE.ConeGeometry(.28,.22,32,1,true),pale,-5.85,3.55,-.6);ball(.09,-5.85,3.42,-.6,material('#ffe3a5',{emissive:0xffc578,emissiveIntensity:1}));const roomLight=new THREE.PointLight(0xffcc8c,17,8,2);roomLight.position.set(-5.85,3.35,-.6);roomLight.position.z+=1.55;scene.add(roomLight);
 const roomObjects=root.children.filter(o=>!existingRoomObjects.has(o)&&(o.position.x<-4||o===shelfDolls));for(const object of roomObjects)object.position.z+=1.55;
 // Rear return closes the staggered back-wall outline without dividing the rooms.
 box(.16,4.1,1.55,-4.0,2.05,-2.185,wall);
 // Extend the common platform into the staggered transition.
 box(.3,.42,1.55,-3.95,-.21,3.775,cream);
 // Shallow pastel stars, deterministically scattered in clear wall areas.
 const starShape=new THREE.Shape();for(let i=0;i<10;i++){const angle=Math.PI/2+i*Math.PI/5,r=i%2?.045:.105,x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y);}starShape.closePath();const starGeometry=new THREE.ExtrudeGeometry(starShape,{depth:.018,bevelEnabled:true,bevelThickness:.007,bevelSize:.006,bevelSegments:2,steps:1});const starColors=['#d5a09d','#b9c592','#a0bec3','#c4b0cc','#d8bd7e'];
 const starSpots=[[-3.2,3.5,-2.82],[-2.45,3.8,-2.82],[-1.75,2.15,-2.82],[-1.2,3.65,-2.82],[.15,2.45,-2.82],[.55,3.55,-2.82],[-7.15,3.25,-1.27],[-6.55,2.75,-1.27],[-5.35,3.15,-1.27],[-4.45,2.4,-1.27]];
 starSpots.forEach(([x,y,z],i)=>{const star=mesh(starGeometry,material(starColors[i%5]),x,y,z);star.rotation.z=(i*1.7)%1-.5;star.scale.setScalar(.8+(i%3)*.18);});
 for(const [z,y,i] of [[.15,3.6,0],[2.6,3.45,1],[3.6,2.55,2],[4,3.6,3]]){const star=mesh(starGeometry,material(starColors[i]),-7.575,y,z);star.rotation.y=Math.PI/2;star.rotation.z=i*.25;}
 // Quiet branded poster; only a small graphic canvas, no realistic textures.
 const poster=document.createElement('canvas');poster.width=512;poster.height=640;const ctx=poster.getContext('2d');ctx.fillStyle='#f4eee3';ctx.fillRect(0,0,512,640);ctx.fillStyle='#687963';ctx.beginPath();ctx.arc(256,236,88,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ece2d2';ctx.beginPath();ctx.arc(256,214,58,0,Math.PI*2);ctx.fill();ctx.fillStyle='#393e36';ctx.textAlign='center';ctx.font='400 32px "Source Han Sans"';ctx.fillText('SNOOT CLUB',256,425);ctx.font='300 42px "Source Han Sans"';ctx.fillText('CAFÉ',256,484);ctx.font='300 18px "Source Han Sans"';ctx.fillText('a little place for little things.',256,540);
 const texture=new THREE.CanvasTexture(poster);texture.colorSpace=THREE.SRGBColorSpace;
 box(1.18,1.48,.05,-2.55,2.33,-2.84,pale);mesh(new THREE.PlaneGeometry(1.08,1.35),material('#ffffff',{map:texture}),-2.55,2.33,-2.805);
 for(const [x,url] of [[-.95,'collection/001/front.webp?v=necklace1'],[-.38,'collection/002/front.webp']]){box(.4,.5,.06,x,2.9,-2.83,pale);box(.34,.44,.065,x,2.9,-2.79,wall);new THREE.TextureLoader().load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;mesh(new THREE.PlaneGeometry(.29,.38),material('#ffffff',{map:texture,transparent:true}),x,2.9,-2.75);renderer.render(scene,camera);});}
 // A small freestanding sign, with room for a figure beside it.
 box(.4,.5,.06,-1.76,.3,-.1,pale);box(.34,.44,.067,-1.76,.3,-.06,wall);
 // Spider plant: narrow ribbon leaves arch out of a hanging pot.
 cylinder(.16,.24,3.35,3.52,-2.6,pot);for(const dx of [-.1,.1])cylinder(.009,.46,3.35+dx,3.87,-2.6,pale);
 for(let i=0;i<15;i++){const angle=i*2.4,length=.48+(i%4)*.1;const v=[],idx=[];for(let step=0;step<=16;step++){const t=step/16,r=.38*Math.sin(t*Math.PI/2),y=3.65+.15*Math.sin(t*Math.PI)-length*t*t,width=.026*Math.sin(Math.PI*t)**.5;const x=3.35+Math.cos(angle)*r,z=-2.6+Math.sin(angle)*r;for(const side of [-1,1])v.push(x+side*Math.sin(angle)*width,y,z-side*Math.cos(angle)*width);}for(let j=0;j<16;j++)idx.push(j*2,j*2+1,j*2+3,j*2,j*2+3,j*2+2);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,material(i%3?'#66845a':'#a1b488',{side:THREE.DoubleSide}),0,0,0);}

 scene.add(new THREE.HemisphereLight(0xffe9cd,0x95816b,1.65));const light=new THREE.DirectionalLight(0xffdfb2,1.25);light.position.set(0,12,1);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-11,right:11,top:9,bottom:-9,near:.1,far:30});light.shadow.normalBias=.035;light.shadow.bias=-.00015;scene.add(light);
 const shadow=mesh(new THREE.PlaneGeometry(22,14),new THREE.ShadowMaterial({opacity:.075}),0,-.58,0,scene);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
 let yaw=0,pitch=0;const target=new THREE.Vector3(-1.8,1.65,0);
 function cameraPose(){const angle=Math.PI/4+yaw,up=Math.PI/5+pitch;camera.position.set(Math.sin(angle)*14*Math.cos(up),target.y+14*Math.sin(up),Math.cos(angle)*14*Math.cos(up));camera.lookAt(target);camera.updateMatrixWorld();}
 function resize(){const w=host.clientWidth||900,h=host.clientHeight||620,aspect=w/h;const bounds=new THREE.Box3().setFromObject(root),corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));cameraPose();const view=camera.matrixWorldInverse;let maxX=0,maxY=0;for(const v of corners){v.applyMatrix4(view);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}const half=Math.max(maxY,maxX/aspect)*1.035;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h,false);for(const spot of photoSpots){const p=new THREE.Vector3(...spot.position).project(camera);spot.percent={x:(p.x+1)*50,y:(1-p.y)*50};spot.occlusion="scene-depth";}renderer.render(scene,camera);}
 cameraPose();resize();
 // No animation loop: render only after a resize or a bounded camera drag.
 let drag;const canvas=renderer.domElement;canvas.style.touchAction='pan-y';canvas.style.cursor='grab';
 canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';};
 canvas.onpointermove=e=>{if(!drag)return;yaw=THREE.MathUtils.clamp(drag.yaw+(e.clientX-drag.x)*.002,-.2,.2);pitch=THREE.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.001,-.075,.075);resize();};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;canvas.style.cursor='grab';};
 canvas.ondblclick=()=>{yaw=pitch=0;resize();};
 new ResizeObserver(()=>{if(!page.hidden)resize();}).observe(host);renderScene=resize;
 page.photoSpots=photoSpots;page.cafeScene={scene,root,camera,photoSpots};
 import('./cafe-interaction.js?v=builtinsave1').then(m=>m.attachCafe({page,host,scene,root,camera,renderer,photoSpots,shelfDoll,shelfDolls,resize}));
}
window.addEventListener('site-page-change',e=>{page.hidden=e.detail!=='cafe';if(!page.hidden){if(!mounted){try{mount();mounted=true;}catch(error){page.querySelector('.cafe-fallback').hidden=false;console.error(error);}}else renderScene();}});
if(location.hash==='#cafe'){page.hidden=false;try{mount();mounted=true;}catch{page.querySelector('.cafe-fallback').hidden=false;}}
