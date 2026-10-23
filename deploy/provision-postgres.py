#!/usr/bin/env python3
"""Create an isolated app database. Run as root; never print credentials."""
import argparse,os,pathlib,re,secrets,subprocess
parser=argparse.ArgumentParser()
parser.add_argument('--database',required=True)
parser.add_argument('--env-file',required=True)
args=parser.parse_args()
if os.geteuid()!=0:raise SystemExit('Run as root.')
name=args.database
if not re.fullmatch(r'controle_coberturas_[a-z0-9_]+',name):raise SystemExit('Invalid database name.')
env=pathlib.Path(args.env_file)
if env.exists():raise SystemExit('Environment file already exists; refusing to overwrite.')
def psql(sql):
    result=subprocess.run(['runuser','-u','postgres','--','psql','-X','-v','ON_ERROR_STOP=1','-At'],input=sql,text=True,capture_output=True)
    if result.returncode:raise SystemExit('PostgreSQL provisioning failed; no credentials printed.')
    return result.stdout.strip()
if psql(f"SELECT 1 FROM pg_database WHERE datname='{name}'") or psql(f"SELECT 1 FROM pg_roles WHERE rolname='{name}'"):
    raise SystemExit('Database or role already exists; refusing to overwrite.')
password=secrets.token_hex(32)
psql(f"CREATE ROLE {name} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 10 PASSWORD '{password}';")
psql(f'CREATE DATABASE {name} OWNER {name};')
psql(f'REVOKE ALL ON DATABASE {name} FROM PUBLIC;')
env.parent.mkdir(parents=True,exist_ok=True)
fd=os.open(env,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
with os.fdopen(fd,'w') as file:file.write(f'DATABASE_URL=postgresql://{name}:{password}@127.0.0.1:5432/{name}\n')
print(f'Created isolated PostgreSQL database: {name}. Credentials saved privately.')
