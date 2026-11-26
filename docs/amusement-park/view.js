import {mountThemes} from './themes.js?v=orbit2';
import {mountRealtime} from './realtime.js?v=orbit2';
const asset=name=>new URL(name+'?v=orbit2',import.meta.url).href;
export function createPark(){
 const page=document.createElement('section');page.id='park-page';page.className='snoot-park';page.setAttribute('aria-label','SNOOT CLUB 互动游乐园');
 page.innerHTML='<div class="park-backdrop" aria-hidden="true"></div><div class="park-world"><img class="park-rest" src="'+asset('rest.webp')+'" alt="游乐园三维场景加载预览"></div><div class="park-hud"><a class="park-control" data-page="cafe" href="'+new URL('../#cafe',import.meta.url).href+'" aria-label="返回咖啡厅">← 返回</a><span class="park-wordmark">SNOOT CLUB <small>PLAYGROUND</small></span><div class="park-controls"><button class="park-control" data-stop hidden>停止 ↺</button><button class="park-control" data-reset>重置视角</button><button class="park-control" data-fullscreen aria-label="进入全屏">⛶ 全屏</button></div></div><p class="park-status" role="status" aria-live="polite">拖动换角度 · 滚轮或双指缩放</p>';
 const status=page.querySelector('.park-status'),full=page.querySelector('[data-fullscreen]');
 page.querySelector('[data-page]').addEventListener('click',event=>{if(document.querySelector('#site-nav'))event.preventDefault();});
 const realtime=mountRealtime(page);page.querySelector('[data-stop]').addEventListener('click',()=>realtime.stop());
 full.addEventListener('click',async()=>{try{if(document.fullscreenElement===page)await document.exitFullscreen();else if(page.requestFullscreen)await page.requestFullscreen();else status.textContent='已铺满网页；横屏可以看得更大。';}catch{status.textContent='已铺满网页，可以使用浏览器的全屏按钮。';}});
 document.addEventListener('fullscreenchange',()=>{const on=document.fullscreenElement===page;full.textContent=on?'⛶ 退出全屏':'⛶ 全屏';full.setAttribute('aria-label',on?'退出全屏':'进入全屏');});
 window.addEventListener('site-page-change',event=>{if(event.detail!=='park'){realtime.stop();if(document.fullscreenElement===page)document.exitFullscreen().catch(()=>{});}});
 mountThemes(page,()=>realtime.stop());return page;
}
