export const GUIDE_TIMING={turn:400,walk:1800,stop:2200,total:2600};
export const GUIDE_ASSET='collection/001/front.webp?v=necklace1';
export function guideFrame(elapsed,width,startX=24,restX=24,timing=GUIDE_TIMING){
 const t=Math.max(0,Math.min(elapsed,timing.total));
 let progress=0,speed=0,state='LEAVING';
 if(t>=timing.turn&&t<timing.walk){progress=(t-timing.turn)/(timing.stop-timing.turn-(timing.stop-timing.walk)/2);speed=1;state='WALKING';}
 else if(t>=timing.walk){const u=Math.min(1,(t-timing.walk)/(timing.stop-timing.walk));const head=(timing.walk-timing.turn)/(timing.stop-timing.turn-(timing.stop-timing.walk)/2);progress=head+(1-head)*(2*u-u*u);speed=1-u;state='ARRIVING';}
 const pageX=-width*progress;
 // World movement and the camera/page movement share exactly the same progress.
 const worldX=startX+(width+restX-startX)*progress+width*.16*Math.sin(Math.PI*progress);
 const x=worldX+pageX;
 const walking=t>=timing.turn&&t<timing.stop;
 const arrival=t>=timing.stop?(t-timing.stop)/(timing.total-timing.stop):0;
 return {progress,pageX,x,state:t>=timing.total?'WAITING':state,
  y:walking?-Math.abs(Math.sin((t-timing.turn)/95))*7*speed:-Math.sin(Math.PI*arrival)*12,
  angle:walking?Math.sin((t-timing.turn)/95)*3*speed:0,
  turn:t<timing.turn?-22*t/timing.turn:t<timing.stop?-22:-22*(1-arrival)};
}
