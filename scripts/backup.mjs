import { DatabaseSync,backup } from 'node:sqlite';
import { mkdirSync,readdirSync,unlinkSync,statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
process.umask(0o077);
const directory=process.env.BACKUP_DIR||'/var/backups/controle-coberturas';mkdirSync(directory,{recursive:true});
const prefix=join(directory,'coberturas-'+new Date().toISOString().slice(0,10));
if(process.env.DATABASE_URL){
 const url=new URL(process.env.DATABASE_URL),target=prefix+'.dump';
 const env={...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:decodeURIComponent(url.pathname.slice(1)),PGSSLMODE:url.searchParams.get('sslmode')||'prefer'};
 execFileSync('pg_dump',['--format=custom','--file',target],{env,stdio:['ignore','ignore','pipe']});
 execFileSync('pg_restore',['--list',target],{stdio:'ignore'});
}else{
 const db=new DatabaseSync(process.env.DATABASE_PATH||'/var/lib/controle-coberturas/coberturas.sqlite');await backup(db,prefix+'.sqlite');db.close();
}
for(const name of readdirSync(directory).filter(n=>/^coberturas-\d{4}-\d{2}-\d{2}\.(sqlite|dump)$/.test(n))){const file=join(directory,name);if(statSync(file).mtimeMs<Date.now()-30*86400000)unlinkSync(file)}console.log('Database backup completed.');
