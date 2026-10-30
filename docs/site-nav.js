import {createShop} from './shop-page.js?v=sitefreeze1';
import {aboutContent} from './about-content.js?v=aboutsoft2';
import {createGuide} from './guide-doll.js?v=sitefreeze1';
const header=document.querySelector('header');
const process=document.querySelector('#nav');document.querySelector('#design-desk').prepend(process);
const nav=document.createElement('nav');nav.id='site-nav';
nav.innerHTML=[['home','首页 / Home'],['about','品牌 / About'],['shop','商品 / Shop'],['create','创作 / Create'],['family','档案袋 / Archive'],['cafe','咖啡店 / Cafe']].map(([page,name])=>`<button data-page="${page}">${name}</button>`).join('');header.insertBefore(nav,header.querySelector('small'));header.querySelector('small')?.remove();
const home=document.createElement('section');home.id='home-page';
home.innerHTML='<img class="home-family-photo" src="assets/home-family.webp" alt="嘴筒子俱乐部六只毛绒朋友的全家福" fetchpriority="high"><div class="home-confetti" aria-hidden="true"></div><div class="home-hero-copy"><h1>SNOOT CLUB<span class="home-cn">嘴筒子俱乐部</span></h1><div class="home-choices"><button data-follow>YES, LET’S GO!<small>跟着娃娃探索 →</small></button><button data-free>EXPLORE MYSELF<small>我想自己逛逛</small></button></div></div>';
const confetti=home.querySelector('.home-confetti');for(let i=0;i<22;i++){const piece=document.createElement('i');piece.className=i%3===0?'confetti-star':'confetti-paper';piece.style.cssText=`--x:${(i*37+9)%100}%;--delay:${-i*.93}s;--duration:${16+i%6*3}s;--size:${5+i%4*2}px;--drift:${i%2?-28:34}px;--tone:${['#e593ae','#d5b78a','#d6d2c9','#89a7bb','#f2bec6'][i%5]}`;confetti.append(piece);}

// The existing home introduction becomes ABOUT; creation and archive remain intact.
const about=document.createElement('section');about.id='about-page';about.innerHTML=aboutContent;
const shop=createShop();
document.querySelector('.brand-showcase').before(home,about,shop);
const family=document.querySelector('.brand-showcase');let currentPage='home',activeTransition=null,guide;
const scrollPositions=new Map();
const aliases={archive:'family'};
function parseRoute(hash){const raw=hash.slice(1).split('/')[0];return aliases[raw]||(['home','about','shop','create','family','cafe'].includes(raw)?raw:'home');}
function pages(){return {home,about,shop,create:document.querySelector('#design-desk'),family,cafe:document.querySelector('#cafe-page')};}
function notify(page){nav.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));document.body.dataset.sitePage=page;window.dispatchEvent(new CustomEvent('site-page-change',{detail:page}));window.dispatchEvent(new Event('resize'));}
function route(page,{historyMode='push',hash=null,opening=false,animate=true}={}){
 page=aliases[page]||page;if(!pages()[page])page='home';
 if(activeTransition){if(historyMode==='none'){guide.cancel();}else return;}
 if(page===currentPage){if(hash&&location.hash!==hash)history.replaceState(null,'',hash);notify(page);guide?.update();return;}
 const nodes=pages(),outgoing=nodes[currentPage],incoming=nodes[page],old=currentPage;
 scrollPositions.set(old,scrollY);const rect=outgoing.getBoundingClientRect();
 const nextHash=hash||'#'+page;
 if(historyMode!=='none')history[historyMode==='replace'?'replaceState':'pushState'](null,'',nextHash);
 currentPage=page;
 const canAnimate=animate&&guide?.enabled&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!canAnimate){for(const [key,node] of Object.entries(nodes))if(node)node.hidden=key!==page;window.scrollTo({top:historyMode==='none'?(scrollPositions.get(page)||0):0,behavior:'instant'});notify(page);guide?.update();return;}
 const stage=document.createElement('div');stage.className='guide-transition';stage.setAttribute('aria-hidden','true');
 const from=document.createElement('div'),to=document.createElement('div');from.className=to.className='guide-page-frame';from.inert=to.inert=true;
 const fromInner=document.createElement('div'),toInner=document.createElement('div');fromInner.className=toInner.className='guide-page-inner';
 const fromMark=document.createComment('guide-page-home'),toMark=document.createComment('guide-page-home');outgoing.before(fromMark);incoming.before(toMark);
 const focus=document.activeElement;focus?.blur();
 // Keep the live page nodes: canvases, input values and listeners are never cloned.
 stage.append(from,to);from.append(fromInner);to.append(toInner);document.body.append(stage);
 const top=Math.max(0,header.getBoundingClientRect().bottom);stage.style.top=top+'px';
 outgoing.hidden=false;incoming.hidden=false;fromInner.append(outgoing);toInner.append(incoming);
 fromInner.style.transform=`translateY(${rect.top-outgoing.getBoundingClientRect().top}px)`;to.style.transform=`translateX(${innerWidth}px)`;
 const previousOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';document.body.classList.add('guide-transitioning');nav.querySelectorAll('[data-page]').forEach(b=>b.disabled=true);
 const finish=()=>{fromMark.replaceWith(outgoing);toMark.replaceWith(incoming);outgoing.hidden=true;incoming.hidden=false;fromInner.style.transform='';stage.remove();document.documentElement.style.overflow=previousOverflow;document.body.classList.remove('guide-transitioning');nav.querySelectorAll('[data-page]').forEach(b=>b.disabled=false);activeTransition=null;window.scrollTo({top:historyMode==='none'?(scrollPositions.get(page)||0):0,behavior:'instant'});window.dispatchEvent(new Event('resize'));incoming.setAttribute('tabindex','-1');incoming.focus({preventScroll:true});guide.update();};
 activeTransition={finish};
 try{notify(page);guide.travel({from,to,finish,opening});}catch(error){finish();console.warn('Guide transition ended safely',error);}
}
guide=createGuide({getPage:()=>currentPage,go:page=>route(page)});
document.addEventListener('click',e=>{const button=e.target.closest('[data-page],[data-follow],[data-free]');if(!button)return;if(button.hasAttribute('data-follow')){guide.setEnabled(true);route('about',{opening:true});}else if(button.hasAttribute('data-free')){guide.setEnabled(false);route('about');}else route(button.dataset.page);});
window.addEventListener('family-added',()=>route('family',{animate:false}));window.addEventListener('family-edit-ready',()=>route('create',{animate:false}));
function restoreRoute(){route(parseRoute(location.hash),{historyMode:'none',hash:location.hash,animate:false});}
window.addEventListener('popstate',restoreRoute);window.addEventListener('hashchange',restoreRoute);
const initialPage=parseRoute(location.hash);currentPage=initialPage;for(const [key,node] of Object.entries(pages()))if(node)node.hidden=key!==initialPage;notify(initialPage);guide.update();
