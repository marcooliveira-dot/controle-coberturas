'use client';
import { monthWeeks } from '@/lib/weeks';
import { dateLabel } from '@/lib/coverage';
export default function WeekFilter({month,value,onChange}:{month:string,value:string,onChange:(value:string)=>void}){
 const weeks=monthWeeks(month);
 return <label>Semana (segunda a domingo)<select value={weeks.length?value:'all'} disabled={!weeks.length} onChange={e=>onChange(e.target.value)}><option value="all">Mês inteiro</option>{weeks.map((week,i)=><option key={week.id} value={week.id}>Semana {i+1} — {dateLabel(week.start)} a {dateLabel(week.end)}</option>)}</select>{!weeks.length&&<small className="block">Selecione um mês para filtrar por semana.</small>}{weeks.length>0&&value!=='all'&&<small className="block">Exibe registros com dias trabalhados na semana. Valores integrais, sem rateio.</small>}</label>;
}
