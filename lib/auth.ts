import { cookies } from 'next/headers';
import { randomBytes,createHash,scrypt as scryptCallback,timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { rawDatabase } from './database';
const scrypt=promisify(scryptCallback);
const secure=process.env.COOKIE_SECURE!=='false';
export const sessionCookie=secure?'__Host-coberturas_session':'coberturas_session';
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export type User={userId:string,email:string,displayName:string,role:'admin'|'supervisor',primary:boolean};
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64) as Buffer;return 'scrypt:'+salt+':'+hash.toString('hex')}
export async function verifyPassword(password:string,encoded:string){try{const [algo,salt,value]=encoded.split(':');if(algo!=='scrypt'||!salt||!value)return false;const expected=Buffer.from(value,'hex');const actual=await scrypt(password,salt,64) as Buffer;return expected.length===actual.length&&timingSafeEqual(expected,actual)}catch{return false}}
export async function getUser():Promise<User|null>{const token=(await cookies()).get(sessionCookie)?.value;if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const row=rawDatabase().prepare('SELECT m.* FROM sessions s JOIN members m ON m.user_id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND m.disabled=0').get(tokenHash(token),Date.now()) as any;if(!row)return null;return {userId:row.user_id,email:row.email,displayName:row.name,role:row.role,primary:!!row.primary_admin}}
export async function createSession(userId:string){const db=rawDatabase();const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES (?,?,?)').run(tokenHash(token),userId,Date.now()+7*86400000);(await cookies()).set(sessionCookie,token,{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:7*86400});}
export async function closeSession(){const jar=await cookies();const token=jar.get(sessionCookie)?.value;if(token)rawDatabase().prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token));jar.set(sessionCookie,'',{httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:0});}
export function newInvitation(email:string){const db=rawDatabase();const token=randomBytes(32).toString('hex');db.prepare('DELETE FROM invitations WHERE email=? OR expires_at<=?').run(email,Date.now());db.prepare('INSERT INTO invitations(token_hash,email,expires_at) VALUES (?,?,?)').run(tokenHash(token),email,Date.now()+7*86400000);return token;}
