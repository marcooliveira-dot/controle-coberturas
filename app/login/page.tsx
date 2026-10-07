import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { withBase } from '@/lib/paths';
import AuthForm from '../auth-form';
export const dynamic='force-dynamic';
export default async function Login(){if(await getUser())redirect(withBase('/'));return <AuthForm mode="login"/>}
