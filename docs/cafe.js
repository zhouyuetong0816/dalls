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
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','SOFT THINGS CAFÉ 三维场景');
 const root=new THREE.Group();scene.add(root);
 const material=(color,extras={})=>new THREE.MeshStandardMaterial({color,roughness:.95,...extras});
 const cream=material('#eee6d8'),wall=material('#f5efe5'),wood=material('#c9ad8c'),pale=material('#dcc5a7'),green=material('#7d9277'),pot=material('#b9a38b'),stone=material('#ded2be'),cake=material('#e8c99a'),pink=material('#caa998');
 function mesh(geometry,mat,x,y,z,parent=root){const o=new THREE.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,x,y,z,mat=cream,parent=root)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
 const cylinder=(r,h,x,y,z,mat=wood,parent=root,r2=r)=>mesh(new THREE.CylinderGeometry(r,r2,h,32),mat,x,y,z,parent);
 const ball=(r,x,y,z,mat,parent=root)=>mesh(new THREE.SphereGeometry(r,16,12),mat,x,y,z,parent);
 box(8,.42,6,0,-.21,0);box(7.88,.06,5.88,0,.03,0,material('#f4eddf'));
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
 box(2.85,1.2,4.1,2.48,.6,-.85,cream);box(2.85,.06,4.1,2.48,1.23,-.85,material('#e6ddcc'));
 for(let i=0;i<6;i++)box(1.02,.2*(i+1),.3,2.92,.1*(i+1),2.85-i*.3,cream);
 // Low side rail leaves lounge visible; front stays open for future figures.
 for(const z of [-1.5,-.5,.5])box(.055,.68,.055,1.08,1.57,z,pale);
 box(.065,.07,2.4,1.08,1.94,-.6,pale);
 // Wall bench.
 box(2.05,.28,.7,2.43,1.63,-2.08,pale);box(2.05,.72,.16,2.43,1.95,-2.4,wood);
 box(1.92,.15,.62,2.43,1.84,-2.02,material('#c5c0ac'));
 for(const x of [1.65,3.2])box(.11,.45,.55,x,1.43,-2.08,wood);
 function chair(x,z,level,angle=0){const g=new THREE.Group();g.position.set(x,level,z);g.rotation.y=angle;root.add(g);cylinder(.25,.09,0,.48,0,pale,g);for(const xx of [-.16,.16])for(const zz of [-.16,.16]){const leg=box(.048,.46,.048,xx,.23,zz,wood,g);leg.rotation.z=xx>0?-.06:.06;}for(const xx of [-.2,.2])box(.045,.58,.045,xx,.74,-.18,wood,g);box(.43,.28,.055,0,.9,-.18,pale,g);return g;}
 function cup(x,y,z){cylinder(.07,.105,x,y+.052,z,wall);cylinder(.054,.004,x,y+.107,z,material('#867261'));cylinder(.105,.014,x,y+.007,z,wall);const handle=mesh(new THREE.TorusGeometry(.045,.012,8,16),wall,x+.074,y+.066,z);handle.rotation.y=Math.PI/2;}
 function table(x,z,level,decor=true){cylinder(.58,.085,x,level+.88,z,pale);cylinder(.055,.8,x,level+.43,z,wood);cylinder(.28,.045,x,level+.04,z,wood);if(decor){cup(x-.18,level+.93,z+.05);cylinder(.12,.09,x+.18,level+.975,z+.1,cake);cylinder(.15,.015,x+.18,level+.935,z+.1,wall);cylinder(.055,.16,x+.05,level+1.01,z-.2,pot);cylinder(.009,.2,x+.05,level+1.17,z-.2,green);ball(.047,x+.05,level+1.28,z-.2,pink);}}
 table(-2.15,1.15,0);chair(-2.95,1.08,0,-Math.PI/2);chair(-1.9,2.05,0,Math.PI);
 table(.05,1.75,0);chair(-.78,1.73,0,-Math.PI/2);chair(.73,2.28,0,Math.PI*.75);
 table(2.45,-.45,1.2);chair(3.27,-.2,1.2,Math.PI/2);
 // Glass cabinet: restrained tinted panels, clean shelf and simple cakes.
 box(2.15,.7,.88,-.45,.39,-.85,wood);box(2.23,.07,.95,-.45,.775,-.85,pale);
 const glass=material('#d6e5df',{transparent:true,opacity:.2,depthWrite:false});
 box(2.15,.74,.025,-.45,1.17,-.385,glass);box(2.15,.74,.025,-.45,1.17,-1.31,glass);
 for(const x of [-1.54,.64])box(.035,.78,.93,x,1.16,-.85,pale);
 box(2.2,.03,.95,-.45,1.56,-.85,glass);box(2.08,.035,.84,-.45,1.11,-.85,cream);
 for(const y of [.87,1.2])for(const x of [-1.1,-.45,.2]){cylinder(.19,.13,x,y,-.83,cake);cylinder(.195,.03,x,y+.08,-.83,wall);ball(.035,x,y+.12,-.83,pink);}
 function plant(x,z,level,size=1){const g=new THREE.Group();g.position.set(x,level,z);g.scale.setScalar(size);root.add(g);cylinder(.23,.38,0,.19,0,pot,g,.17);cylinder(.16,.02,0,.39,0,material('#8f8774'),g);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=ball(.18,Math.cos(a)*.2,.62+(i%3)*.12,Math.sin(a)*.2,green,g);leaf.scale.set(.55,1.8,.8);leaf.rotation.z=Math.sin(a)*.5;}return g;}
 plant(-3.35,-1.8,0,1.3);plant(1.35,1.4,0,.9);
 // Two pendant lights, supported from the surviving back walls.
 for(const [x,z,h] of [[-.35,-.9,3.5],[2.45,-.5,3.9]]){cylinder(.013,.9,x,h+.4,z,pot);mesh(new THREE.ConeGeometry(.25,.22,32,1,true),cream,x,h-.08,z);cylinder(.23,.02,x,h-.2,z,wall);}
 // Quiet branded poster; only a small graphic canvas, no realistic textures.
 const poster=document.createElement('canvas');poster.width=512;poster.height=640;const ctx=poster.getContext('2d');ctx.fillStyle='#f4eee3';ctx.fillRect(0,0,512,640);ctx.fillStyle='#687963';ctx.beginPath();ctx.arc(256,236,88,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ece2d2';ctx.beginPath();ctx.arc(256,214,58,0,Math.PI*2);ctx.fill();ctx.fillStyle='#393e36';ctx.textAlign='center';ctx.font='32px Arial';ctx.fillText('SOFT THINGS',256,425);ctx.font='42px Arial';ctx.fillText('CAFÉ',256,484);ctx.font='18px Arial';ctx.fillText('a little place for little things.',256,540);
 const texture=new THREE.CanvasTexture(poster);texture.colorSpace=THREE.SRGBColorSpace;
 box(1.18,1.48,.05,-2.55,2.33,-2.84,pale);mesh(new THREE.PlaneGeometry(1.08,1.35),material('#ffffff',{map:texture}),-2.55,2.33,-2.805);
 for(const [x,y,c] of [[-.95,2.9,'#b1b9a3'],[-.38,2.9,'#d6bfa4']]){box(.4,.5,.06,x,y,-2.83,pale);box(.34,.44,.065,x,y,-2.79,material(c));}
 // A small freestanding sign, with room for a figure beside it.
 box(.4,.5,.06,-1.76,.3,-.1,pale);box(.34,.44,.067,-1.76,.3,-.06,wall);
 for(let i=0;i<5;i++){const leaf=ball(.095,3.35+Math.sin(i)*.08,3.25-i*.17,-2.6,green);leaf.scale.set(.7,1.4,.55);}cylinder(.16,.24,3.35,3.52,-2.6,pot);
 scene.add(new THREE.HemisphereLight(0xffffff,0xd9cebc,2.8));const light=new THREE.DirectionalLight(0xfff4df,3.1);light.position.set(-3,9,7);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:30});light.shadow.normalBias=.035;light.shadow.bias=-.00015;scene.add(light);
 const shadow=mesh(new THREE.PlaneGeometry(14,12),new THREE.ShadowMaterial({opacity:.075}),0,-.58,0,scene);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
 let yaw=0,pitch=0;const target=new THREE.Vector3(0,1.65,0);
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
