import * as THREE from './vendor/three.module.js';
export const FABRICS=[
 {id:'短毛绒',label:'短毛绒',en:'SHORT PLUSH',kind:'fur',pile:3,length:.055,density:12000,sheen:.7},
 {id:'长毛绒',label:'长毛绒',en:'LONG PLUSH',kind:'long',pile:10,length:.19,density:16000,sheen:.8},
 {id:'泰迪卷绒',label:'泰迪卷绒',en:'TEDDY FLEECE',kind:'curl',pile:6,length:.10,density:11000,sheen:.75,asset:'curly_teddy_natural'},
 {id:'羊羔绒',label:'羊羔绒',en:'BOUCLE',kind:'boucle',pile:7,length:.12,density:11000,sheen:.65},
 {id:'灯芯绒',label:'细条灯芯绒',en:'FINE CORDUROY',kind:'cord',pile:1,length:.009,density:2400,sheen:.8,asset:'ribbed_corduroy',ribWidth:2},
 {id:'粗条灯芯绒',label:'粗条灯芯绒',en:'WIDE CORDUROY',kind:'widecord',pile:2,length:.015,density:3400,sheen:.85,ribWidth:7},
 {id:'棉布',label:'普通棉布',en:'PLAIN COTTON',kind:'cotton',pile:0,length:0,density:0,sheen:.3},
 {id:'棉针织',label:'棉针织',en:'COTTON JERSEY',kind:'jersey',pile:0,length:0,density:0,sheen:.4,asset:'cotton_jersey'},
 {id:'牛仔布',label:'牛仔布',en:'DENIM',kind:'denim',pile:0,length:0,density:0,sheen:.25},
 {id:'毛毡',label:'毛毡',en:'FELT',kind:'felt',pile:1,length:.01,density:2000,sheen:.45},
 {id:'针织',label:'粗针织',en:'KNIT',kind:'knit',pile:0,length:0,density:0,sheen:.4}
];
export const fabricProfile=m=>FABRICS.find(f=>f.id===m.fabric)||FABRICS[0];
const sources=new Map(),canvasCache=new Map();let revision=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function prepareFabricAssets(){return Promise.all(['ribbed_corduroy','curly_teddy_natural','cotton_jersey'].map(loadAsset));}
function loadAsset(name){if(sources.has(name))return sources.get(name).promise;const a={images:{},ready:false};sources.set(name,a);a.promise=Promise.all(['Diffuse','nor_gl','Rough','Displacement'].map(channel=>new Promise(resolve=>{const im=new Image();im.onload=()=>{a.images[channel]=im;resolve();};im.onerror=()=>resolve();im.src=new URL('./materials/scans/'+name+'-'+channel+'.jpg',import.meta.url).href;}))).then(()=>{a.ready=!!a.images.Diffuse;revision++;canvasCache.clear();window.dispatchEvent(new Event('fabric-assets-ready'));return a.ready;});return a.promise;}
function seed(x,y,s=1){return ((Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453)%1+1)%1;}
export function cordRibCount(m){return 110-clamp(Number(m.ribWidth??fabricProfile(m).ribWidth??2),1,10)*9;}
export function fabricRelief(m,u,v){const p=fabricProfile(m);if(p.kind!=='widecord')return 0;const ridge=Math.pow(.5+.5*Math.cos(u*cordRibCount(m)*Math.PI*2),.48);return ridge*(.015+Number(m.ribWidth??7)*.0022);}
function makeCanvas(m,bump){const profile=fabricProfile(m),key=revision+':'+JSON.stringify(m)+':'+bump;if(canvasCache.has(key))return canvasCache.get(key);const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const a=profile.asset?sources.get(profile.asset):null;if(profile.asset&&!a)loadAsset(profile.asset);
 if(a?.ready&&a.images[bump?'Displacement':'Diffuse']){const im=a.images[bump?'Displacement':'Diffuse'];ctx.drawImage(im,0,0,512,512);const raw=ctx.getImageData(0,0,512,512),d=raw.data;let mean=0;for(let i=0;i<d.length;i+=4)mean+=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;mean/=512*512;const color=new THREE.Color(m.color||'#e6d7bd');const hex=color.getHexString(),rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));for(let i=0;i<d.length;i+=4){const lum=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;for(let j=0;j<3;j++)d[i+j]=bump?lum:clamp(rgb[j]*(.98+(lum-mean)/255*.7),0,255);}ctx.putImageData(raw,0,0);
 }else{const data=ctx.createImageData(512,512),d=data.data,hex=new THREE.Color(m.color||'#e6d7bd').getHexString(),rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));for(let y=0;y<512;y++)for(let x=0;x<512;x++){const noise=seed(x,y),fine=seed(x*2,y*2,7);let h=.5,shade=1;const k=profile.kind;
 if(k==='cord'||k==='widecord'){const count=cordRibCount(m);h=Math.pow(.5+.5*Math.cos(x/512*count*Math.PI*2),.48);shade=.84+h*.18+(noise-.5)*.055;h=.18+h*.65+(fine-.5)*.025;}
 else if(k==='cotton'||k==='denim'){const w=k==='denim'?Math.sin((x+y*1.8)*1.8):Math.sin(x*2.1)*Math.cos(y*2.1);h=.5+w*.12+(noise-.5)*.08;shade=1+w*.035+(fine-.5)*.035;}
 else if(k==='jersey'||k==='knit'){const size=k==='knit'?17:5,xx=(x%size)/size,yy=(y%size)/size;h=.5+Math.cos((xx-Math.abs(yy-.5)*.75)*Math.PI*2)*.18+(noise-.5)*.025;shade=.95+h*.09;}
 else if(k==='curl'||k==='boucle'){const size=k==='boucle'?15:9,xx=x/size,yy=y/size;h=.3+.45*Math.pow(.5+.5*Math.sin(xx*4+Math.sin(yy*3))*Math.cos(yy*4+Math.sin(xx*2)),.6)+(noise-.5)*.06;shade=.88+h*.2;}
 else{h=.5+(noise-.5)*.16;shade=.98+(fine-.5)*.06;}
 const i=(y*512+x)*4;for(let j=0;j<3;j++)d[i+j]=bump?clamp(h*255,0,255):clamp(rgb[j]*shade,0,255);d[i+3]=255;}ctx.putImageData(data,0,0);}
 if(!bump&&m.pattern&&m.pattern!=='solid'){const size=(m.scale||12)*3;ctx.fillStyle='rgba(255,255,255,.65)';for(let y=0;y<512;y+=size)for(let x=0;x<512;x+=size){if(m.pattern==='check'&&(Math.round(x/size)+Math.round(y/size))%2===0)ctx.fillRect(x,y,size,size);if(m.pattern==='stripes'&&Math.round(x/size)%2===0)ctx.fillRect(x,y,size*.45,size);if(m.pattern==='dots'){ctx.beginPath();ctx.arc(x+size/2,y+size/2,size*.13,0,7);ctx.fill();}if(m.pattern==='stars'){ctx.beginPath();for(let j=0;j<10;j++){const r=size*(j%2?.09:.22),t=j*Math.PI/5-Math.PI/2;ctx.lineTo(x+size/2+Math.cos(t)*r,y+size/2+Math.sin(t)*r);}ctx.fill();}}}
 const value={canvas:c,pixels:ctx.getImageData(0,0,512,512).data};canvasCache.set(key,value);if(canvasCache.size>40)canvasCache.delete(canvasCache.keys().next().value);return value;}
