import { z } from 'zod';
import { admin,currentMember,errorResponse,json,sameOrigin,HttpError } from '@/lib/server';
import { rawDatabase } from '@/lib/database';
import { authorizedCoverage,financeInfo,transaction,addFinanceEvent } from '@/lib/finance-server';
import { brazilDate,canTransition } from '@/lib/finance';
type Context={params:Promise<{id:string}>};
export async function GET(_r:Request,context:Context){
  try{
    const member=await currentMember(),{id}=await context.params,row=await authorizedCoverage(id,member),db=rawDatabase();
    const events=await db.prepare('SELECT id,action,actor,at,note FROM finance_events WHERE coverage_id=? ORDER BY at DESC,id DESC').all(id);
    return json({finance:await financeInfo(row),events});
  }catch(e){return errorResponse(e)}
}
const updateSchema=z.object({status:z.enum(['approved','rejected','paid']),expectedStatus:z.enum(['pending','approved','rejected','paid']),reason:z.string().trim().max(2000).default(''),paidOn:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()}).strict();
export async function PATCH(r:Request,context:Context){
  try{
    sameOrigin(r);const member=await admin(),{id}=await context.params;
    const parsed=updateSchema.safeParse(await r.json());if(!parsed.success)throw new HttpError(400,'Informe uma situação válida e confira os campos.');
    const input=parsed.data;
    if(input.status==='rejected'&&!input.reason)throw new HttpError(400,'Informe o motivo da recusa.');
    if(input.status==='paid'&&(!input.paidOn||!Number.isFinite(Date.parse(input.paidOn))||new Date(input.paidOn).toISOString().slice(0,10)!==input.paidOn||input.paidOn>brazilDate()))throw new HttpError(400,'Informe uma data de pagamento válida, não futura.');
    const result=await transaction(async()=>{
      const row=await authorizedCoverage(id,member),current=await financeInfo(row);
      if(current.status!==input.expectedStatus)throw new HttpError(409,'A situação mudou. Atualize o registro antes de continuar.');
      if(!canTransition(current.status,input.status))throw new HttpError(409,'Aceite o registro antes de pagar. Registros pagos não podem ser alterados.');
      const now=new Date().toISOString();
      await rawDatabase().prepare('INSERT INTO coverage_finance(coverage_id,status,rejection_reason,paid_on,updated_by,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(coverage_id) DO UPDATE SET status=excluded.status,rejection_reason=excluded.rejection_reason,paid_on=excluded.paid_on,updated_by=excluded.updated_by,updated_at=excluded.updated_at').run(id,input.status,input.status==='rejected'?input.reason:'',input.status==='paid'?input.paidOn!:null,member.email,now);
      await addFinanceEvent(id,input.status,member.email,input.status==='paid'?input.paidOn!:input.reason);
      return financeInfo(row);
    });
    return json({finance:result});
  }catch(e){return errorResponse(e)}
}
