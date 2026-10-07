import { currentMember,errorResponse,json } from '@/lib/server';
export const runtime='nodejs';
export async function GET(){try{const m=await currentMember();return json({member:{email:m.email,name:m.name,role:m.role,primary:!!m.primary_admin}})}catch(e){return errorResponse(e)}}
