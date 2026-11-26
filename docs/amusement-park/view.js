import {mountThemes} from './themes.js?v=worlds2';
const asset=name=>new URL(name+'?v=worlds2',import.meta.url).href;
export function createPark(){
 const page=document.createElement('section');page.id='park-page';page.className='snoot-park';page.setAttribute('aria-label','SNOOT CLUB 互动游乐园');
 page.innerHTML='<div class="park-backdrop" aria-hidden="true"></div><div class="park-world"><img class="park-rest" src="'+asset('rest.webp')+'" alt="游乐园全景，香蕉娃娃、杯子熊和秋千上的 The Weeknd"><video class="park-action-video" playsinline muted loop preload="none" aria-label="所选角色的动作" hidden></video><div class="park-targets"><button class="park-target park-banana" data-action="banana" aria-label="和香蕉娃娃玩" aria-pressed="false"><span>香蕉娃娃 · 点击玩耍</span></button><button class="park-target park-cup" data-action="cup" aria-label="和杯子熊玩" aria-pressed="false"><span>杯子熊 · 点击玩耍</span></button><button class="park-target park-swing" data-action="swing" aria-label="荡秋千" aria-pressed="false"><span>秋千 · 点击荡起来</span></button></div></div><div class="park-hud"><a class="park-control" data-page="cafe" href="'+new URL('../#cafe',import.meta.url).href+'" aria-label="返回咖啡厅">← 返回</a><span class="park-wordmark">SNOOT CLUB <small>PLAYGROUND</small></span><div class="park-controls"><button class="park-control" data-stop hidden>停止 ↺</button><button class="park-control" data-fullscreen aria-label="进入全屏">⛶ 全屏</button></div></div><p class="park-status" role="status" aria-live="polite">点击娃娃玩耍，点击秋千荡起来。</p>';
 page.querySelector('.park-backdrop').style.backgroundImage='url("'+asset('rest.webp')+'")';
 const video=page.querySelector('video'),status=page.querySelector('.park-status'),stopButton=page.querySelector('[data-stop]'),full=page.querySelector('[data-fullscreen]');let active=null,request=0;
 page.querySelector('[data-page]').addEventListener('click',event=>{if(document.querySelector('#site-nav'))event.preventDefault();});
 const labels={banana:'香蕉娃娃',cup:'杯子熊',swing:'秋千'};
 function stop(message='再选一个朋友，一起玩吧。'){request++;video.pause();video.hidden=true;active=null;stopButton.hidden=true;page.dataset.action='';status.textContent=message;for(const b of page.querySelectorAll('[data-action]'))b.setAttribute('aria-pressed','false');}
 for(const button of page.querySelectorAll('[data-action]'))button.addEventListener('click',()=>{const key=button.dataset.action;if(active===key){stop();return;}stop();active=key;const token=++request;page.dataset.action=key;button.setAttribute('aria-pressed','true');stopButton.hidden=false;status.textContent='正在准备'+labels[key]+'的动作…';video.src=asset('action-'+key+'.mp4');video.currentTime=0;video.play().catch(error=>{if(token!==request)return;stop(error.name==='NotAllowedError'?'请再点一下，让朋友动起来。':'动作暂时没加载出来，请再点一次。');});});
 video.addEventListener('playing',()=>{if(!active)return;video.hidden=false;status.textContent=active==='swing'?'秋千荡起来了！再次点击可以停下。':labels[active]+'来陪你玩了！再次点击可以停下。';});
 video.addEventListener('error',()=>{if(active)stop('动作暂时没加载出来，请再点一次。');});
 stopButton.addEventListener('click',()=>stop());
 full.addEventListener('click',async()=>{try{if(document.fullscreenElement===page)await document.exitFullscreen();else if(page.requestFullscreen)await page.requestFullscreen();else status.textContent='已铺满网页；横屏可以看得更大。';}catch{status.textContent='已铺满网页，可以使用浏览器的全屏按钮。';}});
 document.addEventListener('fullscreenchange',()=>{const on=document.fullscreenElement===page;full.textContent=on?'⛶ 退出全屏':'⛶ 全屏';full.setAttribute('aria-label',on?'退出全屏':'进入全屏');});
 window.addEventListener('site-page-change',event=>{if(event.detail!=='park'){stop('点击娃娃玩耍，点击秋千荡起来。');if(document.fullscreenElement===page)document.exitFullscreen().catch(()=>{});}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 mountThemes(page,()=>stop());
 return page;
}
