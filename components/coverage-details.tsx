import { serviceLabel,dateLabel,dayLabels,datesByWeekday,money,type Coverage } from '@/lib/coverage';
export default function CoverageDetails({record:r}:{record:Coverage}){
 const calendar=datesByWeekday(r.start,r.end);
 const days=r.weekdays.map(i=>dayLabels[i]+': '+calendar[i].filter(date=>!r.workedDates||r.workedDates.includes(date)).map(date=>dateLabel(date)+(r.doubledDates?.includes(date)?' (dobra)':'')).join(', ')).join('; ');
 return <dl>{[['Tipo',serviceLabel(r.serviceType)],['Operação / base',r.operation],['CPF',r.cpf],['Período',dateLabel(r.start)+' a '+dateLabel(r.end)],['Dias da semana',days],['Diárias',String(r.days)],['Valor diário',money(r.dailyCents)],['Total',money(r.totalCents)],['Conta / PIX',r.pix],['Titular de terceiros',r.thirdParty||'—'],['Justificativa',r.justification],['Detalhes da solicitação',r.details||'—'],['Supervisor',r.ownerName],['Registrado em',new Date(r.createdAt).toLocaleString('pt-BR')]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>;
}
