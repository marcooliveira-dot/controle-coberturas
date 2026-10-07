import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn,execFileSync } from 'node:child_process';
import { mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import ExcelJS from 'exceljs';

test('Self-hosted authentication, authorization, persistence and exports',async t=>{
 const temp=mkdtempSync(join(tmpdir(),'coverage-test-'));const dbPath=join(temp,'db.sqlite');const setupToken=randomBytes(32).toString('hex');const port=process.env.TEST_PORT||'3419';const origin='http://127.0.0.1:'+port;const base=process.env.NEXT_PUBLIC_BASE_PATH||'/coberturas';const env={...process.env,NODE_ENV:'production',HOSTNAME:'127.0.0.1',PORT:port,APP_ORIGIN:origin,DATABASE_PATH:dbPath,SETUP_TOKEN:setupToken,ADMIN_EMAIL:'admin@example.invalid',COOKIE_SECURE:'true',BACKUP_DIR:join(temp,'backups')};
 execFileSync(process.execPath,['scripts/migrate.mjs'],{env,stdio:'pipe'});
 execFileSync(process.execPath,['scripts/migrate.mjs'],{env,stdio:'pipe'});
 const server=spawn(process.execPath,['.next/standalone/server.js'],{env,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
 const delay=ms=>new Promise(r=>setTimeout(r,ms));
 const request=async(path,{cookie='',method='GET',body,headers={}}={})=>{const r=await fetch(origin+base+path,{method,redirect:'manual',headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={text}}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0],setCookie:r.headers.get('set-cookie'),location:r.headers.get('location')}};
 try{
 let ready=false;for(let i=0;i<100;i++){try{const r=await request('/api/health');if(r.status===200){ready=true;break}}catch{}if(server.exitCode!==null)break;await delay(100)}assert.ok(ready,logs);
 const adminBody={token:setupToken,name:'Responsável QA',email:'admin@example.invalid',password:'Senha de teste 123!'};
 let adminCookie,superCookie,otherCookie;
 await t.test('Bootstrap token, secure session, anonymous and forged-header rejection',async()=>{
  const invalid=await request('/api/auth/setup',{method:'POST',body:{...adminBody,token:'0'.repeat(64)}});assert.equal(invalid.status,403);
  const initialized=await request('/api/auth/setup',{method:'POST',body:adminBody});assert.equal(initialized.status,200);adminCookie=initialized.cookie;assert.match(initialized.setCookie,/HttpOnly/);assert.match(initialized.setCookie,/Secure/);assert.match(initialized.setCookie,/SameSite=strict/i);assert.match(adminCookie,/__Host-coberturas_session/);
  assert.equal((await request('/api/auth/setup',{method:'POST',body:adminBody})).status,409);
  assert.equal((await request('/api/coverages')).status,401);
  assert.equal((await request('/api/session',{headers:{'oai-authenticated-user-id':'fake','oai-authenticated-user-email':'admin@example.invalid'}})).status,401);
  assert.equal((await request('/api/members',{method:'POST',cookie:adminCookie,headers:{Origin:'https://hostile.invalid'},body:{name:'QA',email:'qa@example.invalid',role:'supervisor'}})).status,403);
 });
 const invite=async(name,email)=>{const r=await request('/api/members',{method:'POST',cookie:adminCookie,body:{name,email,role:'supervisor'}});assert.equal(r.status,201);return new URL(r.data.inviteUrl).hash.slice(1)};
 const activate=async token=>request('/api/auth/activate',{method:'POST',body:{token,password:'Supervisor teste 123!'}});
 const payload={name:'Prestador QA',cpf:'01234567890',operation:'Loja QA',start:'2026-10-01',end:'2026-10-07',month:'2026-10',weekdays:[0,2],justification:'Teste de férias',details:'',pix:'=PIX literal',thirdParty:'',dailyCents:12550,days:2};let cpf='012345678';for(let n=9;n<11;n++){let sum=0;for(let i=0;i<n;i++)sum+=Number(cpf[i])*(n+1-i);const d=(sum*10)%11;cpf+=d===10?'0':String(d)}payload.cpf=cpf;
 let recordId;
 await t.test('Invitations are one-use; supervisor scope and totals are enforced by server',async()=>{
  const token=await invite('Supervisor QA','supervisor@example.invalid');const activated=await activate(token);assert.equal(activated.status,200);superCookie=activated.cookie;assert.equal((await activate(token)).status,403);
  const other=await activate(await invite('Outro QA','other@example.invalid'));assert.equal(other.status,200);otherCookie=other.cookie;
  const first=await request('/api/coverages',{method:'POST',cookie:superCookie,body:payload});assert.equal(first.status,201);recordId=first.data.id;
  assert.equal((await request('/api/coverages',{method:'POST',cookie:otherCookie,body:{...payload,name:'Outro prestador QA'}})).status,201);
  assert.equal((await request('/api/coverages',{method:'POST',cookie:superCookie,body:{...payload,totalCents:1}})).status,400);
  assert.equal((await request('/api/coverages',{method:'POST',cookie:superCookie,body:{...payload,cpf:'11111111111'}})).status,400);
  const mine=await request('/api/coverages',{cookie:superCookie});assert.equal(mine.data.records.length,1);assert.equal(mine.data.records[0].id,recordId);assert.equal(mine.data.records[0].totalCents,25100);
  assert.equal((await request('/api/members',{cookie:superCookie})).status,403);assert.equal((await request('/api/members',{cookie:adminCookie})).status,200);assert.equal((await request('/api/coverages',{cookie:adminCookie})).data.records.length,2);
 });
 await t.test('Revocation immediately invalidates sessions; re-invitation preserves record ownership',async()=>{
  assert.equal((await request('/api/members?email=supervisor%40example.invalid',{method:'DELETE',cookie:adminCookie})).status,200);
  assert.equal((await request('/api/coverages',{cookie:superCookie})).status,401);
  const renewed=await activate(await invite('Supervisor QA','supervisor@example.invalid'));assert.equal(renewed.status,200);superCookie=renewed.cookie;
  const mine=await request('/api/coverages',{cookie:superCookie});assert.equal(mine.data.records.length,1);assert.equal(mine.data.records[0].id,recordId);
  assert.equal((await request('/api/members?email=admin%40example.invalid',{method:'DELETE',cookie:adminCookie})).status,400);
 });
 await t.test('Password login, lockout and logout',async()=>{
  const credentials={email:'supervisor@example.invalid',password:'Supervisor teste 123!'};let login=await request('/api/auth/login',{method:'POST',body:credentials});assert.equal(login.status,200);superCookie=login.cookie;
  for(let i=0;i<5;i++)assert.equal((await request('/api/auth/login',{method:'POST',body:{...credentials,password:'bad'}})).status,401);
  assert.equal((await request('/api/auth/login',{method:'POST',body:credentials})).status,401);
  const db=new DatabaseSync(dbPath);db.prepare('UPDATE members SET locked_until=0 WHERE email=?').run(credentials.email);db.close();login=await request('/api/auth/login',{method:'POST',body:credentials});assert.equal(login.status,200);superCookie=login.cookie;
  assert.equal((await request('/api/auth/logout',{method:'POST',cookie:superCookie,body:{}})).status,200);assert.equal((await request('/api/session',{cookie:superCookie})).status,401);
 });
 await t.test('Consistent backup and original-layout Excel export',async()=>{
  execFileSync(process.execPath,['scripts/backup.mjs'],{env,stdio:'pipe'});const date=new Date().toISOString().slice(0,10);const backupDb=new DatabaseSync(join(env.BACKUP_DIR,'coberturas-'+date+'.sqlite'));assert.equal(backupDb.prepare('SELECT count(*) AS n FROM coverages').get().n,2);backupDb.close();
  const compiled=mkdtempSync(resolve('tests/.qa-'));try{for(const name of ['coverage','paths','export']){let js=ts.transpileModule(readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;js=js.replaceAll("'./coverage'","'./coverage.js'").replaceAll("'./paths'","'./paths.js'");writeFileSync(join(compiled,name+'.js'),js)}const {buildExcel}=await import('file://'+join(compiled,'export.js'));const rows=(await request('/api/coverages',{cookie:adminCookie})).data.records;const template=readFileSync('public/modelo.xlsx');const out=await buildExcel(rows,template.buffer.slice(template.byteOffset,template.byteOffset+template.byteLength));const wb=new ExcelJS.Workbook();await wb.xlsx.load(out);assert.equal(wb.worksheets.length,2);for(const s of wb.worksheets){assert.equal(s.getCell('C3').value,cpf);assert.equal(s.getCell('O3').value,'=PIX literal');assert.equal(s.getCell('S3').result,251);assert.equal(s.getCell('A1').isMerged,true);assert.equal(s.getCell('S2').value,'VALOR TOTAL');}}finally{rmSync(compiled,{recursive:true,force:true})}
 });
 }finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));rmSync(temp,{recursive:true,force:true})}
});
