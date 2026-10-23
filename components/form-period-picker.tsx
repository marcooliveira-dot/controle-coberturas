'use client';
import MonthPicker from './month-picker';
import { monthWeeks,monthPeriod,periodChoice } from '@/lib/weeks';
import { dateLabel } from '@/lib/coverage';
export default function FormPeriodPicker({month,start,end,onMonthChange,onBlur,onPeriodChange,required}:{month:string,start:string,end:string,onMonthChange:(value:string)=>void,onBlur:()=>void,onPeriodChange:(start:string,end:string)=>void,required?:boolean}){
 const weeks=monthWeeks(month);
 return <><MonthPicker label="Mês de referência" value={month} onChange={onMonthChange} onBlur={onBlur} required={required}/><label className="block mt-3">Semana / período<select aria-label="Semana do cadastro" disabled={!weeks.length} value={periodChoice(month,start,end)} onChange={e=>{const period=monthPeriod(month,e.target.value);if(period)onPeriodChange(period.start,period.end);}}><option value="manual" disabled>Datas personalizadas (use os calendários)</option><option value="all">Mês inteiro</option>{weeks.map(week=><option key={week.id} value={week.id}>Semana {week.id} — {dateLabel(week.start)} a {dateLabel(week.end)}</option>)}</select></label><p className="text-sm mt-2">{weeks.length?'Escolha uma semana de segunda a domingo ou o mês inteiro para preencher início e fim. Você pode ajustar as datas nos calendários. As semanas completas podem atravessar meses.':'Selecione o mês e o ano para escolher uma semana.'}</p></>;
}
