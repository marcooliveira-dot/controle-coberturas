'use client';
import { useEffect,useRef,useState } from 'react';
import { withBase } from '@/lib/paths';
import { attachmentLimit,type FinanceAttachment } from '@/lib/attachments';
export default function FinanceAttachments({coverageId,admin,disabled,onUploaded}:{coverageId:string,admin:boolean,disabled:boolean,onUploaded:()=>Promise<void>}){
 const [files,setFiles]=useState<FinanceAttachment[]>([]),[file,setFile]=useState<File|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const input=useRef<HTMLInputElement>(null),path=`/api/coverages/${coverageId}/finance/attachments`;
 useEffect(()=>{
  const controller=new AbortController();
  fetch(withBase(path),{cache:'no-store',signal:controller.signal}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível consultar anexos.');if(!controller.signal.aborted)setFiles(data.attachments)}).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[path]);
 async function upload(e:React.FormEvent){
  e.preventDefault();if(!file)return;
  setError('');setMessage('');if(file.size>attachmentLimit){setError('O anexo deve ter no máximo 5 MB.');return}
  setBusy(true);
  try{
   const r=await fetch(withBase(path),{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-Filename':encodeURIComponent(file.name)},body:file});
   const data=await r.json();if(!r.ok)throw Error(data.error||'Não foi possível anexar o arquivo.');
   setFiles(p=>[data.attachment,...p]);setFile(null);if(input.current)input.current.value='';setMessage('Anexo salvo.');
   await onUploaded();
  }catch(e){setError((e as Error).message)}finally{setBusy(false)}
 }
 return <section aria-label="Anexos do financeiro" className="mt-5"><h4>Anexos / comprovantes</h4><p className="text-sm">PDF, JPG ou PNG, até 5 MB por arquivo e 10 anexos por registro. O financeiro pode anexar antes ou depois da baixa.</p>
  {error&&<p className="message error" role="alert">{error}</p>}{message&&<p className="message" role="status">{message}</p>}
  {loading?<p role="status">Consultando anexos…</p>:files.length?<ul>{files.map(f=><li key={f.id}><a className="underline" href={withBase(path+'/'+f.id)} download>{f.filename}</a> · {(f.size/1024).toFixed(1)} KB<small className="block">Anexado por {f.uploadedBy} · {new Date(f.uploadedAt).toLocaleString('pt-BR')}</small></li>)}</ul>:<p>Nenhum anexo neste registro.</p>}
  {admin&&<form onSubmit={upload} className="mt-3"><label>Comprovante / anexo<input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy||disabled||loading||files.length>=10} required onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="primary mt-3" disabled={!file||busy||disabled||loading||files.length>=10}>{busy?'Anexando…':'Anexar arquivo'}</button></form>}
 </section>;
}
