import { currentMember,errorResponse,HttpError } from '@/lib/server';
import { authorizedCoverage } from '@/lib/finance-server';
import { rawDatabase } from '@/lib/database';
export const runtime='nodejs';
export async function GET(_r:Request,context:{params:Promise<{id:string,attachmentId:string}>}){
 try{
  const member=await currentMember(),{id,attachmentId}=await context.params;
  await authorizedCoverage(id,member);
  const file=await rawDatabase().prepare('SELECT filename,mime,size,content FROM finance_attachments WHERE coverage_id=? AND id=?').get(id,attachmentId) as any;
  if(!file)throw new HttpError(404,'Anexo não encontrado.');
  const filename=encodeURIComponent(file.filename).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  return new Response(new Uint8Array(file.content),{headers:{
   'Content-Type':file.mime,'Content-Length':String(file.size),
   'Content-Disposition':`attachment; filename="comprovante"; filename*=UTF-8''${filename}`,
   'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"
  }});
 }catch(e){return errorResponse(e)}
}
