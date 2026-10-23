import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import ts from 'typescript';
test('Tabela de coberturas, Aerovip e valor personalizado',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  writeFileSync(join(dir,'coverage.mjs'),ts.transpileModule(readFileSync('lib/coverage.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {coverageSchema,coverageRates}=await import('file://'+join(dir,'coverage.mjs'));
  const b={name:'Colaborador Teste',cpf:'52998224725',operation:'Aerovip',start:'2026-10-05',end:'2026-10-05',month:'2026-10',weekdays:[0],justification:'Cobertura',details:'',pix:'chave',thirdParty:'',dailyCents:10000,days:1};
  assert.equal(new Set(coverageRates.map(r=>r.id)).size,coverageRates.length);
  assert.deepEqual(coverageRates.filter(r=>r.name==='Aerovip').map(r=>r.dailyCents),[10000,12000]);
  for(const rate of coverageRates)assert.equal(coverageSchema.safeParse({...b,operation:rate.name,dailyCents:rate.dailyCents}).success,true,rate.id);
  assert.equal(coverageSchema.safeParse({...b,dailyCents:11000}).success,false);
  assert.equal(coverageSchema.safeParse({...b,operation:'Infracommerce Extrema',dailyCents:24686}).success,true);
  assert.equal(coverageSchema.safeParse({...b,operation:'Loja personalizada',dailyCents:9876}).success,true);
  assert.equal(coverageSchema.safeParse({...b,operation:'Loja personalizada',dailyCents:0}).success,false);
  assert.equal(coverageSchema.safeParse({...b,serviceType:'apoio_operacional',dailyCents:11000}).success,true);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
