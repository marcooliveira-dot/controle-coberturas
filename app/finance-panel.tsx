'use client';
import { useEffect,useState,useRef } from 'react';
import { Table,TableHeader,TableBody,TableRow,TableHead,TableCell } from '@/components/ui/table';
import { money,dateLabel,serviceLabel,type Coverage } from '@/lib/coverage';
import { brazilDate,financeLabels,canTransition,type FinanceEvent,type FinanceInfo,type FinanceStatus } from '@/lib/finance';
import { withBase } from '@/lib/paths';
import WeekFilter from '@/components/week-filter';
import { monthWeeks,recordInWeek } from '@/lib/weeks';
import FinanceAttachments from '@/components/finance-attachments';
import RecordDialog from '@/components/record-dialog';

async function request(path:string,options:RequestInit={}){
  const r=await fetch(withBase(path),{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options.headers}});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'Não foi possível concluir.');return data;
}
export function FinanceAlerts({onOpen}:{onOpen:()=>void}){
  const [count,setCount]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    request('/api/coverages',{signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setCount(data.records.filter((r:Coverage)=>r.finance?.status==='pending'&&r.finance.lateReasons.length).length);
    }).catch(()=>{});
    return()=>controller.abort();
  },[]);
  return count>0?<div className="message warning" role="alert"><strong>{count} registro(s) fora do prazo aguardam análise — considerando todos os meses.</strong> <button className="secondary" onClick={onOpen}>Abrir financeiro</button></div>:null;
}
export default function FinancePanel({admin}:{admin:boolean}){
  const [records,setRecords]=useState<Coverage[]>([]),[ready,setReady]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const [status,setStatus]=useState('all'),[month,setMonth]=useState(''),[lateOnly,setLateOnly]=useState(false),[search,setSearch]=useState(''),[selected,setSelected]=useState<Coverage|null>(null);
  const [events,setEvents]=useState<FinanceEvent[]>([]),[detailLoading,setDetailLoading]=useState(false),[detailReady,setDetailReady]=useState(false),[action,setAction]=useState<FinanceStatus|' '>(' '),[reason,setReason]=useState(''),[paidOn,setPaidOn]=useState(brazilDate());
  const [week,setWeek]=useState('all');
  useEffect(()=>{setWeek('all');setSelected(null);},[month]);
  async function load(){
    setLoading(true);setError('');
    try{const data=await request('/api/coverages');setRecords(data.records);setReady(data.financialControl===true)}catch(e){setError((e as Error).message)}finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[]);
  const selectedId=selected?.id;
  const selectedRef=useRef(selectedId);selectedRef.current=selectedId;
  useEffect(()=>{
    setEvents([]);setDetailReady(false);setAction(' ');setReason('');setPaidOn(brazilDate());
    if(!selectedId)return;
    const controller=new AbortController();setDetailLoading(true);
    request(`/api/coverages/${selectedId}/finance`,{signal:controller.signal}).then(data=>{
      if(controller.signal.aborted)return;setSelected(previous=>previous?.id===selectedId?{...previous,finance:data.finance}:previous);setEvents(data.events);setDetailReady(true);
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setDetailLoading(false)});
    return()=>controller.abort();
  },[selectedId]);
  const filtered=records.filter(r=>{
    const f=r.finance;
    return (!month||r.month===month)&&recordInWeek(r,monthWeeks(month).find(w=>w.id===week))&&(status==='all'||f?.status===status)&&(!lateOnly||!!f?.lateReasons.length)&&
      (!search||`${r.name} ${r.operation} ${r.ownerName}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  });
  async function update(e:React.FormEvent){
    e.preventDefault();if(!selected?.finance||action===' ')return;
    setBusy(true);setError('');setMessage('');
    try{
      const result=await request(`/api/coverages/${selected.id}/finance`,{method:'PATCH',body:JSON.stringify({status:action,expectedStatus:selected.finance.status,reason, ...(action==='paid'?{paidOn}:{})})});
      setSelected(previous=>previous?{...previous,finance:result.finance as FinanceInfo}:previous);
      setAction(' ');setReason('');setMessage('Situação financeira atualizada.');
      const detail=await request(`/api/coverages/${selected.id}/finance`);setEvents(detail.events);await load();
    }catch(e){setError((e as Error).message);setDetailReady(false)}finally{setBusy(false)}
  }
  const overdue=records.filter(r=>r.finance?.lateReasons.length&&r.finance.status==='pending');
  return <section className="panel finance-panel">
    <div className="toolbar"><h2>{admin?'Controle do financeiro':'Situação financeira dos meus serviços'}</h2><button className="secondary" disabled={loading||busy} onClick={()=>{setSelected(null);void load()}}>Atualizar</button></div>
    {error&&<div className="message error" role="alert">{error}</div>}{message&&<div className="message" role="status">{message}</div>}
    {!loading&&!ready?<p role="status">O controle financeiro precisa ser ativado na API e no banco antes do uso.</p>:<>
    {admin&&overdue.length>0&&<div className="message warning" role="alert"><strong>{overdue.length} {overdue.length===1?'registro fora do prazo aguarda':'registros fora do prazo aguardam'} análise.</strong> A lista considera todos os meses. Os períodos permanecem em um único registro.</div>}
    <div className="filters"><label>Situação<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Todas as situações</option>{Object.entries(financeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Mês de referência<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><WeekFilter month={month} value={week} onChange={value=>{setWeek(value);setSelected(null);}}/><label>Buscar prestador, loja ou supervisor<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="finance-check"><input type="checkbox" checked={lateOnly} onChange={e=>setLateOnly(e.target.checked)}/>Somente fora do prazo</label></div>
    <div className="metrics"><div><strong>{filtered.filter(r=>r.finance?.status==='pending').length}</strong><span>Pendentes de análise</span></div><div><strong>{money(filtered.filter(r=>r.finance?.status==='approved').reduce((n,r)=>n+r.totalCents,0))}</strong><span>Aceitos, aguardando pagamento</span></div><div><strong>{money(filtered.filter(r=>r.finance?.status==='paid').reduce((n,r)=>n+r.totalCents,0))}</strong><span>Pagos</span></div></div>
    {loading?<p role="status">Carregando situação financeira…</p>:<Table><TableHeader><TableRow>{['Prestador / serviço','Período','Supervisor','Valor','Situação / prazo',''].map((s,i)=><TableHead key={i}>{s}</TableHead>)}</TableRow></TableHeader><TableBody>{filtered.map(r=><TableRow key={r.id}><TableCell><strong>{r.name}</strong><small className="block">{serviceLabel(r.serviceType)} · {r.operation}</small></TableCell><TableCell>{dateLabel(r.start)} a {dateLabel(r.end)}{r.finance?.spansMonths&&<small className="block">Período atravessa dois ou mais meses</small>}</TableCell><TableCell>{r.ownerName}</TableCell><TableCell>{money(r.totalCents)}</TableCell><TableCell>{r.finance&&financeLabels[r.finance.status]}{!!r.finance?.lateReasons.length&&<strong className="block finance-late">Fora do prazo</strong>}</TableCell><TableCell><button className="secondary" disabled={busy} onClick={()=>{setError('');setMessage('');setSelected(r)}}>Consultar{admin?' / analisar':''}</button></TableCell></TableRow>)}</TableBody></Table>}
    {!loading&&!filtered.length&&<p className="empty-small">Nenhum registro encontrado.</p>}
    {selected&&<RecordDialog title={selected.name+' · '+serviceLabel(selected.serviceType)} description="Consulta e análise financeira do registro selecionado." onClose={()=>setSelected(null)} busy={busy} className="finance-panel">
      {error&&<div className="message error" role="alert">{error}</div>}{message&&<div className="message" role="status">{message}</div>}
      <dl>{[['Operação',selected.operation],['Supervisor',selected.ownerName],['CPF',selected.cpf],['Período',`${dateLabel(selected.start)} a ${dateLabel(selected.end)}`],['Total',money(selected.totalCents)],['Conta / PIX',selected.pix],['Titular de terceiros',selected.thirdParty||'—'],['Justificativa',selected.justification],['Detalhes',selected.details||'—'],['Situação',selected.finance?financeLabels[selected.finance.status]:'—'],['Motivo da recusa',selected.finance?.rejectionReason||'—'],['Data de pagamento',selected.finance?.paidOn?dateLabel(selected.finance.paidOn):'—'],['Última atualização por',selected.finance?.updatedBy||'—']].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      {!!selected.finance?.lateReasons.length&&<div className="message warning" role="alert"><strong>Lançamento fora do prazo</strong><ul>{selected.finance.lateReasons.map(reason=><li key={reason}>{reason}</li>)}</ul></div>}
      {selected.finance?.spansMonths&&<p>O período atravessa meses. Os dias e valores foram mantidos em um único registro.</p>}
      {detailLoading&&<p role="status">Consultando histórico…</p>}
      {admin&&selected.finance&&selected.finance.status!=='paid'&&<form onSubmit={update}><fieldset disabled={busy||!detailReady}><legend>Decisão do financeiro</legend><div className="fields"><label>Ação<select required value={action} onChange={e=>setAction(e.target.value as typeof action)}><option value=" ">Selecione uma ação</option>{(['approved','rejected','paid'] as FinanceStatus[]).filter(s=>canTransition(selected.finance!.status,s)).map(s=><option key={s} value={s}>{s==='approved'?'Aceitar registro':s==='rejected'?'Recusar registro':'Dar baixa como pago'}</option>)}</select></label>{action==='rejected'&&<label className="wide">Motivo da recusa *<textarea required maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></label>}{action==='paid'&&<label>Data do pagamento *<input required type="date" max={brazilDate()} value={paidOn} onChange={e=>setPaidOn(e.target.value)}/></label>}</div><p className="text-sm mt-3">A baixa confirma o pagamento integral de {money(selected.totalCents)} e não pode ser desfeita. Aceite o registro antes de pagar.</p><button className="primary mt-3" disabled={action===' '||busy}>{busy?'Salvando…':'Confirmar decisão'}</button></fieldset></form>}
       {selected.finance?.status==='paid'&&<p role="status">Baixa de pagamento registrada. Este registro está encerrado.</p>}
       <FinanceAttachments key={selected.id} coverageId={selected.id} admin={admin} disabled={busy||!detailReady} onUploaded={async()=>{const detail=await request(`/api/coverages/${selected.id}/finance`);if(selectedRef.current===selected.id)setEvents(detail.events);}}/>
      <h4 className="mt-5">Histórico do financeiro</h4>{detailReady&&!events.length&&<p>Ainda não houve decisão do financeiro.</p>}<ul>{events.map(event=><li key={event.id}><strong>{event.action==='attachment_uploaded'?'Anexo incluído':financeLabels[event.action as FinanceStatus]||event.action}</strong> · {event.actor} · {new Date(event.at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}{event.note&&<p>{event.action==='paid'?`Pagamento em ${dateLabel(event.note)}`:event.note}</p>}</li>)}</ul>
    </RecordDialog>}
    </>}
  </section>;
}
