import React,{useEffect,useState} from 'react';
import { createRoot } from 'react-dom/client';
import Workspace from '../app/workspace';
import AuthForm from '../app/auth-form';
import { currentReportMonth } from '../lib/dashboard';
import '../app/globals.css';
type Member={email:string,name:string,role:'admin'|'supervisor',primary:boolean};
function Application(){const [member,setMember]=useState<Member|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');const route=window.location.pathname.replace(/\/$/,'')||'/';
 useEffect(()=>{let active=true;fetch('/api/session',{cache:'no-store'}).then(async r=>{const d=await r.json();if(r.status===401||r.status===403){if(active){setMember(null);setLoading(false)}return}if(!r.ok)throw Error(d.error||'Não foi possível consultar seu acesso.');if(active){setMember(d.member);setLoading(false);if(route==='/login'||route==='/setup')window.location.replace('/')}}).catch(e=>{if(active){setError(e.message);setLoading(false)}});return()=>{active=false}},[]);
 if(route==='/ativar')return <AuthForm mode="activate"/>;
 if(route==='/setup'&&!member)return <AuthForm mode="setup"/>;
 if(loading)return <main><section className="panel" role="status">Verificando seu acesso…</section></main>;
 if(error)return <main><section className="panel"><h1>Não foi possível conectar</h1><p role="alert">{error}</p><button className="secondary mt-5" onClick={()=>window.location.reload()}>Tentar novamente</button></section></main>;
 if(!member)return <AuthForm mode="login"/>;
 return <Workspace signedIn email={member.email} initialMember={member} initialMonth={currentReportMonth()}/>;
}
createRoot(document.getElementById('root')!).render(<Application/>);
