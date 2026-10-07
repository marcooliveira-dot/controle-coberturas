import { DatabaseSync,backup } from 'node:sqlite';
import { mkdirSync,readdirSync,unlinkSync,statSync } from 'node:fs';
import { join } from 'node:path';
const directory=process.env.BACKUP_DIR||'/var/backups/controle-coberturas';mkdirSync(directory,{recursive:true});
const db=new DatabaseSync(process.env.DATABASE_PATH||'/var/lib/controle-coberturas/coberturas.sqlite');
const target=join(directory,'coberturas-'+new Date().toISOString().slice(0,10)+'.sqlite');await backup(db,target);db.close();
for(const name of readdirSync(directory).filter(n=>/^coberturas-\d{4}-\d{2}-\d{2}\.sqlite$/.test(n))){const file=join(directory,name);if(statSync(file).mtimeMs<Date.now()-30*86400000)unlinkSync(file)}console.log('Database backup completed.');
