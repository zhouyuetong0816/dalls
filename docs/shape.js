// Rasterize the drawing, close small gaps, flood the exterior and inflate its silhouette.
// Closed strokes keep concavities; open strokes use a convex silhouette with a visible notice.
const N=144;
function hull(points){const p=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);const lo=[],hi=[];for(const q of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}lo.pop();hi.pop();return lo.concat(hi);}
export function buildSilhouette(strokes,aspect=1,holes=[]){
 const points=strokes.flat();if(points.length<3)throw Error('请先画一个完整一些的角色轮廓。');
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const w=(maxX-minX)*aspect,h=maxY-minY;if(w<.015||h<.015)throw Error('轮廓太窄，请画出角色的身体。');
 const scale=118/Math.max(w,h),ox=(N-w*scale)/2,oy=(N-h*scale)/2;
 const map=p=>({x:ox+(p.x-minX)*aspect*scale,y:oy+(p.y-minY)*scale});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=N;const ctx=canvas.getContext('2d');ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#000';
 for(const stroke of strokes){if(!stroke.length)continue;ctx.beginPath();stroke.map(map).forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.x,p.y));const a=map(stroke[0]),b=map(stroke.at(-1));if(stroke.length>8&&Math.hypot(a.x-b.x,a.y-b.y)<12)ctx.closePath();ctx.stroke();}
 const data=ctx.getImageData(0,0,N,N).data,ink=new Uint8Array(N*N);for(let i=0;i<ink.length;i++)ink[i]=data[i*4+3]>60?1:0;
 const outside=new Uint8Array(N*N),queue=[0];outside[0]=1;for(let q=0;q<queue.length;q++){const i=queue[q],x=i%N,y=Math.floor(i/N);for(const j of [x>0?i-1:-1,x<N-1?i+1:-1,y>0?i-N:-1,y<N-1?i+N:-1])if(j>=0&&!outside[j]&&!ink[j]){outside[j]=1;queue.push(j);}}
 let area=0;for(let i=0;i<ink.length;i++)if(!outside[i]&&!ink[i])area++;
 let method='closed',mask=new Uint8Array(N*N);if(area<100){method='hull';const poly=hull(points.map(map));if(poly.length<3)throw Error('请画出闭合的角色轮廓。');ctx.clearRect(0,0,N,N);ctx.beginPath();poly.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.x,p.y));ctx.closePath();ctx.fill();const d=ctx.getImageData(0,0,N,N).data;for(let i=0;i<mask.length;i++)mask[i]=d[i*4+3]>120?1:0;}else{for(let i=0;i<mask.length;i++)mask[i]=!outside[i]?1:0;}
 carveHoles(mask,ink,holes.map(map),N);
 // Keep meaningful enclosed areas; isolated face marks outside the silhouette are removed.
 const visited=new Uint8Array(N*N);for(let i=0;i<mask.length;i++){if(!mask[i]||visited[i])continue;const component=[i];visited[i]=1;for(let q=0;q<component.length;q++){const k=component[q];for(const j of [k-1,k+1,k-N,k+N])if(j>=0&&j<mask.length&&mask[j]&&!visited[j]&&Math.abs(j%N-k%N)<=1){visited[j]=1;component.push(j);}}if(component.length<30)component.forEach(k=>mask[k]=0);}
 const dist=new Float32Array(N*N);dist.fill(1000);for(let i=0;i<mask.length;i++)if(!mask[i])dist[i]=0;
 for(let y=1;y<N;y++)for(let x=1;x<N;x++){const i=y*N+x;dist[i]=Math.min(dist[i],dist[i-1]+1,dist[i-N]+1,dist[i-N-1]+1.414);}
 for(let y=N-2;y>=0;y--)for(let x=N-2;x>=0;x--){const i=y*N+x;dist[i]=Math.min(dist[i],dist[i+1]+1,dist[i+N]+1,dist[i+N+1]+1.414);}
 let x0=N,x1=0,y0=N,y1=0;for(let i=0;i<mask.length;i++)if(mask[i]){const x=i%N,y=Math.floor(i/N);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 // Locate the main upper mass for Face DNA without replacing the sketch's outline.
 let faceY=y0+(y1-y0)*.3,faceX=(x0+x1)/2,best=0;for(let y=Math.floor(y0+(y1-y0)*.2);y<y0+(y1-y0)*.48;y++){let lo=N,hi=0;for(let x=x0;x<=x1;x++)if(mask[y*N+x]){lo=Math.min(lo,x);hi=Math.max(hi,x);}const score=hi-lo;if(score>best){best=score;faceY=y;faceX=(lo+hi)/2;}}
 const unit=3.7/Math.max(x1-x0,y1-y0),cx=(x0+x1)/2,cy=(y0+y1)/2;
 return {inflationVersion:2,N,mask:Array.from(mask),dist:Array.from(dist),unit,cx,cy,bounds:{x0,x1,y0,y1},face:{x:(faceX-cx)*unit,y:(cy-faceY)*unit,width:Math.max(.45,Math.min(1.4,best*unit*.42))},method};
}
// The two fabric panels share exactly the same closed rim. Stitches never hold open geometry together.
const shellCache=new WeakMap();
export function closedShellTopology(form){
 let cached=shellCache.get(form);if(cached)return cached;
 const n=form.N,vertices=Array.from({length:n*n},(_,id)=>({x:id%n,y:Math.floor(id/n),h:0})),raw=[],edges=new Map(),cells=new Map();
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 const add=(a,b,c,cell)=>{raw.push({ids:[a,b,c],cell});for(const [u,v] of [[a,b],[b,c],[c,a]]){const k=key(u,v),e=edges.get(k);if(e)e.count++;else edges.set(k,{a:u,b:v,count:1});}};
 for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const a=y*n+x,b=a+1,c=a+n,d=c+1;if(form.mask[a]&&form.mask[b]&&form.mask[c])add(a,b,c,a*2);if(form.mask[b]&&form.mask[d]&&form.mask[c])add(b,d,c,a*2+1);}
 const rim=new Set(),boundary=[];for(const e of edges.values())if(e.count===1){rim.add(e.a);rim.add(e.b);boundary.push(e);}
 const dist=new Float32Array(n*n);dist.fill(n*2);for(let i=0;i<dist.length;i++)if(!form.mask[i]||rim.has(i))dist[i]=0;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(x)dist[i]=Math.min(dist[i],dist[i-1]+1);if(y)dist[i]=Math.min(dist[i],dist[i-n]+1);if(x&&y)dist[i]=Math.min(dist[i],dist[i-n-1]+Math.SQRT2);if(x<n-1&&y)dist[i]=Math.min(dist[i],dist[i-n+1]+Math.SQRT2);}
 for(let y=n-1;y>=0;y--)for(let x=n-1;x>=0;x--){const i=y*n+x;if(x<n-1)dist[i]=Math.min(dist[i],dist[i+1]+1);if(y<n-1)dist[i]=Math.min(dist[i],dist[i+n]+1);if(x<n-1&&y<n-1)dist[i]=Math.min(dist[i],dist[i+n+1]+Math.SQRT2);if(x&&y<n-1)dist[i]=Math.min(dist[i],dist[i+n-1]+Math.SQRT2);}
 const peak=Math.max(1,...dist.filter((_,i)=>form.mask[i]));const profile=d=>{const t=Math.max(0,Math.min(1,d/peak));return Math.sqrt(Math.max(0,1-(1-t)*(1-t)));};
 let heights=Float32Array.from(dist,(d,i)=>form.mask[i]?profile(d):0);
 for(let pass=0;pass<5;pass++){const next=new Float32Array(heights);for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){const i=y*n+x;if(!form.mask[i]||rim.has(i))continue;let sum=heights[i]*4,weight=4;for(const j of [i-1,i+1,i-n,i+n])if(form.mask[j]){sum+=heights[j];weight++;}next[i]=sum/weight;}heights=next;}
 for(let i=0;i<heights.length;i++)vertices[i].h=heights[i];
 // Split only pinched interior edges. This preserves narrow limbs and avoids coincident front/back triangles at tips.
 for(const e of edges.values())if(e.count===2&&rim.has(e.a)&&rim.has(e.b)){const a=vertices[e.a],b=vertices[e.b];e.mid=vertices.length;vertices.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,h:profile(.35)});}
 const triangles=[];for(const t of raw){const poly=[];for(let j=0;j<3;j++){const a=t.ids[j],b=t.ids[(j+1)%3];poly.push(a);const mid=edges.get(key(a,b)).mid;if(mid!==undefined)poly.push(mid);}
  let faces;if(poly.length>3||poly.every(i=>vertices[i].h===0)){const pts=poly.map(i=>vertices[i]),center=vertices.length;vertices.push({x:t.ids.reduce((s,i)=>s+vertices[i].x,0)/3,y:t.ids.reduce((s,i)=>s+vertices[i].y,0)/3,h:Math.max(profile(.2),pts.reduce((s,p)=>s+p.h,0)/pts.length)});faces=poly.map((a,j)=>[center,a,poly[(j+1)%poly.length]]);}else faces=[t.ids];triangles.push(...faces);cells.set(t.cell,faces);
 }
 const outgoing=new Map();for(const e of boundary){const a=outgoing.get(e.a)||[];a.push(e);outgoing.set(e.a,a);}const used=new Set(),loops=[];
 for(const start of boundary){if(used.has(start))continue;const loop=[];let e=start;while(e&&!used.has(e)){used.add(e);loop.push(e.a);if(e.b===start.a)break;e=(outgoing.get(e.b)||[]).find(next=>!used.has(next));}if(e&&e.b===start.a&&loop.length>=3)loops.push(loop);}
 cached={vertices,triangles,cells,loops,rim};shellCache.set(form,cached);return cached;
}
function shellAmount(form,fill){const amount=Math.max(0,Math.min(100,Number(fill)||0));return form.inflationVersion===2?.08+amount*.012:.16+amount*.0055;}
export function surfaceZ(form,x,y,fill=65){
 const fx=x/form.unit+form.cx,fy=form.cy-y/form.unit,n=form.N;if(fx<0||fy<0||fx>n-1||fy>n-1)return null;
 const mesh=closedShellTopology(form),rx=Math.round(fx),ry=Math.round(fy),amount=shellAmount(form,fill);
 if(Math.abs(fx-rx)<1e-8&&Math.abs(fy-ry)<1e-8)return form.mask[ry*n+rx]?mesh.vertices[ry*n+rx].h*amount:null;
 const ix=Math.min(n-2,Math.floor(fx)),iy=Math.min(n-2,Math.floor(fy));
 const candidates=[(iy*n+ix)*2+(fx-ix+fy-iy>1?1:0)];if(Math.abs(fx-rx)<1e-8||Math.abs(fy-ry)<1e-8)for(let yy=Math.max(0,iy-1);yy<=Math.min(n-2,iy+1);yy++)for(let xx=Math.max(0,ix-1);xx<=Math.min(n-2,ix+1);xx++)candidates.push((yy*n+xx)*2,(yy*n+xx)*2+1);
 for(const cell of candidates)for(const tri of mesh.cells.get(cell)||[]){const [a,b,c]=tri.map(i=>mesh.vertices[i]),den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y),u=((b.y-c.y)*(fx-c.x)+(c.x-b.x)*(fy-c.y))/den,v=((c.y-a.y)*(fx-c.x)+(a.x-c.x)*(fy-c.y))/den,w=1-u-v;if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7)return Math.max(0,(a.h*u+b.h*v+c.h*w)*amount);}
 return null;
}
export function shellVertexZ(form,vertex,fill=65){return vertex.h*shellAmount(form,fill);}

