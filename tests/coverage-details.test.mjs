import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
test('Detalhes preservam os dados e mostram somente as datas trabalhadas e dobras',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  for(const [name,path] of [['coverage','lib/coverage.ts'],['details','components/coverage-details.tsx']]){
   const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText.replaceAll("'@/lib/coverage'","'./coverage.mjs'");
   writeFileSync(join(dir,name+'.mjs'),js);
  }
  const {default:Details}=await import('file://'+join(dir,'details.mjs'));
  const r={serviceType:'cobertura',operation:'Base teste',cpf:'52998224725',start:'2026-10-05',end:'2026-10-18',weekdays:[0],workedDates:['2026-10-05'],doubledDates:['2026-10-05'],days:2,dailyCents:10000,totalCents:20000,pix:'PIX teste',justification:'Motivo',details:'',ownerName:'Supervisor',createdAt:'2026-10-05T12:00:00Z'};
  const html=renderToStaticMarkup(createElement(Details,{record:r}));
  assert.ok(html.includes('05/10/2026 (dobra)'));
  assert.ok(!html.includes('12/10/2026'));
  assert.ok(html.includes('Base teste'));
  assert.ok(html.includes('<dt>Diárias</dt><dd>2</dd>'));
  assert.ok(html.includes('<dt>Total</dt>'));
 }finally{rmSync(dir,{recursive:true,force:true})}
});
