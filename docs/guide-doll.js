import {guideFrame,GUIDE_TIMING,GUIDE_ASSET} from './guide-motion.js?v=guided2';
const stops=['home','about','shop','family','create'];
const labels={home:'HOME',about:'ABOUT',shop:'SHOP',family:'ARCHIVE',create:'CREATE',cafe:'CAFÉ'};
export function createGuide({getPage,go}){
 let enabled=false;try{enabled=sessionStorage.getItem('soft-things-follow')==='on';}catch{}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const layer=document.createElement('aside');layer.className='guide-layer';layer.setAttribute('aria-label','娃娃向导');
 layer.innerHTML=`<div class="guide-anchor"><button class="guide-doll" aria-label="轻轻跳一下"><img src="${GUIDE_ASSET}" alt="泡面头向导" draggable="false"></button><span class="guide-bubble" role="status" hidden>Here we are!</span><button class="guide-next"></button></div>`;
 document.body.append(layer);
 const anchor=layer.querySelector('.guide-anchor'),doll=layer.querySelector('.guide-doll'),bubble=layer.querySelector('.guide-bubble'),next=layer.querySelector('.guide-next');
 const toggle=document.createElement('button');toggle.className='guide-mode';toggle.setAttribute('aria-pressed',String(enabled));document.querySelector('#site-nav').append(toggle);
 let state='IDLE',inFlight=null,bubbleTimer,frameId;
 function setState(value){state=value;layer.dataset.state=value;}
 function update(){document.body.dataset.followGuide=enabled?'on':'off';const page=getPage();if(page==='home'&&!inFlight)document.querySelector('[data-guide-source]')?.classList.remove('guide-source-away');layer.hidden=!enabled||page==='home';layer.classList.toggle('guide-create',page==='create');toggle.textContent=enabled?'FOLLOW ON':'FOLLOW OFF';toggle.setAttribute('aria-pressed',String(enabled));const i=stops.indexOf(page);const target=i>=0&&i<stops.length-1?stops[i+1]:'home';next.dataset.destination=target;next.textContent=target==='home'?'BACK TO HOME ↺':'NEXT STOP: '+labels[target]+' →';if(!inFlight)setState(enabled?'WAITING':'IDLE');}
 function save(){try{sessionStorage.setItem('soft-things-follow',enabled?'on':'off');}catch{}}
 function setEnabled(value){enabled=value;save();if(!enabled&&inFlight)inFlight.finish();update();}
 toggle.onclick=()=>setEnabled(!enabled);
 next.onclick=()=>go(next.dataset.destination);
 doll.onclick=()=>{if(inFlight||reduced.matches)return;doll.animate([{transform:'translateY(0)'},{transform:'translateY(-12px)',offset:.45},{transform:'translateY(0)'}],{duration:420,easing:'ease-out'});};
 function travel({from,to,finish,opening=false}){
 if(!enabled||reduced.matches){finish();update();return;}
 let completed=false,startTime=null;
 const width=innerWidth,restX=innerWidth<760?10:24;
 const homeDoll=document.querySelector('.home-doll[data-guide-source]');
 const homeRect=opening&&homeDoll?homeDoll.getBoundingClientRect():null;
 const startX=homeRect?Math.max(restX,Math.min(width*.49+restX,homeRect.left)):restX;
 const baseBottom=innerWidth<760?18:24;
 const startBottom=homeRect?Math.max(baseBottom,innerHeight-homeRect.bottom):baseBottom;
 const targetSize=innerWidth<760?76:100;
 anchor.style.left='0';anchor.style.bottom=baseBottom+'px';anchor.style.transform=`translateX(${startX}px)`;
 layer.hidden=false;layer.classList.remove('guide-create');next.hidden=true;bubble.hidden=true;clearTimeout(bubbleTimer);
 if(homeDoll)homeDoll.classList.toggle('guide-source-away',opening);
 const end=()=>{if(completed)return;completed=true;cancelAnimationFrame(frameId);from.style.transform=to.style.transform='';anchor.style.left='';anchor.style.bottom='';anchor.style.transform='';doll.style.transform='';doll.style.width=doll.style.height='';next.hidden=false;inFlight=null;finish();update();if(enabled){bubble.hidden=false;bubbleTimer=setTimeout(()=>bubble.hidden=true,1800);}};
 inFlight={finish:end};setState('LEAVING');
 function tick(now){if(startTime===null)startTime=now;const elapsed=now-startTime;const f=guideFrame(elapsed,width,startX,restX);setState(f.state);if(homeRect){doll.style.width=(homeRect.width+(targetSize-homeRect.width)*f.progress)+'px';doll.style.height=(homeRect.height+(targetSize-homeRect.height)*f.progress)+'px';}from.style.transform=`translate3d(${f.pageX}px,0,0)`;to.style.transform=`translate3d(${width+f.pageX}px,0,0)`;anchor.style.transform=`translate3d(${f.x}px,${-(startBottom-baseBottom)*(1-f.progress)}px,0)`;doll.style.transform=`translateY(${f.y}px) rotate(${f.angle}deg) rotateY(${f.turn}deg)`;if(elapsed>=GUIDE_TIMING.total)end();else frameId=requestAnimationFrame(tick);}
 frameId=requestAnimationFrame(tick);
 }
 reduced.addEventListener('change',()=>{if(reduced.matches&&inFlight)inFlight.finish();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&inFlight)inFlight.finish();});
 window.addEventListener('resize',()=>{if(inFlight)inFlight.finish();});
 update();return {travel,update,setEnabled,get enabled(){return enabled;},get busy(){return !!inFlight;},cancel(){inFlight?.finish();}};
}
