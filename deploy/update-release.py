#!/usr/bin/env python3
"""Update an existing PostgreSQL installation with backup and health check."""
import argparse,os,pathlib,shlex,subprocess,time,json
p=argparse.ArgumentParser();p.add_argument('--release',required=True);p.add_argument('--archive',required=True);p.add_argument('--backup',action='store_true');a=p.parse_args()
if os.geteuid()!=0 or not a.release.replace('-','').isalnum():raise SystemExit('Run as root with a valid release name.')
current=pathlib.Path('/opt/controle-coberturas/current');old=current.resolve(strict=True)
release=current.parent/'releases'/a.release
if release.exists():raise SystemExit('Release already exists.')
env=dict(os.environ)
for line in pathlib.Path('/etc/controle-coberturas.env').read_text().splitlines():
 if line.strip() and not line.lstrip().startswith('#') and '=' in line:
  key,value=line.split('=',1);parts=shlex.split(value);env[key]=parts[0] if parts else ''
if not env.get('DATABASE_URL'):raise SystemExit('This procedure requires PostgreSQL.')
def run(cmd,**kw):subprocess.run(cmd,check=True,**kw)
release.mkdir(mode=0o750)
run(['tar','--warning=no-unknown-keyword','-xzf',a.archive,'-C',str(release)])
run(['chown','-R','root:coberturas',str(release)]);run(['chmod','-R','o-rwx',str(release)])
run(['find',str(release),'-type','d','-exec','chmod','0750','{}','+']);run(['find',str(release),'-type','f','-exec','chmod','g+r','{}','+'])
backup=pathlib.Path('/var/backups/controle-coberturas')/('before-'+a.release+'.dump')
stopped=False;switched=False
try:
 run(['systemctl','stop','controle-coberturas']);stopped=True
 if a.backup:
  with os.fdopen(os.open(backup,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'wb') as out:
   run(['runuser','-u','postgres','--','pg_dump','--format=custom','--dbname=controle_coberturas_app'],stdout=out)
  run(['pg_restore','--list',str(backup)],stdout=subprocess.DEVNULL)
 run(['/usr/bin/node','scripts/migrate.mjs'],env=env,cwd=release)
 link=current.with_name('update-next');link.symlink_to(release);os.replace(link,current);switched=True
 run(['systemctl','start','controle-coberturas'])
 for _ in range(30):
  r=subprocess.run(['curl','-fsS','http://127.0.0.1:3100/coberturas/api/health'],capture_output=True,text=True)
  if r.returncode==0 and json.loads(r.stdout).get('status')=='ok':break
  time.sleep(1)
 else:raise RuntimeError('Health check failed.')
 print('Release activated. Existing records preserved; backup '+('created.' if a.backup else 'not requested.'))
except Exception:
 if switched:
  run(['systemctl','stop','controle-coberturas']);link=current.with_name('update-rollback');link.symlink_to(old);os.replace(link,current)
 if stopped:run(['systemctl','start','controle-coberturas'])
 raise SystemExit('Update failed; previous application restored. Database not rolled back.')
