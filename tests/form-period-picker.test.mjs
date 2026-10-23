import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
test('Formulário oferece semanas e mês inteiro sem perder calendários personalizados',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  for(const [name,path] of [['month-picker','components/month-picker.tsx'],['form-period-picker','components/form-period-picker.tsx'],['weeks','lib/weeks.ts'],['coverage','lib/coverage.ts']]){
   let js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
   js=js.replaceAll("'./month-picker'","'./month-picker.mjs'").replaceAll("'@/lib/weeks'","'./weeks.mjs'").replaceAll("'@/lib/coverage'","'./coverage.mjs'").replaceAll("'./coverage'","'./coverage.mjs'");
   writeFileSync(join(dir,name+'.mjs'),js);
  }
  const {default:Picker}=await import('file://'+join(dir,'form-period-picker.mjs'));
  const props={month:'2026-10',start:'2026-10-05',end:'2026-10-11',onMonthChange:()=>{},onBlur:()=>{},onPeriodChange:()=>{},required:true};
  const html=renderToStaticMarkup(createElement(Picker,props));
  assert.equal((html.match(/<select /g)||[]).length,3);
  assert.match(html,/<option value="2" selected="">Semana 2/);
  assert.ok(html.includes('Mês inteiro'));
  assert.ok(html.includes('28/09/2026 a 04/10/2026'));
  const manual=renderToStaticMarkup(createElement(Picker,{...props,end:'2026-10-10'}));
  assert.match(manual,/<option value="manual" disabled="" selected="">/);
  const all=renderToStaticMarkup(createElement(Picker,{...props,start:'2026-10-01',end:'2026-10-31'}));
  assert.match(all,/<option value="all" selected="">Mês inteiro/);
  const empty=renderToStaticMarkup(createElement(Picker,{...props,month:'',start:'',end:''}));
  assert.match(empty,/aria-label="Semana do cadastro" disabled=""/);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
