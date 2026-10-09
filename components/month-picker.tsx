'use client';
import { useState } from 'react';

const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
type Props={value:string,onChange:(value:string)=>void,onBlur?:()=>void,required?:boolean,disabled?:boolean,label?:string};
export default function MonthPicker({value,onChange,onBlur,required=false,disabled=false,label='Mês de referência'}:Props){
  const currentYear=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric'}).format(new Date());
  const [draftYear,setDraftYear]=useState(currentYear);
  const valid=/^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  const year=valid?value.slice(0,4):draftYear,month=valid?value.slice(5):'';
  const years=Array.from(new Set([...Array.from({length:21},(_,i)=>String(Number(currentYear)-10+i)),year])).sort();
  return <div role="group" aria-label={label} className="month-picker" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) 100px',gap:10}}>
    <label>Mês<select aria-label={`${label} — mês`} value={month} required={required} disabled={disabled} onBlur={onBlur} onChange={e=>{setDraftYear(year);onChange(e.target.value?`${year}-${e.target.value}`:'')}}><option value="">Selecione o mês</option>{months.map((name,i)=><option key={name} value={String(i+1).padStart(2,'0')}>{name}</option>)}</select></label>
    <label>Ano<select aria-label={`${label} — ano`} value={year} required={required} disabled={disabled} onBlur={onBlur} onChange={e=>{setDraftYear(e.target.value);if(month)onChange(`${e.target.value}-${month}`)}}>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></label>
  </div>;
}
