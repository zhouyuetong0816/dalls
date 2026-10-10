import * as THREE from './vendor/three.module.js';
// World anchors use the same scene coordinates as future doll placements.
// Image-relative percentages are projected from the fixed reference camera.
export const photoSpots = [
 {id:'photoSpot_01',name:'前方左侧咖啡桌',position:[-2.15,.91,1.15]},
 {id:'photoSpot_02',name:'前方右侧咖啡桌',position:[.05,.91,1.75]},
 {id:'photoSpot_03',name:'二层咖啡桌',position:[2.45,2.11,-.45]},
 {id:'photoSpot_04',name:'楼梯旁的盆栽',position:[1.35,.55,1.4]},
 {id:'photoSpot_05',name:'蛋糕展示柜',position:[-.35,1.57,-.85]}
];
const page=document.createElement('section');page.id='cafe-page';page.hidden=true;
page.innerHTML='<div class="cafe-heading"><h1>SOFT THINGS CAFÉ</h1><p>a little place for little things.</p></div><div class="cafe-scene" aria-label="奶油色微缩咖啡厅，拖动可小幅调整视角"><div class="cafe-fallback" hidden>咖啡厅场景需要支持 WebGL 的浏览器。</div></div>';
document.querySelector('#home-page').before(page);
let mounted=false,renderScene;
function mount(){
 const host=page.querySelector('.cafe-scene');const scene=new THREE.Scene();
 const camera=new THREE.OrthographicCamera(-6,6,6,-6,.1,80);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0xffffff,0);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','SOFT THINGS CAFÉ 三维场景');
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
 const controls=document.createElement('details');controls.className='cafe-cake-menu';controls.innerHTML='<summary>蛋糕柜 / Cake selection</summary><div><label>位置 <select data-slot>'+cakeSlots.map((_,i)=>`<option value="${i}">${i<3?'下层':'上层'} ${i%3+1}</option>`).join('')+'</select></label><label>蛋糕 <select data-flavor><option value="strawberry">草莓 / Strawberry</option><option value="chocolate">巧克力 / Chocolate</option><option value="matcha">抹茶 / Matcha</option></select></label><label>形状 <select data-shape><option value="whole">整蛋糕 / Whole</option><option value="slice">切块 / Slice</option></select></label></div>';page.append(controls);
 const slot=controls.querySelector('[data-slot]'),flavor=controls.querySelector('[data-flavor]'),shape=controls.querySelector('[data-shape]');slot.onchange=()=>{const c=cabinetCakes[Number(slot.value)].userData;flavor.value=c.flavor;shape.value=c.slice?'slice':'whole';};flavor.onchange=shape.onchange=()=>replaceCake(Number(slot.value),flavor.value,shape.value==='slice');
 function plant(x,z,level,size=1){const g=new THREE.Group();g.position.set(x,level,z);g.scale.setScalar(size);root.add(g);cylinder(.23,.38,0,.19,0,pot,g,.17);cylinder(.18,.02,0,.39,0,material('#574a36'),g);for(let i=0;i<7;i++){const a=i*2.4;const tip=new THREE.Vector3(Math.cos(a)*.3,.65+(i%3)*.18,Math.sin(a)*.3);const stem=new THREE.Vector3(0,.37,0),dir=tip.clone().sub(stem);const stalk=mesh(new THREE.CylinderGeometry(.012,.012,dir.length(),8),green,...stem.clone().add(tip).multiplyScalar(.5).toArray(),g);stalk.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());const leaf=ball(1,tip.x,tip.y,tip.z,green,g);leaf.scale.set(.13,.025,.27);leaf.rotation.set(.25,a,-.2);}return g;}
 plant(-3.35,-1.8,0,1.3);plant(1.35,1.4,0,.9);
 // Two pendant lights, supported from the surviving back walls.
 for(const [x,z,h] of [[-.35,-.9,3.5],[2.45,-.5,3.9]]){cylinder(.013,.9,x,h+.4,z,pot);mesh(new THREE.ConeGeometry(.25,.22,32,1,true),cream,x,h-.08,z);cylinder(.23,.02,x,h-.2,z,material('#ffe2a2',{emissive:0xffbb55,emissiveIntensity:.45}));const glow=new THREE.PointLight(0xffcc8c,15,8,2);glow.position.set(x,h-.24,z);scene.add(glow);}
 // Offset the collecting room forward, preserving its contents as one group.
 const existingRoomObjects=new Set(root.children);
 // Open vintage collecting room extends the cafe to the left.
 box(3.7,.42,6,-5.85,-.21,0,cream);box(3.58,.06,5.88,-5.85,.03,0,pale);
 box(.16,4.1,6,-7.68,2.05,0,wall);box(3.7,4.1,.16,-5.85,2.05,-2.96,wall);
 // A wide opening joins both rooms; retain the original wall as two short piers.
 const dividingWall=root.children.find(o=>o.geometry?.type==='BoxGeometry'&&o.position.x===-3.96&&o.position.y===2.05);if(dividingWall){root.remove(dividingWall);dividingWall.geometry.dispose();}
 box(.16,4.1,.9,-3.96,2.05,-2.55,wall);box(.16,4.1,.7,-3.96,2.05,2.65,wall);box(.16,.55,4.4,-3.96,3.825,.1,wall);
 // Remove the mustard infill across the newly opened doorway.
 const oldSkirt=root.children.find(o=>o.position.x===-3.865&&o.position.y===.67);if(oldSkirt){root.remove(oldSkirt);oldSkirt.geometry.dispose();}
 // Cream open display cabinet with wooden shelves and small collectibles.
 box(2.35,.13,.75,-6.05,.14,-2.36,pale);box(2.35,.1,.75,-6.05,1.52,-2.36,pale);for(const x of [-7.2,-4.9])box(.09,1.4,.75,x,.84,-2.36,wall);box(2.3,1.37,.06,-6.05,.83,-2.7,wall);
 for(const y of [.62,1.08])box(2.25,.065,.73,-6.05,y,-2.36,pale);
 function littleDoll(x,y,z,color,size=.34){const g=new THREE.Group();root.add(g);g.position.set(x,y,z);g.scale.setScalar(size);const fabric=material(color);const belly=ball(.28,0,.55,0,fabric,g);belly.scale.set(1,1.25,.65);ball(.26,0,1.05,0,fabric,g);for(const sign of [-1,1]){ball(.095,sign*.2,1.25,0,fabric,g);const arm=ball(.105,sign*.32,.67,0,fabric,g);arm.scale.y=1.6;ball(.12,sign*.14,.2,.02,fabric,g);ball(.025,sign*.085,1.1,.235,material('#30291f'),g);}ball(.045,0,1.01,.255,material('#30291f'),g);return g;}
 for(const [x,y,c] of [[-6.9,.21,'#a7aa85'],[-5.4,.21,'#c4a481'],[-6.4,.66,'#c9b6a3'],[-5.2,1.12,'#ab9276']])littleDoll(x,y,-2.2,c,.3);
 for(const [x,y,c] of [[-6.85,2.25,'#78816c'],[-5.75,2.55,'#bca078'],[-4.75,2.1,'#8e7364']]){box(.02,.18,.02,x,y+.57,-2.81,pot);littleDoll(x,y,-2.75,c,.43);}
 for(const x of [-6.95,-6.7,-5.8])box(.14,.25,.22,x,1.23,-2.35,material(x===-6.7?'#8e9d92':'#c4ad86'));
 // Three airy wall shelves on the empty outer wall of the collecting room.
 for(const y of [1.0,2.0,3.0]){box(.55,.09,3.7,-7.34,y,-.05,wood);for(const z of [-1.5,1.4]){box(.3,.055,.065,-7.46,y-.22,z,wall);box(.055,.38,.065,-7.55,y-.21,z,wall);}}
 function shelfPicture(z,y,color){box(.075,.53,.43,-7.49,y+.31,z,pale);box(.08,.44,.34,-7.44,y+.31,z,material(color));box(.09,.12,.26,-7.43,y+.22,z,wall);}
 shelfPicture(-1.2,3,'#879d8b');shelfPicture(.3,3,'#c08b78');shelfPicture(1.3,1,'#a2b0aa');for(let i=0;i<3;i++)box(.25,.32,.065,-7.35,1.2,-1.25+i*.08,material(['#b19d7b','#7b9584','#bd9a8b'][i]));
 const dollSlots=[[-7.28,2.055,-1.15],[-7.28,2.055,.02],[-7.28,2.055,1.2],[-7.28,1.055,-.3]];
 const shelfDolls=new THREE.Group();root.add(shelfDolls);let shelfCount=0;
 function shelfDoll(url,name){if(!url||shelfCount>=dollSlots.length)return;const pos=dollSlots[shelfCount++];new THREE.TextureLoader().load(url,texture=>{texture.colorSpace=THREE.SRGBColorSpace;const image=texture.image,ratio=image.width/image.height,h=.76,w=Math.min(.84,h*ratio);const figure=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.035,roughness:1,side:THREE.DoubleSide}));figure.position.set(pos[0],pos[1]+h/2,pos[2]);figure.rotation.y=Math.PI/2;figure.name=name;figure.userData.familyDoll=true;shelfDolls.add(figure);renderer.render(scene,camera);});}
 shelfDoll('collection/001/front.webp','泡面头');shelfDoll('collection/002/front.webp','the weekend');
 import('./family-store.js?compact4').then(m=>m.familyMembers({summary:true})).then(members=>{for(const member of members){if(shelfCount>=dollSlots.length)break;shelfDoll(member.thumbnail||member.front,member.name);}}).catch(error=>console.warn('Shelf archive temporarily unavailable',error));
 // Low vintage display table leaves a clear passage through the room.
 box(1.6,.12,.85,-6.2,.91,.9,wood);for(const x of [-6.9,-5.5])for(const z of [.57,1.23])box(.09,.85,.09,x,.44,z,wood);littleDoll(-6.55,.99,.85,'#b8a58c',.35);box(.35,.05,.3,-5.9,1.01,.95,wall);box(.3,.04,.26,-5.9,1.06,.95,pale);
 plant(-7.1,1.9,0,.85);
 cylinder(.012,.8,-5.85,4.05,-.6,pot);mesh(new THREE.ConeGeometry(.28,.22,32,1,true),pale,-5.85,3.55,-.6);ball(.09,-5.85,3.42,-.6,material('#ffe3a5',{emissive:0xffc578,emissiveIntensity:1}));const roomLight=new THREE.PointLight(0xffcc8c,17,8,2);roomLight.position.set(-5.85,3.35,-.6);roomLight.position.z+=1.55;scene.add(roomLight);
 const roomObjects=root.children.filter(o=>!existingRoomObjects.has(o)&&(o.position.x<-4||o===shelfDolls));for(const object of roomObjects)object.position.z+=1.55;
 // Extend the common platform into the staggered transition.
 box(.3,.42,1.55,-3.95,-.21,3.775,cream);
 // Quiet branded poster; only a small graphic canvas, no realistic textures.
 const poster=document.createElement('canvas');poster.width=512;poster.height=640;const ctx=poster.getContext('2d');ctx.fillStyle='#f4eee3';ctx.fillRect(0,0,512,640);ctx.fillStyle='#687963';ctx.beginPath();ctx.arc(256,236,88,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ece2d2';ctx.beginPath();ctx.arc(256,214,58,0,Math.PI*2);ctx.fill();ctx.fillStyle='#393e36';ctx.textAlign='center';ctx.font='32px Arial';ctx.fillText('SOFT THINGS',256,425);ctx.font='42px Arial';ctx.fillText('CAFÉ',256,484);ctx.font='18px Arial';ctx.fillText('a little place for little things.',256,540);
 const texture=new THREE.CanvasTexture(poster);texture.colorSpace=THREE.SRGBColorSpace;
 box(1.18,1.48,.05,-2.55,2.33,-2.84,pale);mesh(new THREE.PlaneGeometry(1.08,1.35),material('#ffffff',{map:texture}),-2.55,2.33,-2.805);
 for(const [x,y,c] of [[-.95,2.9,'#b1b9a3'],[-.38,2.9,'#d6bfa4']]){box(.4,.5,.06,x,y,-2.83,pale);box(.34,.44,.065,x,y,-2.79,material(c));}
 // A small freestanding sign, with room for a figure beside it.
 box(.4,.5,.06,-1.76,.3,-.1,pale);box(.34,.44,.067,-1.76,.3,-.06,wall);
 for(let i=0;i<5;i++){const leaf=ball(.095,3.35+Math.sin(i)*.08,3.25-i*.17,-2.6,green);leaf.scale.set(.7,1.4,.55);}cylinder(.16,.24,3.35,3.52,-2.6,pot);
 scene.add(new THREE.HemisphereLight(0xffe9cd,0x95816b,1.65));const light=new THREE.DirectionalLight(0xffdfb2,1.25);light.position.set(0,12,1);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-11,right:11,top:9,bottom:-9,near:.1,far:30});light.shadow.normalBias=.035;light.shadow.bias=-.00015;scene.add(light);
 const shadow=mesh(new THREE.PlaneGeometry(22,14),new THREE.ShadowMaterial({opacity:.075}),0,-.58,0,scene);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
 let yaw=0,pitch=0;const target=new THREE.Vector3(-1.8,1.65,0);
 function cameraPose(){const angle=Math.PI/4+yaw,up=Math.PI/5+pitch;camera.position.set(Math.sin(angle)*14*Math.cos(up),target.y+14*Math.sin(up),Math.cos(angle)*14*Math.cos(up));camera.lookAt(target);camera.updateMatrixWorld();}
 function resize(){const w=host.clientWidth||900,h=host.clientHeight||620,aspect=w/h;const bounds=new THREE.Box3().setFromObject(root),corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));cameraPose();const view=camera.matrixWorldInverse;let maxX=0,maxY=0;for(const v of corners){v.applyMatrix4(view);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));}const half=Math.max(maxY,maxX/aspect)*1.09;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h,false);for(const spot of photoSpots){const p=new THREE.Vector3(...spot.position).project(camera);spot.percent={x:(p.x+1)*50,y:(1-p.y)*50};spot.occlusion="scene-depth";}renderer.render(scene,camera);}
 cameraPose();resize();
 // No animation loop: render only after a resize or a bounded camera drag.
 let drag;const canvas=renderer.domElement;canvas.style.touchAction='pan-y';canvas.style.cursor='grab';
 canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,yaw,pitch};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';};
 canvas.onpointermove=e=>{if(!drag)return;yaw=THREE.MathUtils.clamp(drag.yaw+(e.clientX-drag.x)*.002,-.2,.2);pitch=THREE.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.001,-.075,.075);resize();};
 canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;canvas.style.cursor='grab';};
 canvas.ondblclick=()=>{yaw=pitch=0;resize();};
 new ResizeObserver(()=>{if(!page.hidden)resize();}).observe(host);renderScene=resize;
 page.photoSpots=photoSpots;page.cafeScene={scene,root,camera,photoSpots};
}
window.addEventListener('site-page-change',e=>{page.hidden=e.detail!=='cafe';if(!page.hidden){if(!mounted){try{mount();mounted=true;}catch(error){page.querySelector('.cafe-fallback').hidden=false;console.error(error);}}else renderScene();}});
if(location.hash==='#cafe'){page.hidden=false;try{mount();mounted=true;}catch{page.querySelector('.cafe-fallback').hidden=false;}}
