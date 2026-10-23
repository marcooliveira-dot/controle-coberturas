import { getUser } from './auth';
import { database } from './database';
export { database };
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');const expected=process.env.APP_ORIGIN||new URL(r.url).origin;const allowed=[expected,...(process.env.ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean)].map(v=>new URL(v).origin);if(origin&&!allowed.includes(origin))throw new HttpError(403,'Origem não autorizada');}
export async function currentMember(){const u=await getUser();if(!u)throw new HttpError(401,'Entre com sua conta para continuar.');return {...u,name:u.displayName,primary_admin:u.primary?1:0};}
export async function admin(){const m=await currentMember();if(m.role!=='admin')throw new HttpError(403,'Acesso exclusivo do administrativo.');return m;}
export function errorResponse(e:unknown){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});console.error('Coverage request failed',e);return Response.json({error:'Não foi possível concluir. Seus dados no formulário foram mantidos; tente novamente.'},{status:503,headers:{'Cache-Control':'no-store'}});}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function rateLimit(r:Request,scope:string){const ip=r.headers.get('x-real-ip')||'local';const db=requireDb();const key=scope+':'+ip;const now=Date.now();const row=await db.prepare('INSERT INTO auth_limits(key,attempts,window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_limits.window_start<=? THEN 1 ELSE auth_limits.attempts+1 END,window_start=CASE WHEN auth_limits.window_start<=? THEN excluded.window_start ELSE auth_limits.window_start END RETURNING attempts').get(key,now,now-900000,now-900000) as any;await db.prepare('DELETE FROM auth_limits WHERE window_start<?').run(now-86400000);if(row.attempts>30)throw new HttpError(429,'Muitas tentativas. Aguarde 15 minutos e tente novamente.');}
import { rawDatabase as requireDb } from './database';
