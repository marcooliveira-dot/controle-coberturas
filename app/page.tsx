import Workspace from './workspace';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { withBase } from '@/lib/paths';
export const dynamic = 'force-dynamic';
export default async function Home(){const user=await getUser();if(!user)redirect(withBase('/login'));return <Workspace signedIn email={user.email}/>;}
