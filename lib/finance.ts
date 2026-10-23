export const financeLabels = {
  pending: 'Pendente de análise', approved: 'Aceito — aguardando pagamento',
  rejected: 'Recusado', paid: 'Pago',
};
export type FinanceStatus = keyof typeof financeLabels;
export type FinanceEvent = {id:string,action:string,actor:string,at:string,note:string};
export type FinanceInfo = {
  status:FinanceStatus, rejectionReason:string, paidOn:string|null, updatedBy:string|null,
  updatedAt:string|null, lateReasons:string[], spansMonths:boolean,
};
export function brazilDate(now=new Date()){
  const parts=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part=(type:string)=>parts.find(p=>p.type===type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function deadlineFlags(record:{start:string,end:string,serviceType:string,createdAt:string}){
  const submitted=brazilDate(new Date(record.createdAt));
  const monday=new Date(submitted+'T00:00:00Z');
  monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
  const lateReasons:string[]=[];
  if(record.start.slice(0,7)<submitted.slice(0,7))lateReasons.push('O período inclui dias de mês anterior ao lançamento.');
  if(record.serviceType==='apoio_operacional'&&record.end<monday.toISOString().slice(0,10))lateReasons.push('A semana do apoio operacional já havia encerrado no lançamento.');
  return {lateReasons,spansMonths:record.start.slice(0,7)!==record.end.slice(0,7)};
}
export function canTransition(from:FinanceStatus,to:FinanceStatus){
  return (from==='pending'&&(to==='approved'||to==='rejected'))||
    (from==='rejected'&&to==='approved')||
    (from==='approved'&&(to==='rejected'||to==='paid'));
}
