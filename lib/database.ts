import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import path from 'node:path';
const cache=globalThis as typeof globalThis & {coverageSqlite?:DatabaseSync};
export function rawDatabase(){if(!cache.coverageSqlite){const file=process.env.DATABASE_PATH||path.resolve('data/coberturas.sqlite');cache.coverageSqlite=new DatabaseSync(file);cache.coverageSqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');}return cache.coverageSqlite;}
class Statement{
 constructor(private sql:string,private args:SQLInputValue[]=[]){}
 bind(...args:SQLInputValue[]){return new Statement(this.sql,args)}
 async first<T=Record<string,unknown>>(){return (rawDatabase().prepare(this.sql).get(...this.args) as T|undefined)||null}
 async all<T=Record<string,unknown>>(){return {results:rawDatabase().prepare(this.sql).all(...this.args) as T[]}}
 async run(){const r=rawDatabase().prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}}}
}
export const database=()=>({prepare:(sql:string)=>new Statement(sql)});
