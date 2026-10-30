// Explicit site removal. Applies equally to cloud records, offline backups and old device caches.
export const retiredMemberIds=new Set(['a9eeb5cf-6032-4ee2-a43e-78cd7abd393e']);
export const activeMember=member=>!retiredMemberIds.has(member?.id);
// A revision of the first club member keeps its public identity and reactions.
export const memberAliases=new Map([['850439df-2e5c-4898-9626-033af8714ecf','001']]);
export const canonicalMemberId=id=>memberAliases.get(id)||id;
export function canonicalMember(member){const id=canonicalMemberId(member.id);return id===member.id?member:{...member,id,_sourceId:member.id};}
