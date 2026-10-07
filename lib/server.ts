import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function database(){if(!env.DB)throw new HttpError(503,'O serviço de registros está indisponível. Tente novamente em instantes.');return env.DB;}
export function sameOrigin(r:Request){const origin=r.headers.get('origin');if(origin&&origin!==new URL(r.url).origin)throw new HttpError(403,'Origem não autorizada');}
export async function currentMember(){const u=await getChatGPTUser();if(!u)throw new HttpError(401,'Entre com sua conta para continuar.');const db=database();const email=u.email.toLowerCase();const m=await db.prepare('SELECT * FROM members WHERE email = ?').bind(email).first<any>();if(!m)throw new HttpError(403,'Seu acesso ainda não foi liberado. Solicite o cadastro ao responsável.');if(m.user_id&&m.user_id!==u.userId)throw new HttpError(403,'Conta não autorizada.');if(!m.user_id)await db.prepare('UPDATE members SET user_id = ? WHERE email = ? AND user_id IS NULL').bind(u.userId,email).run();return {...m,userId:u.userId};}
export async function admin(){const m=await currentMember();if(m.role!=='admin')throw new HttpError(403,'Acesso exclusivo do administrativo.');return m;}
export function errorResponse(e:unknown){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});console.error('Coverage request failed',e);return Response.json({error:'Não foi possível concluir. Seus dados no formulário foram mantidos; tente novamente.'},{status:503,headers:{'Cache-Control':'no-store'}});}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
