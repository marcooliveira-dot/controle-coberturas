import { rawDatabase } from './database';
export { transaction } from './database';
import { HttpError } from './server';
import { deadlineFlags, type FinanceInfo } from './finance';

export async function authorizedCoverage(id:string,member:{role:string,userId:string}){
  if(member.role==='ceo')throw new HttpError(404,'Registro não encontrado.');
  const row=await rawDatabase().prepare('SELECT * FROM coverages WHERE id=?').get(id) as any;
  if(!row||(member.role!=='admin'&&row.owner_id!==member.userId))throw new HttpError(404,'Registro não encontrado.');
  return row;
}
export async function financeInfo(row:any):Promise<FinanceInfo>{
  const db=rawDatabase();
  const finance=await db.prepare('SELECT * FROM coverage_finance WHERE coverage_id=?').get(row.id) as any;
  return describeFinance(row,finance);
}
export function describeFinance(row:any,finance:any):FinanceInfo{
  return {status:finance?.status||'pending',rejectionReason:finance?.rejection_reason||'',paidOn:finance?.paid_on||null,updatedBy:finance?.updated_by||null,updatedAt:finance?.updated_at||null,...deadlineFlags({start:row.start,end:row.end,serviceType:row.service_type,createdAt:row.created_at})};
}
export async function addFinanceEvent(id:string,action:string,actor:string,note=''){
  await rawDatabase().prepare('INSERT INTO finance_events(id,coverage_id,action,actor,at,note) VALUES (?,?,?,?,?,?)').run(crypto.randomUUID(),id,action,actor,new Date().toISOString(),note);
}
