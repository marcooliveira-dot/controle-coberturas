import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, types, type PoolClient } from 'pg';
import path from 'node:path';
const cache=globalThis as typeof globalThis & {coverageSqlite?:DatabaseSync,coveragePool?:Pool};
const context=new AsyncLocalStorage<PoolClient|'sqlite'>();
let sqliteTail:Promise<void>=Promise.resolve();
const postgres=()=>!!process.env.DATABASE_URL;
types.setTypeParser(20,value=>{
  const number=Number(value);if(!Number.isSafeInteger(number))throw new Error('Database integer exceeds supported range.');return number;
});
function sqlite(){
  if(!cache.coverageSqlite){cache.coverageSqlite=new DatabaseSync(process.env.DATABASE_PATH||path.resolve('data/coberturas.sqlite'));cache.coverageSqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;')}
  return cache.coverageSqlite;
}
function pool(){return cache.coveragePool??=new Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:10000,idleTimeoutMillis:30000})}
export function postgresSql(sql:string){
  let quote='',n=0,result='';
  for(let i=0;i<sql.length;i++){
    const c=sql[i];
    if(quote){result+=c;if(c===quote){if(sql[i+1]===quote)result+=sql[++i];else quote=''}}
    else if(c==="'"||c==='"'){quote=c;result+=c}
    else result+=c==='?'?'$'+(++n):c;
  }
  return result;
}
async function execute(sql:string,args:SQLInputValue[]=[]){
  if(postgres()){
    const connection=context.getStore();
    const result=await (connection&&connection!=='sqlite'?connection:pool()).query(postgresSql(sql),args);
    return {rows:result.rows,changes:result.rowCount||0};
  }
  if(context.getStore()!=='sqlite')await sqliteTail;
  const statement=sqlite().prepare(sql);
  // RETURNING is used for atomic rate limiting in both database engines.
  if(/^\s*(SELECT|WITH|PRAGMA)\b/i.test(sql)||/\bRETURNING\b/i.test(sql))return {rows:statement.all(...args),changes:0};
  return {rows:[],changes:Number(statement.run(...args).changes)};
}
class Statement{
  constructor(private sql:string,private args:SQLInputValue[]=[]){ }
  bind(...args:SQLInputValue[]){return new Statement(this.sql,args)}
  async get(...args:SQLInputValue[]){return (await execute(this.sql,args.length?args:this.args)).rows[0]}
  async first<T=Record<string,unknown>>(){return ((await this.get()) as T|undefined)||null}
  async all<T=Record<string,unknown>>(...args:SQLInputValue[]){return (await execute(this.sql,args.length?args:this.args)).rows as T[]}
  async run(...args:SQLInputValue[]){const r=await execute(this.sql,args.length?args:this.args);return {changes:r.changes,success:true,meta:{changes:r.changes}}}
}
export const rawDatabase=()=>({prepare:(sql:string)=>new Statement(sql)});
// Preserve the existing D1-shaped all() response used by coverage routes.
export const database=()=>({prepare:(sql:string)=>({bind:(...args:SQLInputValue[])=>({all:async<T=Record<string,unknown>>()=>({results:await new Statement(sql,args).all<T>()}),run:()=>new Statement(sql,args).run()})})});
export async function transaction<T>(work:()=>Promise<T>):Promise<T>{
  if(context.getStore())return work();
  if(postgres()){
    const connection=await pool().connect();
    try{
      await connection.query('BEGIN');
      // Serialize short application decisions (bootstrap, invitations and finance).
      await connection.query('SELECT pg_advisory_xact_lock(260910)');
      const result=await context.run(connection,work);await connection.query('COMMIT');return result;
    }catch(e){await connection.query('ROLLBACK');throw e}finally{connection.release()}
  }
  const previous=sqliteTail;let release!:()=>void;sqliteTail=new Promise<void>(resolve=>{release=resolve});await previous;
  try{sqlite().exec('BEGIN IMMEDIATE');const result=await context.run('sqlite',work);sqlite().exec('COMMIT');return result}
  catch(e){sqlite().exec('ROLLBACK');throw e}finally{release()}
}
