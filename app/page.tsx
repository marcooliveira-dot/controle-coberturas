import Workspace from './workspace';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { currentReportMonth } from '@/lib/dashboard';
export const dynamic = 'force-dynamic';
export default async function Home(){const user=await getUser();if(!user)redirect('/login');return <Workspace signedIn email={user.email} initialMember={{email:user.email,name:user.displayName,role:user.role,primary:user.primary}} initialMonth={currentReportMonth()}/>;}
