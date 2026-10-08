import { z } from 'zod';
const monthSchema=z.string().trim().regex(/^\d{4}-(0[1-9]|1[0-2])$/,'Mês inválido');
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v,'Data inválida');
export function validCpf(cpf:string){if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf))return false;for(let n=9;n<11;n++){let s=0;for(let i=0;i<n;i++)s+=Number(cpf[i])*(n+1-i);const d=(s*10)%11;if(Number(cpf[n])!==(d===10?0:d))return false;}return true;}
export const coverageSchema=z.object({
 serviceType:z.enum(['cobertura','apoio_operacional']).default('cobertura'),
 name:z.string().trim().min(3,'Informe o nome completo').max(160), cpf:z.string().transform(v=>v.replace(/\D/g,'')).refine(validCpf,'CPF inválido'),operation:z.string().trim().min(1,'Informe a operação').max(120),start:date,end:date,month:monthSchema,weekdays:z.array(z.number().int().min(0).max(6)).min(1,'Selecione os dias da semana').max(7).refine(a=>new Set(a).size===a.length),justification:z.string().trim().min(1,'Informe a justificativa').max(2000),details:z.string().trim().max(2000),pix:z.string().trim().min(1,'Informe a conta ou PIX').max(250),thirdParty:z.string().trim().max(160),dailyCents:z.number().int().min(1,'Valor diário deve ser maior que zero').max(100000000),days:z.number().int().min(1).max(366)
}).strict().superRefine((v,c)=>{if(v.end<v.start)c.addIssue({code:'custom',message:'O fim deve ser igual ou posterior ao início',path:['end']});const span=(Date.parse(v.end)-Date.parse(v.start))/86400000+1;if(v.days>span)c.addIssue({code:'custom',message:'A quantidade de dias ultrapassa o período',path:['days']});if(span>366)c.addIssue({code:'custom',message:'Use um período de até 366 dias por registro',path:['end']});if(span>0&&span<=366&&v.weekdays.some(i=>!datesByWeekday(v.start,v.end)[i].length))c.addIssue({code:'custom',message:'Selecione somente dias da semana presentes no período',path:['weekdays']});});
export type CoverageInput=z.infer<typeof coverageSchema>;
export const serviceLabel=(type:string)=>type==='apoio_operacional'?'Apoio operacional':'Cobertura';
export type Coverage=CoverageInput&{id:string,ownerId:string,ownerName:string,ownerEmail:string,createdAt:string,totalCents:number};
export const dayLabels=['SEG','TER','QUA','QUI','SEX','SAB','DOM'];
export function datesByWeekday(start:string,end:string):string[][]{
 const groups:string[][]=Array.from({length:7},()=>[]);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start)return groups;
 const from=new Date(start+'T00:00:00Z'),to=new Date(end+'T00:00:00Z');
 if(!Number.isFinite(from.getTime())||!Number.isFinite(to.getTime())||from.toISOString().slice(0,10)!==start||to.toISOString().slice(0,10)!==end)return groups;
 const length=Math.round((to.getTime()-from.getTime())/86400000)+1;
 if(length>366)return groups;
 for(let i=0;i<length;i++){const d=new Date(from.getTime()+i*86400000);groups[(d.getUTCDay()+6)%7].push(d.toISOString().slice(0,10));}
 return groups;
}
export const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export const dateLabel=(v:string)=>v.split('-').reverse().join('/');

export function isPastWeekForSupport(endDate:string):boolean{
  if(!datesByWeekday(endDate,endDate).some(dates=>dates.length))return false;
  const parts=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const part=(type:string)=>parts.find(p=>p.type===type)!.value;
  const currentWeekStart=new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate()-((currentWeekStart.getUTCDay()+6)%7));
  return endDate<currentWeekStart.toISOString().slice(0,10);
}
