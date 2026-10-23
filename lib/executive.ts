import { coverageRates } from './coverage';
export type ExecutiveRecord={personKey?:string,id:string,name:string,operation:string,ownerId:string,ownerName:string,month:string,start:string,end:string,days:number,dailyCents:number,totalCents:number,serviceType:string,status:string,paidOn:string|null,justification:string,details:string,receipts:number};
export type StoreSummary={id:string,name:string,operations:string[],coverageCents:number,extraCents:number,paidCents:number,pendingCents:number,rejectedCents:number,count:number,days:number,people:number,records:ExecutiveRecord[],supervisors:{id:string,name:string,coverageCents:number,extraCents:number,count:number}[],trend:{month:string,coverageCents:number,extraCents:number}[]};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const known=Array.from(new Set(coverageRates.map(r=>r.name).filter(n=>n.startsWith('FA ')))).map(name=>({key:normalize(name.slice(3)),name:name.slice(3)}));
export function storeIdentity(operation:string){
 const normalized=normalize(operation),short=normalized.replace(/^(FA|FRANGO ASSADO)\s+/,''),match=known.find(s=>s.key===short);
 if(!match&&!/^(FA|FRANGO ASSADO)\s+/.test(normalized))return null;
 return {id:'fa-'+short.toLowerCase().replace(/ /g,'-'),name:match?.name||operation.replace(/^(FA|FRANGO\s+ASSADO)\s+/i,'').trim()};
}
export function executiveSummary(records:ExecutiveRecord[],month:string){
 const stores=new Map<string,StoreSummary>(),people=new Map<string,Set<string>>();
 const make=(id:string,name:string):StoreSummary=>({id,name,operations:[],coverageCents:0,extraCents:0,paidCents:0,pendingCents:0,rejectedCents:0,count:0,days:0,people:0,records:[],supervisors:[],trend:[]});
 for(const s of known){const identity=storeIdentity('FA '+s.name)!;stores.set(identity.id,make(identity.id,identity.name))}
 const current=month||new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date());
 const [year,number]=current.split('-').map(Number);
 const months=Array.from({length:6},(_,i)=>new Date(Date.UTC(year,number-6+i,1)).toISOString().slice(0,7));
 for(const row of records){const identity=storeIdentity(row.operation);if(!identity)continue;if(!stores.has(identity.id))stores.set(identity.id,make(identity.id,identity.name));const store=stores.get(identity.id)!;
  if(!store.operations.includes(row.operation))store.operations.push(row.operation);
  if(!month||row.month===month){const {personKey,...safe}=row;store.records.push(safe);if(row.status!=='rejected'){const keys=people.get(identity.id)||new Set<string>();keys.add(personKey||normalize(row.name));people.set(identity.id,keys)}}
 }
 for(const store of stores.values()){
  const supervisors=new Map<string,StoreSummary['supervisors'][number]>();
  for(const r of store.records){store.count++;if(r.status==='rejected'){store.rejectedCents+=r.totalCents;continue}store.days+=r.days;const coverage=r.serviceType==='cobertura';if(coverage)store.coverageCents+=r.totalCents;else store.extraCents+=r.totalCents;if(r.status==='paid')store.paidCents+=r.totalCents;else store.pendingCents+=r.totalCents;
   const supervisor=supervisors.get(r.ownerId)||{id:r.ownerId,name:r.ownerName,coverageCents:0,extraCents:0,count:0};supervisor.count++;if(coverage)supervisor.coverageCents+=r.totalCents;else supervisor.extraCents+=r.totalCents;supervisors.set(r.ownerId,supervisor);
  }
  store.people=people.get(store.id)?.size||0;
  store.supervisors=[...supervisors.values()].sort((a,b)=>(b.coverageCents+b.extraCents)-(a.coverageCents+a.extraCents));
  const history=records.filter(r=>storeIdentity(r.operation)?.id===store.id&&r.status!=='rejected');
  store.trend=months.map(m=>({month:m,coverageCents:history.filter(r=>r.month===m&&r.serviceType==='cobertura').reduce((n,r)=>n+r.totalCents,0),extraCents:history.filter(r=>r.month===m&&r.serviceType!=='cobertura').reduce((n,r)=>n+r.totalCents,0)}));
 }
 const list=[...stores.values()];return {stores:list,totals:{coverageCents:list.reduce((n,s)=>n+s.coverageCents,0),extraCents:list.reduce((n,s)=>n+s.extraCents,0),paidCents:list.reduce((n,s)=>n+s.paidCents,0),pendingCents:list.reduce((n,s)=>n+s.pendingCents,0),count:list.reduce((n,s)=>n+s.count,0),activeStores:list.filter(s=>s.count>0).length}};
}
