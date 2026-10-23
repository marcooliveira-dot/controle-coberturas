import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import ts from 'typescript';
test('Datas trabalhadas e dobra: contagem, limites e compatibilidade',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  writeFileSync(join(dir,'coverage.mjs'),ts.transpileModule(readFileSync('lib/coverage.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {coverageSchema,datesByWeekday}=await import('file://'+join(dir,'coverage.mjs'));
  const b={name:'Colaborador Teste',cpf:'52998224725',operation:'Loja',start:'2026-10-05',end:'2026-10-06',month:'2026-10',weekdays:[0,1],justification:'Cobertura',details:'',pix:'chave',thirdParty:'',dailyCents:10000,days:3,workedDates:['2026-10-05','2026-10-06'],doubledDates:['2026-10-05']};
  assert.equal(coverageSchema.safeParse(b).success,true);
  assert.equal(coverageSchema.safeParse({...b,days:2}).success,false);
  assert.equal(coverageSchema.safeParse({...b,doubledDates:['2026-10-07']}).success,false);
  assert.equal(coverageSchema.safeParse({...b,workedDates:['2026-10-05','2026-10-05']}).success,false);
  assert.equal(coverageSchema.safeParse({...b,doubledDates:['2026-10-05','2026-10-05']}).success,false);
  assert.equal(coverageSchema.safeParse({...b,workedDates:['2026-10-05'],days:2}).success,true);
  assert.equal(coverageSchema.safeParse({...b,workedDates:undefined,doubledDates:undefined,days:2}).success,true);
  const all=datesByWeekday('2026-01-01','2026-12-31').flat();
  assert.equal(coverageSchema.safeParse({...b,start:'2026-01-01',end:'2026-12-31',weekdays:[0,1,2,3,4,5,6],workedDates:all,doubledDates:all,days:730}).success,true);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