export function regionAt(form,gx,gy){if(form.manualMaterialRegions){const i=Math.round(gy)*form.N+Math.round(gx);const parts=form.materialRegions||[];for(let n=parts.length-1;n>=0;n--)if(parts[n].mask?.[i])return parts[n].id;return 'body';}if(form.customMask?.[Math.round(gy)*form.N+Math.round(gx)])return 'custom';const b=form.bounds,u=(gx-b.x0)/(b.x1-b.x0),v=(gy-b.y0)/(b.y1-b.y0);return v<.24&&(u<.25||u>.75)?'ears':v>.84?'feet':v>.42&&v<.8&&(u<.2||u>.8)?'arms':'body';}

export function carveHoles(mask,ink,seeds,size){for(const seed of seeds){const x=Math.round(seed.x),y=Math.round(seed.y);if(x<0||y<0||x>=size||y>=size)throw Error('镂空标记需要位于闭合轮廓内部。');const start=y*size+x;if(!mask[start]||ink[start])throw Error('请点击把手内部的空白处，不要点在线条上。');const visited=new Set([start]),queue=[start];for(let q=0;q<queue.length;q++){const i=queue[q],cx=i%size,cy=Math.floor(i/size);for(const j of [cx>0?i-1:-1,cx<size-1?i+1:-1,cy>0?i-size:-1,cy<size-1?i+size:-1])if(j>=0&&!ink[j]&&!visited.has(j)){if(!mask[j])throw Error('镂空区域没有闭合，请先补齐把手内圈的线条。');visited.add(j);queue.push(j);}}if(queue.length>mask.reduce((a,b)=>a+b,0)*.45)throw Error('这块区域太大，请点击把手内圈的空白处。');for(const i of queue)mask[i]=0;}return mask;}

export function paintCustomRegion(form,x,y,radius,erase=false){form.customMask??=Array(form.N*form.N).fill(0);const gx=x/form.unit+form.cx,gy=form.cy-y/form.unit,r=radius/form.unit;for(let yy=Math.max(0,Math.floor(gy-r));yy<=Math.min(form.N-1,Math.ceil(gy+r));yy++)for(let xx=Math.max(0,Math.floor(gx-r));xx<=Math.min(form.N-1,Math.ceil(gx+r));xx++){const i=yy*form.N+xx;if(form.mask[i]&&(xx-gx)**2+(yy-gy)**2<=r*r)form.customMask[i]=erase?0:1;}return form.customMask;}
