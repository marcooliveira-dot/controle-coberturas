import { admin,errorResponse,HttpError,json,rateLimit,sameOrigin } from '@/lib/server';
import { rawDatabase } from '@/lib/database';
import { readReceipt,receiptText } from '@/lib/receipt-server';
import { matchReceipt,type ReceiptCandidate } from '@/lib/receipt-matching';
export const runtime='nodejs';
let active=0;
export async function POST(r:Request){
 let acquired=false;
 try{
  sameOrigin(r);const member=await admin();await rateLimit(r,'receipt-identify:'+member.userId);
  if(active>=1)throw new HttpError(429,'Outro comprovante está sendo identificado. Aguarde e tente novamente.');
  active++;acquired=true;
  const month=new URL(r.url).searchParams.get('month');if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new HttpError(400,'Mês inválido.');
  const file=await readReceipt(r),extracted=await receiptText(file.content,file.mime);
  const records=await rawDatabase().prepare('SELECT id,name,cpf,operation,month,owner_name AS "ownerName",total_cents AS "totalCents" FROM coverages'+(month?' WHERE month=?':'')+' ORDER BY created_at DESC').all<ReceiptCandidate>(...(month?[month]:[]));
  return json({candidates:matchReceipt(extracted.text,file.filename,records),method:extracted.method});
 }catch(e){return errorResponse(e)}finally{if(acquired)active--}
}
