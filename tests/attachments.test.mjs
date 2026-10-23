import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import ts from 'typescript';
test('Assinaturas dos anexos permitidos',async()=>{
 const dir=mkdtempSync(resolve('tests/.qa-'));
 try{
  writeFileSync(join(dir,'attachments.mjs'),ts.transpileModule(readFileSync('lib/attachments.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText);
  const {attachmentType,attachmentLimit}=await import('file://'+join(dir,'attachments.mjs'));
  assert.equal(attachmentLimit,5242880);
  assert.equal(attachmentType(Buffer.from('%PDF-1.4')),'application/pdf');
  assert.equal(attachmentType(Uint8Array.from([137,80,78,71,13,10,26,10])),'image/png');
  assert.equal(attachmentType(Uint8Array.from([255,216,255,224])),'image/jpeg');
  assert.equal(attachmentType(Buffer.from('<html>não é PDF</html>')),null);
  assert.equal(attachmentType(new Uint8Array()),null);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
