// Run only after stopping writes to the source application and taking a backup.
// The target must be empty. No credentials or personal records are printed.
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
if(!process.env.DATABASE_URL||process.env.CONFIRM_SQLITE_IMPORT!=='yes')throw Error('Set DATABASE_URL and CONFIRM_SQLITE_IMPORT=yes.');
pg.types.setTypeParser(20,value=>Number(value));
const source=new DatabaseSync(process.env.DATABASE_PATH||resolve('data/coberturas.sqlite'),{readOnly:true});
const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();
const tables=['members','sessions','invitations','auth_limits','dashboard_settings','coverages','coverage_finance','finance_events','finance_attachments'];
function checksum(rows,columns){
 const encoded=rows.map(row=>JSON.stringify(columns.map(column=>ArrayBuffer.isView(row[column])?{binary:Buffer.from(row[column]).toString('hex')}:row[column]))).sort();
 return createHash('sha256').update(JSON.stringify(encoded)).digest('hex');
}
try{
 await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(260910)');
 for(const table of tables){
  if(Number((await client.query(`SELECT count(*) AS n FROM "${table}"`)).rows[0].n)!==0)throw Error('Target must be empty: '+table);
 }
 for(const table of tables){
  if(!source.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table))continue;
  const columns=source.prepare(`PRAGMA table_info("${table}")`).all().map(c=>c.name);
  const quoted=columns.map(c=>'"'+c.replaceAll('"','""')+'"').join(',');
  const rows=source.prepare(`SELECT * FROM "${table}"`).all();
  for(const row of rows)await client.query(`INSERT INTO "${table}"(${quoted}) VALUES(${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(c=>row[c]));
  const imported=(await client.query(`SELECT ${quoted} FROM "${table}"`)).rows;
  if(checksum(rows,columns)!==checksum(imported,columns))throw Error('Verification failed: '+table);
  console.log(`Verified ${table}: ${rows.length} rows, checksum matches.`);
 }
 await client.query('COMMIT');console.log('Import verified and committed. Original SQLite was not modified.');
}catch(e){await client.query('ROLLBACK');throw e}finally{source.close();await client.end()}
