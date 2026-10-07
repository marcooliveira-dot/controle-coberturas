import { DatabaseSync } from 'node:sqlite';
import { mkdirSync,readFileSync,readdirSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const file=process.env.DATABASE_PATH||resolve('data/coberturas.sqlite');mkdirSync(dirname(file),{recursive:true});
const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS _migrations(name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL);');
const directory=resolve(dirname(fileURLToPath(import.meta.url)),'../drizzle');
for(const name of readdirSync(directory).filter(n=>n.endsWith('.sql')).sort()){const sql=readFileSync(resolve(directory,name),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');const old=db.prepare('SELECT checksum FROM _migrations WHERE name=?').get(name);if(old){if(old.checksum!==checksum)throw Error('Applied migration changed: '+name);continue}db.exec('BEGIN IMMEDIATE');try{db.exec(sql);db.prepare('INSERT INTO _migrations VALUES(?,?,?)').run(name,checksum,new Date().toISOString());db.exec('COMMIT');console.log('Applied migration',name);}catch(e){db.exec('ROLLBACK');throw e}}
db.exec('PRAGMA optimize');db.close();console.log('Database migrations ready.');
