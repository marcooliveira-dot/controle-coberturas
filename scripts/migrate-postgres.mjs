import pg from 'pg';
import { readFileSync,readdirSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try{
 await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(260910)');
 await client.query('CREATE TABLE IF NOT EXISTS _migrations(name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)');
 const dir=resolve(dirname(fileURLToPath(import.meta.url)),'../postgres');
 for(const name of readdirSync(dir).filter(n=>!n.startsWith('.')&&n.endsWith('.sql')).sort()){
  const sql=readFileSync(resolve(dir,name),'utf8'),checksum=createHash('sha256').update(sql).digest('hex');
  const old=(await client.query('SELECT checksum FROM _migrations WHERE name=$1',[name])).rows[0];
  if(old){if(old.checksum!==checksum)throw Error('Applied PostgreSQL migration changed: '+name);continue}
  await client.query(sql);await client.query('INSERT INTO _migrations VALUES($1,$2,$3)',[name,checksum,new Date().toISOString()]);console.log('Applied PostgreSQL migration',name);
 }
 await client.query('COMMIT');console.log('PostgreSQL migrations ready.');
}catch(e){await client.query('ROLLBACK');throw e}finally{await client.end()}
