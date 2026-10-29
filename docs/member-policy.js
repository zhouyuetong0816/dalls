// Explicit site removal. Applies equally to cloud records, offline backups and old device caches.
export const retiredMemberIds=new Set(['a9eeb5cf-6032-4ee2-a43e-78cd7abd393e']);
export const activeMember=member=>!retiredMemberIds.has(member?.id);
