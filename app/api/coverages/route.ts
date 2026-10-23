import { currentMember,database,errorResponse,json,HttpError,sameOrigin } from '@/lib/server';
import { coverageSchema } from '@/lib/coverage';
import { describeFinance } from '@/lib/finance-server';
export async function GET(r:Request){
  try{
    const m=await currentMember();if(m.role==='ceo')throw new HttpError(403,'Consulte os dados na visão executiva.');const month=new URL(r.url).searchParams.get('month');
    if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new HttpError(400,'Mês inválido');
    const conditions:string[]=[],args:string[]=[];
    if(m.role!=='admin'){conditions.push('c.owner_id = ?');args.push(m.userId)}
    if(month){conditions.push('c.month = ?');args.push(month)}
    const q='SELECT c.*, f.status,f.rejection_reason,f.paid_on,f.updated_by,f.updated_at FROM coverages c LEFT JOIN coverage_finance f ON f.coverage_id=c.id'+(conditions.length?' WHERE '+conditions.join(' AND '):'')+' ORDER BY c.created_at DESC, c.id DESC';
    const {results}=await database().prepare(q).bind(...args).all<any>();
    return json({financialControl:true,records:results.map(v=>({id:v.id,ownerId:v.owner_id,ownerName:v.owner_name,ownerEmail:v.owner_email,createdAt:v.created_at,serviceType:v.service_type,name:v.name,cpf:v.cpf,operation:v.operation,start:v.start,end:v.end,month:v.month,weekdays:JSON.parse(v.weekdays),workedDates:v.worked_dates?JSON.parse(v.worked_dates):undefined,doubledDates:JSON.parse(v.doubled_dates||'[]'),justification:v.justification,details:v.details,pix:v.pix,thirdParty:v.third_party,dailyCents:v.daily_cents,days:v.days,totalCents:v.total_cents,finance:describeFinance(v,v)}))});
  }catch(e){return errorResponse(e)}
}
export async function POST(r:Request){
  try{
    sameOrigin(r);const m=await currentMember();
    if(m.role!=='supervisor')throw new HttpError(403,'O administrativo analisa, aprova e paga os registros; somente supervisores podem cadastrar serviços.');
    const v=coverageSchema.safeParse(await r.json());
    if(!v.success)throw new HttpError(400,v.error.issues.map(i=>i.message).join('; '));
    const b=v.data,id=crypto.randomUUID();
    await database().prepare('INSERT INTO coverages (id,owner_id,owner_name,owner_email,created_at,name,cpf,operation,start,"end",month,weekdays,justification,details,pix,third_party,daily_cents,days,total_cents,service_type,worked_dates,doubled_dates) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,m.userId,m.name,m.email,new Date().toISOString(),b.name,b.cpf,b.operation,b.start,b.end,b.month,JSON.stringify(b.weekdays),b.justification,b.details,b.pix,b.thirdParty,b.dailyCents,b.days,b.dailyCents*b.days,b.serviceType,b.workedDates?JSON.stringify(b.workedDates):null,JSON.stringify(b.doubledDates||[])).run();
    return json({id},201);
  }catch(e){return errorResponse(e)}
}
