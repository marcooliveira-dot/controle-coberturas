import AuthForm from '../auth-form';
import { rawDatabase } from '@/lib/database';
import { redirect } from 'next/navigation';
export const dynamic='force-dynamic';
export default function Setup(){if(rawDatabase().prepare('SELECT 1 FROM members LIMIT 1').get())redirect('/login');return <AuthForm mode="setup"/>}
