import {familyMembers,localFamilyMembers} from './family-store.js?v=fabricsave3';
import {activeMember} from './member-policy.js?v=builtinsave1';
const current=new Map(),listeners=new Set();let started=false,refreshing=null;
function accept(members){for(const member of members)if(activeMember(member)&&member.front){const old=current.get(member.id);if(old?.front===member.front&&old?.name===member.name)continue;current.set(member.id,member);for(const notify of listeners)notify(member);}}
export function refreshMemberArtwork(){if(refreshing)return refreshing;refreshing=(async()=>{accept(await localFamilyMembers());accept(await familyMembers({summary:true}));})().catch(error=>console.warn('娃娃展示暂时使用已保存的图片',error)).finally(()=>refreshing=null);return refreshing;}
export function watchMemberArtwork(notify){listeners.add(notify);for(const member of current.values())notify(member);if(!started){started=true;for(const event of ['family-added','family-updated','family-rendered'])window.addEventListener(event,e=>accept([e.detail]));window.addEventListener('site-page-change',()=>refreshMemberArtwork());refreshMemberArtwork();}return()=>listeners.delete(notify);}