export function fabricTexture(m,bump=false){const data=makeCanvas(m,bump),texture=new THREE.CanvasTexture(data.canvas);texture.colorSpace=bump?THREE.NoColorSpace:THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;return{texture,pixels:data.pixels};}
export function clothMaterial(m){const profile=fabricProfile(m),map=fabricTexture(m).texture,bump=fabricTexture(m,true).texture,params={map,roughness:.96,metalness:0,sheen:profile.sheen,sheenColor:new THREE.Color(m.color).lerp(new THREE.Color('#ffffff'),.25),sheenRoughness:.85,bumpMap:bump,bumpScale:profile.kind==='widecord'?.018:profile.kind==='cord'?.012:profile.kind==='cotton'?.003:.006,side:THREE.DoubleSide};const a=sources.get(profile.asset);if(a?.ready&&a.images.nor_gl){const normal=new THREE.Texture(a.images.nor_gl);normal.needsUpdate=true;normal.wrapS=normal.wrapT=THREE.RepeatWrapping;params.normalMap=normal;params.normalScale=new THREE.Vector2(.4,.4);delete params.bumpMap;delete params.bumpScale;}if(a?.ready&&a.images.Rough){const rough=new THREE.Texture(a.images.Rough);rough.needsUpdate=true;rough.wrapS=rough.wrapT=THREE.RepeatWrapping;params.roughnessMap=rough;}if(profile.kind==='cord'&&a?.ready){const repeat=cordRibCount(m)/92;for(const t of [params.map,params.normalMap,params.roughnessMap])if(t)t.repeat.x=repeat;}return new THREE.MeshPhysicalMaterial(params);}
