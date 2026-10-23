import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import ts from 'typescript';
test('Comprovantes: nomes, CPF, homônimos e seleção sem aproximação insegura',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  writeFileSync(join(dir,'matching.mjs'),ts.transpileModule(readFileSync('lib/receipt-matching.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {matchReceipt}=await import('file://'+join(dir,'matching.mjs'));
  const records=[{id:'a',name:'João da Silva',cpf:'12345678901'},{id:'b',name:'João da Silva',cpf:'98765432100'},{id:'c',name:'Maria Santos',cpf:'12312312312'}];
  assert.deepEqual(matchReceipt('Favorecido: JOAO DA\nSILVA','pagamento.pdf',records).map(r=>r.id),['a','b']);
  assert.deepEqual(matchReceipt('CPF: 123.456.789-01','pagamento.pdf',records).map(r=>[r.id,r.reason]),[['a','cpf']]);
  assert.deepEqual(matchReceipt('','',[]).length,0);
  assert.deepEqual(matchReceipt('Maria','pagamento.pdf',records),[]);
  assert.deepEqual(matchReceipt('MARIA SANTOS JUNIOR','pagamento.pdf',[{...records[2],name:'Maria Santos Junior Filho'}]),[]);
  assert.deepEqual(matchReceipt('comprovante ilegível','Maria_Santos.pdf',records).map(r=>[r.id,r.reason]),[['c','filename']]);
  assert.deepEqual(matchReceipt('João da Silva e Maria Santos','pagamento.pdf',records).map(r=>r.id),['a','b','c']);
  assert.deepEqual(matchReceipt('CPF: ***.456.789-**','pagamento.pdf',records),[]);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
