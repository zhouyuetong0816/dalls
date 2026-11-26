import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const asset=name=>new URL(name+'?v=orbit2',import.meta.url).href;
export function mountRealtime(page){
 const world=page.querySelector('.park-world'),status=page.querySelector('.park-status');
 let renderer,scene,camera,controls,model,loaded=false,loading=false,frame=0,action=null,tracks={},last=0;
 const clock=new THREE.Clock(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),home={position:new THREE.Vector3(9.871,4.215,-6.895),target:new THREE.Vector3(-.8,.8,1.5)};
 const pointerStart={x:0,y:0};
 function visible(){return !page.hidden&&!document.hidden&&(!page.dataset.world||page.dataset.world==='full');}
 function resize(){if(!renderer)return;const w=page.clientWidth,h=page.clientHeight;if(!w||!h)return;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
 function render(){if(renderer&&visible())renderer.render(scene,camera);}
 function stop(){action=null;if(model)model.traverse(o=>{if(o.userData.rest){o.position.copy(o.userData.rest.p);o.quaternion.copy(o.userData.rest.q);o.scale.copy(o.userData.rest.s);}});page.querySelector('[data-stop]').hidden=true;render();}
 function choose(key){if(!loaded)return;if(action?.key===key){stop();return;}stop();action={key,start:clock.getElapsedTime()};page.querySelector('[data-stop]').hidden=false;status.textContent=key==='swing'?'秋千荡起来了 · 拖动可以换角度':'朋友来陪你玩了 · 拖动可以换角度';animate();}
 function tick(){frame=0;if(!visible())return;const t=clock.getElapsedTime();controls.update();
  if(action){const duration=2,phase=(t-action.start)%(duration*2),f=(phase<duration?phase:duration*2-phase)/duration*24;const lo=Math.floor(f),hi=Math.min(24,lo+1),a=f-lo;
   for(const track of tracks[action.key]||[]){const o=track.object;if(!o)continue;const m=new THREE.Matrix4().fromArray(track.frames[lo]),n=new THREE.Matrix4().fromArray(track.frames[hi]);const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p2=new THREE.Vector3(),q2=new THREE.Quaternion(),s2=new THREE.Vector3();m.decompose(p,q,s);n.decompose(p2,q2,s2);p.lerp(p2,a);q.slerp(q2,a);s.lerp(s2,a);m.compose(p,q,s).multiply(track.inverseNativeRest).multiply(track.exportedRest);o.parent.updateWorldMatrix(true,false);m.premultiply(o.parent.matrixWorld.clone().invert());m.decompose(o.position,o.quaternion,o.scale);o.updateMatrixWorld(true);}
  }
  render();if(action||controls.enableDamping&&t-last<1)frame=requestAnimationFrame(tick);
 }
 function animate(){if(!renderer||frame||!visible())return;frame=requestAnimationFrame(tick);}
 async function loadModel(){
  const manifest=await fetch(asset('playground-model.json')).then(r=>{if(!r.ok)throw Error('model manifest');return r.json();});
  const chunks=[];for(let i=0;i<manifest.parts.length;i+=3){chunks.push(...await Promise.all(manifest.parts.slice(i,i+3).map(async name=>{const r=await fetch(asset(name));if(!r.ok)throw Error('model chunk');return r.arrayBuffer();})));}
  const buffer=await new Response(new Blob(chunks).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  return new GLTFLoader().parseAsync(buffer,new URL('./',import.meta.url).href);
 }
 async function start(){
  if(loaded){resize();animate();return;}if(loading||!visible())return;loading=true;status.textContent='正在打开三维游乐园…';
  try{
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.domElement.className='park-canvas';renderer.domElement.setAttribute('aria-label','可拖动旋转的三维游乐园');renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;
   scene=new THREE.Scene();scene.background=new THREE.Color('#bcb9dd');camera=new THREE.PerspectiveCamera(90,1,.08,500);camera.position.copy(home.position);
   scene.add(new THREE.HemisphereLight(0xf4f5ff,0x6b7542,2.0));const sun=new THREE.DirectionalLight(0xfff4e7,2.4);sun.position.set(8,18,6);scene.add(sun);const fill=new THREE.DirectionalLight(0xd6e3ff,.7);fill.position.set(-12,8,-10);scene.add(fill);
   controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(home.target);controls.enableDamping=true;controls.dampingFactor=.12;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=65;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.49;controls.rotateSpeed=.65;controls.zoomSpeed=.7;controls.update();controls.saveState();controls.addEventListener('change',()=>{last=clock.getElapsedTime();animate();});
   const [gltf,data]=await Promise.all([loadModel(),fetch(asset('playground-actions.json')).then(r=>{if(!r.ok)throw Error('actions');return r.json();})]);model=gltf.scene;scene.add(model);
   const depth=o=>{let n=0;while(o.parent){n++;o=o.parent;}return n;};
   for(const [key,list]of Object.entries(data)){tracks[key]=list.map(t=>({...t,object:model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(t.name))})).filter(t=>t.object).sort((a,b)=>depth(a.object)-depth(b.object));}
   model.updateMatrixWorld(true);
   for(const track of Object.values(tracks).flat()){track.inverseNativeRest=new THREE.Matrix4().fromArray(track.frames[0]).invert();track.exportedRest=track.object.matrixWorld.clone();}
   model.traverse(o=>{o.userData.rest={p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone()};if(o.isMesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.roughness=Math.max(.32,m.roughness);if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});
   new THREE.TextureLoader().load(asset('sky-native.webp'),tex=>{tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;scene.background=tex;const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(tex).texture;scene.environmentIntensity=.65;pmrem.dispose();render();});
   world.prepend(renderer.domElement);world.classList.add('is-realtime');loaded=true;loading=false;status.textContent='拖动换角度 · 滚轮或双指缩放 · 点击娃娃和秋千玩耍';resize();animate();
   renderer.domElement.addEventListener('pointerdown',e=>{pointerStart.x=e.clientX;pointerStart.y=e.clientY;});
   renderer.domElement.addEventListener('pointerup',e=>{if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(model,true)[0];if(!hit)return;for(let o=hit.object;o;o=o.parent){const n=o.name.toLowerCase();if(n.includes('bnaear')){choose('banana');return;}if(n.includes('cup-bear')){choose('cup');return;}if(n.includes('weeknd')||n.includes('秋千')||tracks.swing?.some(t=>t.object===o)){choose('swing');return;}}});
   renderer.domElement.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0);if(e.key==='ArrowUp')offset.multiplyScalar(.9);if(e.key==='ArrowDown')offset.multiplyScalar(1.1);camera.position.copy(controls.target).add(offset);controls.update();animate();}});
  }catch(error){loading=false;renderer?.dispose();status.textContent='三维场景暂时没打开，请刷新重试。';console.error('Playground 3D',error);}
 }
 page.querySelector('[data-reset]').addEventListener('click',()=>{if(!loaded){start();return;}stop();controls.reset();status.textContent='拖动换角度 · 滚轮或双指缩放';animate();});
 new ResizeObserver(resize).observe(page);new MutationObserver(()=>{if(visible())start();else{cancelAnimationFrame(frame);frame=0;stop();}}).observe(page,{attributes:true,attributeFilter:['hidden','data-world']});
 document.addEventListener('visibilitychange',()=>{if(visible())start();else{cancelAnimationFrame(frame);frame=0;}});Promise.resolve().then(start);
 return {stop};
}
