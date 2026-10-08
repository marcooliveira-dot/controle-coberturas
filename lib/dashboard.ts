import type { Coverage } from './coverage';
export type Totals={coverageCount:number,supportCount:number,coverageCents:number,supportCents:number,totalCents:number};
export type StoreTotals=Totals&{id:string,name:string};
export type SupervisorTotals=Totals&{id:string,name:string,email:string,stores:StoreTotals[]};
const empty=():Totals=>({coverageCount:0,supportCount:0,coverageCents:0,supportCents:0,totalCents:0});
const add=(t:Totals,r:Coverage)=>{if(r.serviceType==='apoio_operacional'){t.supportCount++;t.supportCents+=r.totalCents}else{t.coverageCount++;t.coverageCents+=r.totalCents}t.totalCents+=r.totalCents};
const byTotal=(a:Totals,b:Totals)=>(b.coverageCount+b.supportCount)-(a.coverageCount+a.supportCount)||b.totalCents-a.totalCents;
export function summarize(records:Coverage[],month:string){
 const totals=empty(),stores=new Map<string,StoreTotals>(),people=new Map<string,SupervisorTotals>();
 for(const r of records){if(r.month!==month)continue;const name=r.operation.trim().replace(/\s+/g,' '),key=name.toLocaleLowerCase('pt-BR');add(totals,r);let store=stores.get(key);if(!store){store={...empty(),id:key,name};stores.set(key,store)}add(store,r);let person=people.get(r.ownerId);if(!person){person={...empty(),id:r.ownerId,name:r.ownerName,email:r.ownerEmail,stores:[]};people.set(r.ownerId,person)}add(person,r);let detail=person.stores.find(s=>s.id===key);if(!detail){detail={...empty(),id:key,name};person.stores.push(detail)}add(detail,r);}
 for(const person of people.values())person.stores.sort(byTotal);
 return {totals,stores:Array.from(stores.values()).sort(byTotal),supervisors:Array.from(people.values()).sort((a,b)=>byTotal(a,b)||a.name.localeCompare(b.name,'pt-BR'))};
}
export function budgetStatus(totalCents:number,limitCents:number){if(limitCents<=0)return {tone:'unset' as const,label:'Sem limite definido',percent:0};const percent=totalCents/limitCents*100;if(totalCents>limitCents)return {tone:'danger' as const,label:'Limite ultrapassado',percent};if(totalCents*100>=limitCents*80)return {tone:'warning' as const,label:totalCents===limitCents?'Limite atingido':'Próximo do limite',percent};return {tone:'normal' as const,label:'Dentro do limite',percent};}
export function currentReportMonth(){const parts=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).formatToParts(new Date());return parts.find(p=>p.type==='year')!.value+'-'+parts.find(p=>p.type==='month')!.value;}
