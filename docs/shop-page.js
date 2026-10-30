import {createRating} from './doll-reactions.js?v=necklace1';
export const shopProducts=[
 {id:'001',name:'项链熊 / Necklace Bear',image:'collection/001/front.webp?v=necklace1',status:'sold-out'},
 {id:'002',name:'娃娃 002 / Doll 002',image:'collection/002/front.webp',status:'sold-out'},
 {id:'cup-bear',name:'杯子熊',image:'assets/shop/cup-bear.webp',status:'sold-out'},
 {id:'bnaear',name:'Bnaear',image:'assets/shop/bnaear.webp',status:'sold-out'},
 {id:'koala',name:'KoalaBear',image:'assets/shop/koala.webp',status:'sold-out'},
 {id:'mountain-dog',name:'山狗星扣',image:'assets/shop/mountain-dog.webp',status:'sold-out'},
 {id:'xixi',name:'xixi',image:'assets/shop/xixi.webp',status:'sold-out'}
];
const bear='<svg class="shop-bear-icon" viewBox="0 0 18 20" aria-hidden="true"><circle cx="4" cy="4" r="3" fill="#ba895d"/><circle cx="14" cy="4" r="3" fill="#ba895d"/><ellipse cx="9" cy="14" rx="6" ry="5" fill="#a77850"/><ellipse cx="9" cy="8" rx="7" ry="6" fill="#ba895d"/><ellipse cx="9" cy="10" rx="3.5" ry="2.5" fill="#ebc997"/><circle cx="6" cy="7" r=".7" fill="#634239"/><circle cx="12" cy="7" r=".7" fill="#634239"/><ellipse cx="9" cy="9.5" rx="1.1" ry=".75" fill="#634239"/><path d="M9 10v1.6" stroke="#634239" stroke-width=".65"/></svg>';
const noodles='<svg class="shop-bear-icon" viewBox="0 0 18 20" aria-hidden="true"><path d="M5 1c-2 2 2 2 0 4M9 1c-2 2 2 2 0 4M13 1c-2 2 2 2 0 4" fill="none" stroke="#c69b78" stroke-width="1"/><ellipse cx="9" cy="9" rx="8" ry="3" fill="#edd3a0"/><path d="M2 9c0 5 2 8 7 8s7-3 7-8" fill="#c69b78"/><ellipse cx="9" cy="9" rx="7" ry="2.5" fill="#f4e1b8"/><path d="M4 9q2-3 4 0t5 0" fill="none" stroke="#b98e5d" stroke-width="1"/></svg>';
export function createShop(){
 const page=document.createElement('section');page.id='shop-page';page.innerHTML='<div class="shop-wrap"><div class="shop-heading"><h1>商品 / Shop</h1></div><div class="shop-cards" aria-label="俱乐部商品"></div></div>';
 const grid=page.querySelector('.shop-cards');
 for(const [i,product] of shopProducts.entries()){
  const card=document.createElement('article');card.className='shop-card';card.dataset.productId=product.id;
  if(product.status==='hot'){const flag=document.createElement('span');flag.className='shop-hot';flag.textContent='HOT';card.append(flag);}
  const frame=document.createElement('div');frame.className='shop-photo';const photo=document.createElement('img');photo.src=product.image;photo.alt=product.name;photo.loading=i<4?'eager':'lazy';photo.decoding='async';frame.append(photo);
  const title=document.createElement('h2');title.className='shop-card-title';title.innerHTML=i===0?noodles:bear;const name=document.createElement('span');name.textContent=product.name;title.append(name);
  const availability=document.createElement('span');availability.className='shop-availability';availability.dataset.status=product.status;availability.textContent=product.status==='hot'?'热卖中 · HOT':'SOLD OUT · 已售罄';
  card.append(frame,title,availability,createRating(product.id,product.name));grid.append(card);
 }
 return page;
}
