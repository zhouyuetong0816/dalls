// Each photo lists every doll that can unlock it; pairs use OR matching.
export function dollKey(name) {
 const key=String(name||'').trim().toLowerCase().replace(/[\s_-]+/g,'');
 return ({banaer:'bnaear',banear:'bnaear',山星扣狗:'山狗星扣',考拉熊:'koalabear',盆栽:'theweekend','娃娃002':'theweekend'})[key]||key;
}
export function photosForDoll(entries,doll) {
 const key=dollKey(typeof doll==='string'?doll:doll?.name);
 if(!key)return [];
 return (entries||[]).filter(entry=>entry&&typeof entry.src==='string'&&Array.isArray(entry.dolls)&&entry.dolls.some(name=>dollKey(name)===key));
}
