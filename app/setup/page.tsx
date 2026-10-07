import AuthForm from '../auth-form';
import { rawDatabase } from '@/lib/database';
import { redirect } from 'next/navigation';
import { withBase } from '@/lib/paths';
export const dynamic='force-dynamic';
export default function Setup(){if(rawDatabase().prepare('SELECT 1 FROM members LIMIT 1').get())redirect(withBase('/login'));return <AuthForm mode="setup"/>}
