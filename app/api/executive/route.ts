import { currentMember,errorResponse,HttpError,json } from '@/lib/server';
import { rawDatabase } from '@/lib/database';
import { executiveSummary,type ExecutiveRecord } from '@/lib/executive';
export async function GET(r:Request){try{
 const member=await currentMember();if(member.role!=='admin'&&member.role!=='ceo')throw new HttpError(403,'Acesso exclusivo da direção e do administrativo.');
 const month=new URL(r.url).searchParams.get('month')||'';if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new HttpError(400,'Mês inválido.');
 const rows=await rawDatabase().prepare(`SELECT c.cpf AS "personKey",c.id,c.name,c.operation,c.owner_id AS "ownerId",c.owner_name AS "ownerName",c.month,c.start,c."end",c.days,c.daily_cents AS "dailyCents",c.total_cents AS "totalCents",c.service_type AS "serviceType",c.justification,c.details,COALESCE(f.status,'pending') AS status,f.paid_on AS "paidOn",(SELECT count(*) FROM finance_attachments a WHERE a.coverage_id=c.id) AS receipts FROM coverages c LEFT JOIN coverage_finance f ON f.coverage_id=c.id ORDER BY c.created_at DESC,c.id DESC`).all<ExecutiveRecord>();
 return json({...executiveSummary(rows,month),month,updatedAt:new Date().toISOString()});
}catch(e){return errorResponse(e)}}
