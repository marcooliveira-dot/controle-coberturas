import { z } from 'zod';
import { createSession,hashPassword,tokenHash } from '@/lib/auth';
import { rawDatabase,transaction } from '@/lib/database';
import { sameOrigin,rateLimit,HttpError,errorResponse,json } from '@/lib/server';
export async function POST(r:Request){
  try{
    sameOrigin(r);await rateLimit(r,'activate');
    const p=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(12).max(200)}).strict().safeParse(await r.json());
    if(!p.success)throw new HttpError(400,'A senha deve ter pelo menos 12 caracteres.');
    const db=rawDatabase(),invitation=await db.prepare('SELECT i.email,m.user_id FROM invitations i JOIN members m ON m.email=i.email WHERE i.token_hash=? AND i.expires_at>? AND m.disabled=0').get(tokenHash(p.data.token),Date.now()) as any;
    if(!invitation)throw new HttpError(403,'Convite inválido ou expirado. Solicite um novo link ao administrativo.');
    const hash=await hashPassword(p.data.password);
    await transaction(async()=>{
      const valid=await db.prepare('DELETE FROM invitations WHERE token_hash=? AND expires_at>?').run(tokenHash(p.data.token),Date.now());
      if(!valid.changes)throw new HttpError(403,'Este convite já foi utilizado.');
      await db.prepare('UPDATE members SET password_hash=?,failed_attempts=0,locked_until=0 WHERE email=? AND disabled=0').run(hash,invitation.email);
      await db.prepare('DELETE FROM sessions WHERE user_id=?').run(invitation.user_id);
    });
    await createSession(invitation.user_id);return json({ok:true});
  }catch(e){return errorResponse(e)}
}
