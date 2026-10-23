import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';import {join,resolve} from 'node:path';import ts from 'typescript';
test('Visão executiva: bases FA, mês, lançamentos, pagos, recusados e supervisores',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));try{
 for(const name of ['executive','coverage']){let js=ts.transpileModule(readFileSync('lib/'+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll("'./coverage'","'./coverage.mjs'");writeFileSync(join(dir,name+'.mjs'),js)}
 const {executiveSummary,storeIdentity}=await import('file://'+join(dir,'executive.mjs'));
 const row={personKey:'12345678901',id:'1',name:'Ana',operation:'FA Cambuí',ownerId:'super-a',ownerName:'Supervisor A',month:'2026-10',start:'2026-10-01',end:'2026-10-02',days:2,dailyCents:10000,totalCents:20000,serviceType:'cobertura',status:'paid',paidOn:'2026-10-05',justification:'Férias',details:'',receipts:1};
 const data=executiveSummary([row,{...row,id:'2',serviceType:'apoio_operacional',status:'approved',totalCents:15000},{...row,id:'3',status:'rejected',totalCents:99000},{...row,id:'4',operation:'IFC Embu',totalCents:500000},{...row,id:'5',month:'2026-09',totalCents:10000},{...row,id:'6',operation:'FRANGO ASSADO CAMBUI',status:'pending',ownerId:'super-b',ownerName:'Supervisor B',totalCents:5000}], '2026-10');
 assert.equal(data.stores.length,14);const store=data.stores.find(s=>s.id==='fa-cambui');assert.equal(store.coverageCents,25000);assert.equal(store.people,1);assert.equal(JSON.stringify(data).includes('12345678901'),false);assert.equal(JSON.stringify(data).includes('personKey'),false);assert.equal(store.extraCents,15000);assert.equal(store.paidCents,20000);assert.equal(store.pendingCents,20000);assert.equal(store.rejectedCents,99000);assert.equal(store.count,4);assert.equal(store.days,6);assert.equal(store.supervisors.length,2);assert.equal(store.trend.find(t=>t.month==='2026-09').coverageCents,10000);assert.equal(data.totals.coverageCents,25000);assert.equal(data.totals.activeStores,1);assert.equal(data.stores.find(s=>s.name==='Atibaia').count,0);
 assert.equal(storeIdentity('FA Mogi-Guaçu').id,storeIdentity('Frango Assado Mogi Guaçu').id);assert.equal(storeIdentity('RA VCP'),null);
 assert.equal(executiveSummary([row], '2026-11').totals.count,0);assert.equal(executiveSummary([row,{...row,month:'2026-09'}],'').totals.coverageCents,40000);
 const dynamic=executiveSummary([{...row,operation:'FA Nova Unidade'}],'2026-10');assert.equal(dynamic.stores.length,15);assert.ok(dynamic.stores.some(s=>s.name==='Nova Unidade'));
 }finally{rmSync(dir,{recursive:true,force:true})}
});
