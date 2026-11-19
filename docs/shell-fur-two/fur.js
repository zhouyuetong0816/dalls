import * as THREE from '../vendor/three.module.js';
// Shell/fin adaptation of piellardj/fur-threejs. See CREDITS.md for source attribution.
export function noiseTexture(){const t=new THREE.TextureLoader().load(new URL('./resources/strand-noise.png',import.meta.url).href,()=>window.dispatchEvent(new Event('shell-noise-ready')));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;return t;}
let white;
function whiteTexture(){if(!white){white=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);white.colorSpace=THREE.SRGBColorSpace;white.needsUpdate=true;}return white;}
export function finGeometry(source){const p=source.getAttribute('position'),n=source.getAttribute('normal'),uv=source.getAttribute('uv'),index=source.index,edges=new Set(),ps=[],ns=[],us=[],hs=[];const key=i=>[p.getX(i),p.getY(i),p.getZ(i),uv.getX(i),uv.getY(i)].map(v=>Math.round(v*1e5)).join(',');const add=(i,h)=>{ps.push(p.getX(i),p.getY(i),p.getZ(i));ns.push(n.getX(i),n.getY(i),n.getZ(i));us.push(uv.getX(i),uv.getY(i));hs.push(h);};const at=i=>index?index.getX(i):i,count=index?index.count:p.count;
 for(let t=0;t<count;t+=3)for(const [a,b] of [[at(t),at(t+1)],[at(t+1),at(t+2)],[at(t+2),at(t)]]){const ka=key(a),kb=key(b);if(ka===kb)continue;const edge=ka<kb?ka+'|'+kb:kb+'|'+ka;if(edges.has(edge))continue;edges.add(edge);for(const [i,h] of [[a,0],[b,0],[b,1],[a,0],[b,1],[a,1]])add(i,h);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ps,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(ns,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(us,2));g.setAttribute('furLevel',new THREE.Float32BufferAttribute(hs,1));g.userData.edges=edges.size;return g;}
const vertex=`
attribute float furLevel;
uniform float uLength,uComb,uFin;
varying vec2 vUv;varying vec3 vNormalFur,vView,vPoint;varying float vLevel;
void main(){vec3 normalUnit=normalize(normal);float brush=-.65*1.57079632679*uComb;float c=cos(brush),s=sin(brush);vec3 direction=vec3(normalUnit.x,c*normalUnit.y-s*normalUnit.z,s*normalUnit.y+c*normalUnit.z);
 vec3 point=position+direction*uLength*furLevel*(uFin>.5?.8:1.);
 vUv=uv;vLevel=furLevel;vNormalFur=normalize(normalMatrix*normalUnit);vec4 mv=modelViewMatrix*vec4(point,1.);vView=-mv.xyz;vPoint=point;gl_Position=projectionMatrix*mv;}
`;
const fragment=`
uniform sampler2D uNoise,uColor;uniform float uDensity,uSoftness,uFin,uMuzzle;
uniform vec3 uCenters[5],uRadii[5];
varying vec2 vUv;varying vec3 vNormalFur,vView,vPoint;varying float vLevel;
void main(){
 for(int i=0;i<5;i++){if(uMuzzle>.5&&i<4)continue;vec3 d=vPoint-uCenters[i];vec3 r=max(uRadii[i],vec3(.001));if(dot(d.xy/r.xy,d.xy/r.xy)<.98&&d.z>-r.z)discard;}
 vec4 noise=texture2D(uNoise,vUv*uDensity);float strand=max(.008,noise.r);float t=vLevel/strand;if(t>=1.)discard;
 float alpha=pow(max(0.,1.-t),uSoftness);vec3 N=normalize(vNormalFur);if(alpha<.008)discard;
 vec3 light=normalize(vec3(1.,.2,1.));float dotLight=dot(N,light);float diffuse=.8+.1*(.5+.5*dotLight)+.1*pow(max(0.,dotLight),6.);float rootShade=.7+.3*.9*t*t;float strandShade=noise.g;vec3 color=texture2D(uColor,vUv).rgb*diffuse*rootShade*strandShade;
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}
`;
export function makeFur(base,view,settings,noise){base.updateMatrix();const g=base.geometry.clone();g.applyMatrix4(base.matrix);const isMuzzle=base.userData.region==='muzzle',factor=isMuzzle?.22:1,originalMap=base.material.map;
 const uniforms={uLength:{value:settings.length*factor},uComb:{value:settings.comb},uDensity:{value:settings.density},uSoftness:{value:1.0},uFin:{value:0},uMuzzle:{value:+isMuzzle},uNoise:{value:noise},uColor:{value:base.material.map},uCenters:{value:view.furOccluders.centers},uRadii:{value:view.furOccluders.radii}};
 const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,depthWrite:false,side:THREE.FrontSide});const levels=new Float32Array(75);for(let i=0;i<levels.length;i++)levels[i]=(i+1)/levels.length;g.setAttribute('furLevel',new THREE.InstancedBufferAttribute(levels,1));const shells=new THREE.InstancedMesh(g,material,75),matrix=new THREE.Matrix4();for(let i=0;i<75;i++)shells.setMatrixAt(i,matrix);shells.instanceMatrix.needsUpdate=true;shells.frustumCulled=false;shells.renderOrder=3;shells.userData.fur=true;
 const finsMaterial=material.clone();finsMaterial.uniforms={...uniforms,uFin:{value:1}};finsMaterial.side=THREE.DoubleSide;const fins=new THREE.Mesh(finGeometry(g),finsMaterial);fins.frustumCulled=false;fins.renderOrder=2;fins.userData.fur=true;const group=new THREE.Group();group.add(fins,shells);
 return {group,shells,fins,factor,uniforms,update(next){const map=next.white?whiteTexture():originalMap;uniforms.uColor.value=map;base.material.map=map;if(shells.count!==next.layers){shells.count=next.layers;const attribute=g.getAttribute('furLevel');for(let i=0;i<next.layers;i++)attribute.setX(i,(i+1)/next.layers);attribute.needsUpdate=true;}uniforms.uLength.value=next.length*factor;uniforms.uDensity.value=next.density;uniforms.uComb.value=next.comb;shells.visible=next.mode==='full'||next.mode==='shells';fins.visible=next.mode==='full'||next.mode==='fins';}};
}
