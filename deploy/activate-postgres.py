#!/usr/bin/env python3
"""Backup, import and atomically activate an uploaded standalone release."""
import argparse,datetime,os,pathlib,shlex,shutil,subprocess,time,json
parser=argparse.ArgumentParser()
parser.add_argument('--release',required=True)
parser.add_argument('--archive',required=True)
args=parser.parse_args()
if os.geteuid()!=0:raise SystemExit('Run as root.')
if not args.release.replace('-','').isalnum():raise SystemExit('Invalid release name.')
current=pathlib.Path('/opt/controle-coberturas/current')
old=current.resolve(strict=True)
release=pathlib.Path('/opt/controle-coberturas/releases')/args.release
if release.exists():raise SystemExit('Release already exists; refusing to overwrite.')
envfile=pathlib.Path('/etc/controle-coberturas.env')
def readenv(path):
    result={}
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith('#') or '=' not in line:continue
        key,value=line.split('=',1);parsed=shlex.split(value,comments=False)
        result[key.strip()]=parsed[0] if parsed else ''
    return result
oldenv=readenv(envfile)
if oldenv.get('DATABASE_URL'):raise SystemExit('Production already uses PostgreSQL; use the normal release procedure.')
newenv={**oldenv,**readenv(pathlib.Path('/etc/controle-coberturas-postgres.env'))}
allowed=set(filter(None,oldenv.get('ALLOWED_ORIGINS','').split(',')))
allowed.update(['https://controle-coberturas.netlify.app','https://bkpmail.dcasgroup.com.br'])
if oldenv.get('APP_ORIGIN'):allowed.add(oldenv['APP_ORIGIN'])
newenv.update(APP_ORIGIN='https://bkpmail.dcasgroup.com.br',PUBLIC_APP_BASE_PATH='/coberturas',ALLOWED_ORIGINS=','.join(sorted(allowed)))
backup=pathlib.Path('/var/backups/controle-coberturas')/('migration-'+args.release)
backup.mkdir(mode=0o700,parents=True,exist_ok=False)
shutil.copy2(envfile,backup/'previous.env');os.chmod(backup/'previous.env',0o600)
def run(command,env=None,cwd=None):return subprocess.run(command,check=True,env=env,cwd=cwd)
release.mkdir(mode=0o750,parents=True)
run(['tar','--warning=no-unknown-keyword','-xzf',args.archive,'-C',str(release)])
run(['chown','-R','root:coberturas',str(release)])
run(['chmod','-R','o-rwx',str(release)])
run(['find',str(release),'-type','d','-exec','chmod','0750','{}','+'])
run(['find',str(release),'-type','f','-exec','chmod','g+r','{}','+'])
source=oldenv.get('DATABASE_PATH','/var/lib/controle-coberturas/coberturas.sqlite')
snapshot=backup/'coberturas.sqlite'
stopped=False;switched=False;envchanged=False
try:
    # Stop only this application, never PostgreSQL or other hosted services.
    run(['systemctl','stop','controle-coberturas']);stopped=True
    code="const {DatabaseSync,backup}=require('node:sqlite');(async()=>{const db=new DatabaseSync(process.argv[1],{readOnly:true});await backup(db,process.argv[2]);db.close()})().catch(()=>process.exit(1))"
    run(['/usr/bin/node','-e',code,source,str(snapshot)])
    os.chmod(snapshot,0o600)
    migrationenv={**os.environ,**newenv,'DATABASE_PATH':str(snapshot),'CONFIRM_SQLITE_IMPORT':'yes'}
    run(['/usr/bin/node','scripts/migrate.mjs'],env=migrationenv,cwd=release)
    run(['/usr/bin/node','scripts/import-sqlite-postgres.mjs'],env=migrationenv,cwd=release)
    temporary=envfile.with_suffix('.next')
    fd=os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w') as file:
        for key,value in newenv.items():file.write(key+'='+shlex.quote(value)+'\n')
    os.replace(temporary,envfile);envchanged=True
    link=current.with_name('next-release');link.symlink_to(release);os.replace(link,current);switched=True
    run(['systemctl','start','controle-coberturas'])
    for _ in range(30):
        result=subprocess.run(['curl','-fsS','http://127.0.0.1:3100/coberturas/api/health'],capture_output=True,text=True)
        if result.returncode==0 and json.loads(result.stdout).get('status')=='ok':break
        time.sleep(1)
    else:raise RuntimeError('New release health check failed.')
    print('Release activated, import verified, previous environment and SQLite backed up.')
except Exception:
    if switched:
        run(['systemctl','stop','controle-coberturas'])
        link=current.with_name('rollback-release');link.symlink_to(old);os.replace(link,current)
    if envchanged:shutil.copy2(backup/'previous.env',envfile);os.chmod(envfile,0o600)
    if stopped:run(['systemctl','start','controle-coberturas'])
    raise SystemExit('Activation failed; original service restored. Imported target retained for investigation.')
