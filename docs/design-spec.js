import {faceSettings} from './face-settings.js?v=facecustom1';
export function designForAI(state){const f=state.form,b=f.bounds;return {
 expression:faceSettings(state),
 materials:Object.fromEntries(Object.entries(state.mats).map(([k,m])=>[k,{fabric:m.fabric,color:m.color,pattern:m.pattern,scale:m.scale,pile:m.pile,ribWidth:m.ribWidth}])),
 shape:{width:(b.x1-b.x0)*f.unit,height:(b.y1-b.y0)*f.unit},
 craft:{stitch:state.craft.stitch,color:state.craft.color,spacing:state.craft.spacing,width:state.craft.width,fill:state.craft.fill,
 accessories:state.craft.access.map(a=>({id:a.id,type:a.type,color:a.color,x:a.x,y:a.y,size:a.size,stretch:a.stretch,rotation:a.rotation,depth:a.depth??0,tiltX:a.tiltX??0,tiltY:a.tiltY??0,bend:a.bend??0,shape:a.shape}))}};}
export function designSignature(state){return JSON.stringify({renderer:'web-fabric-v2',design:designForAI(state),strokes:state.strokes,aspect:state.aspect,holes:state.holes||[],customMask:state.form?.customMask||[]});}
