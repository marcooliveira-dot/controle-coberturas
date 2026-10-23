import { currentMember,errorResponse,json } from '@/lib/server';
import { rawDatabase } from '@/lib/database';
export async function GET(){
 try{
  const member=await currentMember();
  const files=await rawDatabase().prepare('SELECT a.id,a.coverage_id AS "coverageId",a.filename,a.mime,a.size,a.uploaded_at AS "uploadedAt",c.name,c.cpf,c.operation,c.month,c.owner_name AS "ownerName",c.total_cents AS "totalCents" FROM finance_attachments a JOIN coverages c ON c.id=a.coverage_id'+(member.role==='admin'?'':' WHERE c.owner_id=?')+' ORDER BY a.uploaded_at DESC,a.id DESC').all(...(member.role==='admin'?[]:[member.userId]));
  return json({receipts:files});
 }catch(e){return errorResponse(e)}
}
