import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { resolve,join } from 'node:path';
import ts from 'typescript';
test('Monthly rankings, store normalization and supervisor budget boundaries',async()=>{
 const directory=mkdtempSync(resolve('tests/.qa-'));try{const compiled=ts.transpileModule(readFileSync('lib/dashboard.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;writeFileSync(join(directory,'dashboard.mjs'),compiled);const {summarize,budgetStatus}=await import('file://'+join(directory,'dashboard.mjs'));
 const make=(ownerId,operation,serviceType,totalCents,month='2026-10')=>({ownerId,ownerName:ownerId,ownerEmail:ownerId+'@example.invalid',operation,serviceType,totalCents,month});
 const rows=[make('Ana',' Loja A ','cobertura',100000),make('Ana','loja a','apoio_operacional',200000),make('Bia','Loja B','cobertura',120000),make('Bia','Loja B','cobertura',90000),make('Ana','Loja A','cobertura',999999,'2026-09')];const report=summarize(rows,'2026-10');assert.equal(report.totals.coverageCount,3);assert.equal(report.totals.supportCount,1);assert.equal(report.totals.totalCents,510000);assert.equal(report.stores.length,2);const ana=report.supervisors.find(s=>s.id==='Ana');assert.equal(ana.totalCents,300000);assert.equal(ana.stores.length,1);assert.equal(ana.stores[0].coverageCount,1);assert.equal(ana.stores[0].supportCount,1);assert.equal(summarize(rows,'2027-01').totals.totalCents,0);
 assert.equal(budgetStatus(399999,500000).tone,'normal');assert.equal(budgetStatus(400000,500000).tone,'warning');assert.equal(budgetStatus(500000,500000).label,'Limite atingido');assert.equal(budgetStatus(500001,500000).tone,'danger');assert.equal(budgetStatus(1,0).tone,'unset');
 }finally{rmSync(directory,{recursive:true,force:true})}
});
