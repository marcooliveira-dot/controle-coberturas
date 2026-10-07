import { cpSync,mkdirSync,existsSync,readFileSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=resolve('.next/standalone');if(!existsSync(root+'/server.js'))throw Error('Run npm run build first.');
mkdirSync(root+'/.next',{recursive:true});cpSync('.next/static',root+'/.next/static',{recursive:true});cpSync('public',root+'/public',{recursive:true});cpSync('scripts',root+'/scripts',{recursive:true});cpSync('drizzle',root+'/drizzle',{recursive:true});cpSync('deploy',root+'/deploy',{recursive:true});
writeFileSync(root+'/RELEASE.json',JSON.stringify({sourceCommit:process.env.SOURCE_COMMIT||'local-build',basePath:process.env.NEXT_PUBLIC_BASE_PATH||'/coberturas',builtAt:new Date().toISOString()},null,2));
mkdirSync('releases',{recursive:true});execFileSync('tar',['-czf',resolve('releases/controle-coberturas.tar.gz'),'-C',root,'.'],{stdio:'inherit'});console.log('Release package ready.');
