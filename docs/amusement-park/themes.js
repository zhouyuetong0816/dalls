const asset=name=>new URL(name+'?v=worlds2',import.meta.url).href;
export function mountThemes(page,stopFull){
 const layer=document.createElement('div');layer.className='mini-world';layer.hidden=true;
 layer.innerHTML='<div class="mini-backdrop"></div><canvas class="mini-sky" aria-hidden="true"></canvas><img class="mini-model" alt=""><span class="mini-loading" role="status" hidden>场景正在加载…</span>';
 page.prepend(layer);
 const nav=document.createElement('div');nav.className='park-theme-switch';nav.setAttribute('role','group');nav.setAttribute('aria-label','选择游乐园场景');
 nav.innerHTML='<button data-world="full" aria-pressed="true">完整游乐园</button><button data-world="space" aria-pressed="false">太空秋千</button><button data-world="ocean" aria-pressed="false">海底大象</button>';page.append(nav);
 const canvas=layer.querySelector('canvas'),ctx=canvas.getContext('2d'),image=layer.querySelector('img'),back=layer.querySelector('.mini-backdrop'),loading=layer.querySelector('.mini-loading'),world=page.querySelector('.park-world'),backdrop=page.querySelector('.park-backdrop'),status=page.querySelector('.park-status');
 let selected='full',frame=0,width=0,height=0;let seed=7521;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const stars=Array.from({length:110},()=>({x:random(),y:random(),size:random()>.9?2.4:1,phase:random()*6.28,speed:.4+random()}));
 const bubbles=Array.from({length:22},()=>({x:random(),phase:random(),size:8+random()*22,speed:9+random()*14,drift:random()*6.28}));
 function resize(){width=Math.max(1,Math.round(page.clientWidth*.7));height=Math.max(1,Math.round(page.clientHeight*.7));canvas.width=width;canvas.height=height;}
 new ResizeObserver(resize).observe(page);
 function visible(){return selected!=='full'&&!page.hidden&&!document.hidden;}
 function draw(ms){
  frame=0;if(!visible())return;const t=ms/1000;ctx.clearRect(0,0,width,height);
  if(selected==='space'){
   for(const star of stars){const a=.2+.75*(.5+.5*Math.sin(t*star.speed+star.phase));const x=star.x*width,y=star.y*height;ctx.fillStyle='rgba(208,240,255,'+a+')';ctx.fillRect(Math.round(x),Math.round(y),star.size,star.size);if(star.size>2){ctx.fillRect(x-3,y+.7,8,1);ctx.fillRect(x+.7,y-3,1,8);}}
  }else{
   for(const bubble of bubbles){const phase=(t/bubble.speed+bubble.phase)%1;const x=bubble.x*width+Math.sin(t*.4+bubble.drift)*16,y=(1-phase)*(height+60)-30,r=bubble.size;ctx.lineWidth=1.2;ctx.strokeStyle='rgba(171,242,255,.48)';ctx.fillStyle='rgba(180,245,255,.025)';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(246,255,255,.8)';ctx.beginPath();ctx.arc(x-r*.14,y-r*.1,r*.7,Math.PI*1.04,Math.PI*1.48);ctx.stroke();}
  }
  frame=requestAnimationFrame(draw);
 }
 function animate(){cancelAnimationFrame(frame);frame=0;if(visible()){resize();frame=requestAnimationFrame(draw);}}
 function choose(key){
  selected=key;stopFull();page.dataset.world=key;layer.hidden=key==='full';world.hidden=key!=='full';backdrop.hidden=key!=='full';
  for(const b of nav.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.world===key));
  if(key==='full'){status.textContent='点击娃娃玩耍，点击秋千荡起来。';animate();return;}
  loading.hidden=false;image.src=asset(key+'-foreground.webp');image.alt=key==='space'?'原秋千、陨石坑星球、绿色外星人与金属飞船':'原大象滑梯、杯子熊、水草与珊瑚';back.style.backgroundImage='url("'+asset(key+'-background.webp')+'")';
  status.textContent=key==='space'?'太空秋千 · 蓝色星光在闪烁':'海底大象 · 泡泡正在缓缓上升';animate();
 }
 image.addEventListener('load',()=>loading.hidden=true);image.addEventListener('error',()=>loading.textContent='场景暂时没加载出来，请重新选择。');
 for(const button of nav.querySelectorAll('button'))button.addEventListener('click',()=>choose(button.dataset.world));
 window.addEventListener('site-page-change',()=>animate());document.addEventListener('visibilitychange',animate);
 return {choose};
}
