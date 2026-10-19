// One vote per doll in this browser; no invented public totals.
const prefix='snoot-reactions-v1:';
const heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
function read(kind,id){try{const n=Number(localStorage.getItem(prefix+kind+':'+id));return Number.isInteger(n)&&n>=0&&n<=(kind==='rating'?5:1)?n:0;}catch{return 0;}}
function write(kind,id,value){try{localStorage.setItem(prefix+kind+':'+id,String(value));window.dispatchEvent(new CustomEvent('snoot-reaction-change',{detail:{kind,id}}));return true;}catch{return false;}}
function observe(element,kind,id,render){const refresh=()=>{if(!element.isConnected)return;render();};window.addEventListener('storage',e=>{if(e.key===null||e.key===prefix+kind+':'+id)refresh();});window.addEventListener('snoot-reaction-change',e=>{if(e.detail.kind===kind&&e.detail.id===id)refresh();});}
export function createRating(id,name){
 const box=document.createElement('div');box.className='doll-rating';
 const group=document.createElement('div');group.className='rating-hearts';group.setAttribute('role','radiogroup');group.setAttribute('aria-label',name+'的评分');
 const note=document.createElement('small');note.className='reaction-note';note.setAttribute('role','status');
 const buttons=[];
 function render(){const value=read('rating',id);buttons.forEach((b,i)=>{b.classList.toggle('filled',i<value);b.setAttribute('aria-checked',String(i+1===value));b.tabIndex=i===(value?value-1:0)?0:-1;});note.textContent=value?'你的评分 '+value+' / 5':'点亮小心心，留下评分';}
 function select(value){if(write('rating',id,value))render();else note.textContent='无法保存，请允许浏览器本地存储后重试';}
 for(let score=1;score<=5;score++){const b=document.createElement('button');b.type='button';b.className='rating-heart';b.innerHTML=heart;b.setAttribute('role','radio');b.setAttribute('aria-label',score+' 颗心');b.addEventListener('click',()=>select(score));b.addEventListener('keydown',e=>{let n;if(['ArrowRight','ArrowDown'].includes(e.key))n=score===5?1:score+1;else if(['ArrowLeft','ArrowUp'].includes(e.key))n=score===1?5:score-1;else if(e.key==='Home')n=1;else if(e.key==='End')n=5;else return;e.preventDefault();select(n);buttons[n-1].focus();});buttons.push(b);group.append(b);}
 box.append(group,note);render();observe(box,'rating',id,render);return box;
}
export function createLike(id,name){
 const box=document.createElement('div');box.className='doll-like';const button=document.createElement('button');button.type='button';button.className='doll-like-button';button.innerHTML=heart;const count=document.createElement('span');button.append(count);const note=document.createElement('small');note.className='reaction-note';note.setAttribute('role','status');
 function render(){const value=read('like',id);button.setAttribute('aria-pressed',String(!!value));button.setAttribute('aria-label',(value?'取消点赞':'点赞')+' '+name);count.textContent=value+' 赞';button.classList.toggle('filled',!!value);note.textContent='此浏览器的点赞';}
 button.addEventListener('click',()=>{if(write('like',id,read('like',id)?0:1))render();else note.textContent='无法保存，请允许浏览器本地存储后重试';});box.append(button,note);render();observe(box,'like',id,render);return box;
}
export function decorateFamilyTile(tile){const wrapper=document.createElement('div');wrapper.className='family-social-card';tile.replaceWith(wrapper);wrapper.append(tile,createLike(tile.dataset.memberId,tile.querySelector('img')?.alt||'娃娃'));return wrapper;}
