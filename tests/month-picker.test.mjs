import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,rmSync } from 'node:fs';
import { join,resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

test('Mês e ano são seletores independentes, compatíveis com Safari e com o schema',async()=>{
  const dir=mkdtempSync(resolve('tests/.qa-'));
  try{
    for(const [name,file] of [['picker','components/month-picker.tsx'],['coverage','lib/coverage.ts']]){
      const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
      writeFileSync(join(dir,name+'.mjs'),js);
    }
    const {default:MonthPicker}=await import('file://'+join(dir,'picker.mjs'));
    const {coverageSchema}=await import('file://'+join(dir,'coverage.mjs'));
    const schema=coverageSchema._def.schema.shape.month;
    for(let month=1;month<=12;month++){
      const value='2026-'+String(month).padStart(2,'0');assert.equal(schema.parse(value),value);
      const html=renderToStaticMarkup(createElement(MonthPicker,{value,onChange:()=>{},required:true}));
      assert.equal((html.match(/<select /g)||[]).length,2);assert.ok(!html.includes('type="month"'));
      assert.ok(html.includes(`<option value="${String(month).padStart(2,'0')}" selected="">`));
      assert.ok(html.includes('<option value="2026" selected="">2026</option>'));
    }
    const empty=renderToStaticMarkup(createElement(MonthPicker,{value:'',onChange:()=>{},required:true}));
    assert.ok(empty.includes('<option value="" selected="">Selecione o mês</option>'));
    assert.ok(!schema.safeParse('outubro').success);assert.ok(!schema.safeParse('2026-13').success);
    assert.equal(schema.parse(' 2026-10 '),'2026-10');
  }finally{rmSync(dir,{recursive:true,force:true})}
});
