import { closeSession } from '@/lib/auth';
import { sameOrigin,errorResponse,json } from '@/lib/server';
export async function POST(r:Request){try{sameOrigin(r);await closeSession();return json({ok:true})}catch(e){return errorResponse(e)}}
