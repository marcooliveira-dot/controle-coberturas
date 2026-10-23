import { admin,currentMember,errorResponse,json,sameOrigin,HttpError,rateLimit } from '@/lib/server';
import { rawDatabase,transaction } from '@/lib/database';
import { authorizedCoverage,addFinanceEvent } from '@/lib/finance-server';
import { attachmentLimit,attachmentType } from '@/lib/attachments';
export const runtime='nodejs';
type Context={params:Promise<{id:string}>};
let activeUploads=0;
export async function GET(_r:Request,context:Context){
 try{
  const member=await currentMember(),{id}=await context.params;
  await authorizedCoverage(id,member);
  const attachments=await rawDatabase().prepare('SELECT id,filename,mime,size,uploaded_by AS "uploadedBy",uploaded_at AS "uploadedAt" FROM finance_attachments WHERE coverage_id=? ORDER BY uploaded_at DESC,id DESC').all(id);
  return json({attachments});
 }catch(e){return errorResponse(e)}
}
export async function POST(r:Request,context:Context){
 let acquired=false;
 try{
  sameOrigin(r);const member=await admin(),{id}=await context.params;
  await authorizedCoverage(id,member);await rateLimit(r,'finance-upload:'+member.userId);
  if(activeUploads>=2)throw new HttpError(429,'Há outros anexos sendo enviados. Aguarde e tente novamente.');
  activeUploads++;acquired=true;
  let filename:string;
  try{filename=decodeURIComponent(r.headers.get('x-filename')||'')}catch{throw new HttpError(400,'Nome de arquivo inválido.')}
  filename=filename.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g,'').trim();
  if(!filename||filename.length>180)throw new HttpError(400,'Use um nome de arquivo com até 180 caracteres.');
  if(Number(r.headers.get('content-length'))>attachmentLimit)throw new HttpError(413,'O anexo deve ter no máximo 5 MB.');
  if(!r.body)throw new HttpError(400,'Selecione um arquivo.');
  const reader=r.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
    if(size>attachmentLimit){await reader.cancel();throw new HttpError(413,'O anexo deve ter no máximo 5 MB.')}
    chunks.push(value);
   }
  }finally{reader.releaseLock()}
  if(!size)throw new HttpError(400,'O arquivo está vazio.');
  const content=Buffer.concat(chunks),mime=attachmentType(content);
  const extension=filename.split('.').pop()?.toLowerCase();
  if(!mime||(mime==='application/pdf'?extension!=='pdf':mime==='image/png'?extension!=='png':!['jpg','jpeg'].includes(extension||'')))throw new HttpError(400,'Envie um arquivo PDF, JPG ou PNG válido.');
  const attachmentId=crypto.randomUUID(),uploadedAt=new Date().toISOString();
  await transaction(async()=>{
   await authorizedCoverage(id,member);
   const count=await rawDatabase().prepare('SELECT count(*) AS n FROM finance_attachments WHERE coverage_id=?').get(id) as any;
   if(Number(count.n)>=10)throw new HttpError(409,'Este registro já possui o limite de 10 anexos.');
   await rawDatabase().prepare('INSERT INTO finance_attachments(id,coverage_id,filename,mime,size,content,uploaded_by,uploaded_at) VALUES (?,?,?,?,?,?,?,?)').run(attachmentId,id,filename,mime,size,content,member.email,uploadedAt);
   await addFinanceEvent(id,'attachment_uploaded',member.email,filename);
  });
  return json({attachment:{id:attachmentId,filename,mime,size,uploadedBy:member.email,uploadedAt}},201);
 }catch(e){return errorResponse(e)}finally{if(acquired)activeUploads--}
}
