import { getUser } from './auth';
import { database } from './database';
export { database };
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');const expected=process.env.APP_ORIGIN||new URL(r.url).origin;if(origin&&origin!==expected)throw new HttpError(403,'Origem não autorizada');}
export async function currentMember(){const u=await getUser();if(!u)throw new HttpError(401,'Entre com sua conta para continuar.');return {...u,name:u.displayName,primary_admin:u.primary?1:0};}
export async function admin(){const m=await currentMember();if(m.role!=='admin')throw new HttpError(403,'Acesso exclusivo do administrativo.');return m;}
export function errorResponse(e:unknown){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});console.error('Coverage request failed',e);return Response.json({error:'Não foi possível concluir. Seus dados no formulário foram mantidos; tente novamente.'},{status:503,headers:{'Cache-Control':'no-store'}});}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function rateLimit(r:Request,scope:string){const ip=r.headers.get('x-real-ip')||'local';const db=requireDb();const key=scope+':'+ip;const now=Date.now();const row=db.prepare('SELECT attempts,window_start FROM auth_limits WHERE key=?').get(key) as any;if(row&&row.window_start>now-900000&&row.attempts>=30)throw new HttpError(429,'Muitas tentativas. Aguarde 15 minutos e tente novamente.');db.prepare('INSERT INTO auth_limits(key,attempts,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END').run(key,now,now-900000,now-900000);db.prepare('DELETE FROM auth_limits WHERE window_start<?').run(now-86400000);}
import { rawDatabase as requireDb } from './database';
