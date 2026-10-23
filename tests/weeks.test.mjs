import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import ts from 'typescript';
test('Semanas segunda–domingo, mês inteiro e dias efetivamente trabalhados',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  for(const name of ['coverage','weeks']){
   const js=ts.transpileModule(readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll("'./coverage'","'./coverage.mjs'");
   writeFileSync(join(dir,name+'.mjs'),js);
  }
  const {monthWeeks,recordInWeek,monthPeriod,periodChoice}=await import('file://'+join(dir,'weeks.mjs'));
  assert.equal(monthWeeks('2021-02').length,4);
  assert.equal(monthWeeks('2026-10').length,5);
  assert.equal(monthWeeks('2026-08').length,6);
  assert.deepEqual(monthWeeks('2026-10')[0],{id:'1',start:'2026-09-28',end:'2026-10-04'});
  assert.equal(monthWeeks('2026-12').at(-1).end,'2027-01-03');
  assert.deepEqual(monthWeeks('invalid'),[]);
  assert.deepEqual(monthPeriod('2026-10','all'),{start:'2026-10-01',end:'2026-10-31'});
  assert.deepEqual(monthPeriod('2024-02','all'),{start:'2024-02-01',end:'2024-02-29'});
  assert.deepEqual(monthPeriod('2026-10','1'),{start:'2026-09-28',end:'2026-10-04'});
  assert.deepEqual(monthPeriod('2026-12','5'),{start:'2026-12-28',end:'2027-01-03'});
  assert.equal(monthPeriod('','1'),null);
  assert.equal(monthPeriod('2021-02','5'),null);
  assert.equal(periodChoice('2026-10','2026-10-01','2026-10-31'),'all');
  assert.equal(periodChoice('2026-10','2026-10-05','2026-10-11'),'2');
  assert.equal(periodChoice('2026-10','2026-10-05','2026-10-10'),'manual');
  assert.equal(periodChoice('','',''),'manual');
  const r={start:'2026-10-01',end:'2026-10-14',weekdays:[0,2],workedDates:['2026-10-05','2026-10-14']};
  const weeks=monthWeeks('2026-10');
  assert.equal(recordInWeek(r),true);
  assert.equal(recordInWeek(r,weeks[0]),false);
  assert.equal(recordInWeek(r,weeks[1]),true);
  assert.equal(recordInWeek(r,weeks[2]),true);
  assert.equal(recordInWeek({...r,workedDates:['2026-10-05']},weeks[2]),false);
  assert.equal(recordInWeek({...r,workedDates:undefined},weeks[2]),true);
  assert.equal(recordInWeek({...r,workedDates:undefined,end:'2026-10-06',weekdays:[2]},weeks[1]),false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
