import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { join,resolve } from 'node:path';
import ts from 'typescript';

test('Prazos de lançamento, virada de mês/ano e transições financeiras',async()=>{
  const directory=mkdtempSync(resolve('tests/.qa-'));
  try{
    const js=ts.transpileModule(readFileSync('lib/finance.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
    writeFileSync(join(directory,'finance.mjs'),js);
    const {deadlineFlags,brazilDate,canTransition}=await import('file://'+join(directory,'finance.mjs'));
    const record={start:'2026-09-28',end:'2026-10-04',serviceType:'cobertura',createdAt:'2026-10-05T12:00:00Z'};
    let flags=deadlineFlags(record);assert.equal(flags.spansMonths,true);assert.equal(flags.lateReasons.length,1);
    flags=deadlineFlags({...record,serviceType:'apoio_operacional'});assert.equal(flags.lateReasons.length,2);
    // Domingo ainda pertence à mesma semana; segunda-feira inicia a próxima.
    assert.equal(deadlineFlags({...record,start:'2026-10-01',serviceType:'apoio_operacional',createdAt:'2026-10-05T02:59:59Z'}).lateReasons.length,0);
    assert.equal(deadlineFlags({...record,start:'2026-10-01',serviceType:'apoio_operacional',createdAt:'2026-10-05T03:00:00Z'}).lateReasons.length,1);
    assert.equal(deadlineFlags({...record,start:'2026-10-05',end:'2026-10-11',serviceType:'apoio_operacional'}).lateReasons.length,0);
    assert.equal(deadlineFlags({...record,start:'2026-12-28',end:'2027-01-03',createdAt:'2027-01-04T12:00:00Z'}).lateReasons.length,1);
    assert.equal(deadlineFlags({...record,createdAt:'2026-09-28T12:00:00Z'}).lateReasons.length,0);
    assert.equal(brazilDate(new Date('2026-10-01T02:59:59Z')),'2026-09-30');
    for(const from of ['pending','approved','rejected','paid'])for(const to of ['pending','approved','rejected','paid']){
      const allowed=['pending:approved','pending:rejected','rejected:approved','approved:rejected','approved:paid'];
      assert.equal(canTransition(from,to),allowed.includes(`${from}:${to}`),`${from} -> ${to}`);
    }
  }finally{rmSync(directory,{recursive:true,force:true})}
});
