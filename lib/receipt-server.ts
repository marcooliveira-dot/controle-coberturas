import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { attachmentLimit,attachmentType } from './attachments';
import { HttpError } from './server';
const execute=promisify(execFile);
export async function readReceipt(r:Request){
 let filename:string;
 try{filename=decodeURIComponent(r.headers.get('x-filename')||'')}catch{throw new HttpError(400,'Nome de arquivo inválido.')}
 filename=filename.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g,'').trim();
 if(!filename||filename.length>180)throw new HttpError(400,'Selecione um arquivo com nome de até 180 caracteres.');
 if(Number(r.headers.get('content-length'))>attachmentLimit)throw new HttpError(413,'O comprovante deve ter no máximo 5 MB.');
 if(!r.body)throw new HttpError(400,'Selecione um arquivo.');
 const reader=r.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>attachmentLimit){await reader.cancel();throw new HttpError(413,'O comprovante deve ter no máximo 5 MB.')}chunks.push(value)}}finally{reader.releaseLock()}
 const content=Buffer.concat(chunks),mime=attachmentType(content),extension=filename.split('.').pop()?.toLowerCase();
 if(!mime||(mime==='application/pdf'?extension!=='pdf':mime==='image/png'?extension!=='png':!['jpg','jpeg'].includes(extension||'')))throw new HttpError(400,'Envie um comprovante PDF, JPG ou PNG válido.');
 return {filename,content,mime};
}
export async function receiptText(content:Buffer,mime:string){
 const directory=await mkdtemp(join(tmpdir(),'coverage-receipt-'));
 const commandOptions={timeout:12000,maxBuffer:300000,env:{...process.env,OMP_THREAD_LIMIT:'1'}};
 try{
  const file=join(directory,mime==='application/pdf'?'receipt.pdf':mime==='image/png'?'receipt.png':'receipt.jpg');await writeFile(file,content,{mode:0o600});
  if(mime==='application/pdf'){
   try{const result=await execute('pdftotext',['-f','1','-l','5','-layout',file,'-'],commandOptions);if(result.stdout.trim().length>=40)return {text:result.stdout,method:'text'}}catch{}
   try{await execute('pdftoppm',['-f','1','-singlefile','-scale-to','1800','-png',file,join(directory,'page')],commandOptions);const result=await execute('tesseract',[join(directory,'page.png'),'stdout','-l','por','--psm','3'],commandOptions);return {text:result.stdout,method:'ocr'}}catch{return {text:'',method:'manual'}}
  }
  try{const result=await execute('tesseract',[file,'stdout','-l','por','--psm','3'],commandOptions);return {text:result.stdout,method:'ocr'}}catch{return {text:'',method:'manual'}}
 }finally{await rm(directory,{recursive:true,force:true})}
}
