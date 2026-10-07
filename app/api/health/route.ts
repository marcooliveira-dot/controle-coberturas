import { rawDatabase } from '@/lib/database';
export const dynamic='force-dynamic';
export async function GET(){try{rawDatabase().prepare('SELECT 1 FROM members LIMIT 1').get();return Response.json({status:'ok'},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({status:'unavailable'},{status:503})}}
