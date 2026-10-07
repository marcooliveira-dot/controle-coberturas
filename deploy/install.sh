#!/usr/bin/env bash
set -euo pipefail
release_id=${1:?Informe o SHA do commit}
archive_path=${2:?Informe o arquivo da release}
environment_source=${3:?Informe o arquivo de ambiente privado}
backup_enabled=${ENABLE_BACKUPS:-false}
[[ "$release_id" =~ ^[a-f0-9]{40}$ ]] || { echo 'SHA inválido'; exit 1; }
[[ "$EUID" == 0 ]] || { echo 'Execute como root'; exit 1; }
command -v node >/dev/null
node -e 'const [a,b]=process.versions.node.split(".").map(Number);if(a<22||(a===22&&b<13))process.exit(1)'
getent passwd coberturas >/dev/null || useradd --system --home-dir /var/lib/controle-coberturas --shell /usr/sbin/nologin coberturas
install -d -m 0755 /opt/controle-coberturas/releases
install -d -o coberturas -g coberturas -m 0700 /var/lib/controle-coberturas /var/backups/controle-coberturas
install -d -m 0700 /var/backups/controle-coberturas-config
if [[ ! -f /etc/controle-coberturas.env ]]; then install -m 0600 "$environment_source" /etc/controle-coberturas.env; fi
if [[ "$backup_enabled" == true && -f /var/lib/controle-coberturas/coberturas.sqlite && -L /opt/controle-coberturas/current ]]; then systemctl start controle-coberturas-backup.service; fi
release_dir="/opt/controle-coberturas/releases/$release_id"
install -d -m 0755 "$release_dir"
tar -xzf "$archive_path" -C "$release_dir"
chown -R root:coberturas "$release_dir"
chmod -R o-rwx "$release_dir"
find "$release_dir" -type d -exec chmod 0750 {} +
find "$release_dir" -type f -exec chmod g+r {} +
ln -sfn "$release_dir" /opt/controle-coberturas/current
install -m 0644 "$release_dir/deploy/controle-coberturas.service" /etc/systemd/system/
install -m 0644 "$release_dir/deploy/controle-coberturas-backup.service" /etc/systemd/system/
install -m 0644 "$release_dir/deploy/controle-coberturas-backup.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable controle-coberturas.service
systemctl restart controle-coberturas.service
for i in $(seq 1 30); do if curl -fsS http://127.0.0.1:3100/coberturas/api/health >/dev/null; then break; fi; sleep 1; done
curl -fsS http://127.0.0.1:3100/coberturas/api/health
install -m 0644 "$release_dir/deploy/nginx-proxy.conf" /etc/nginx/snippets/controle-coberturas-proxy.conf
nginx_site=$(readlink -f /etc/nginx/sites-enabled/backupemail.conf)
nginx_backup="/var/backups/controle-coberturas-config/nginx-$release_id.conf"
cp -a "$nginx_site" "$nginx_backup"
python3 - "$nginx_site" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]);s=p.read_text()
if 'snippets/controle-coberturas-proxy.conf' not in s:
    needle='    location / {'
    assert s.count(needle)==1, 'Configuração Nginx não reconhecida'
    locations='    location = /coberturas { include /etc/nginx/snippets/controle-coberturas-proxy.conf; }\n    location /coberturas/ { include /etc/nginx/snippets/controle-coberturas-proxy.conf; }\n\n'
    p.write_text(s.replace(needle,locations+needle))
PY
if ! nginx -t; then cp -a "$nginx_backup" "$nginx_site"; exit 1; fi
systemctl reload nginx
if [[ "$backup_enabled" == true ]]; then
    systemctl enable --now controle-coberturas-backup.timer
    systemctl start controle-coberturas-backup.service
else
    systemctl disable --now controle-coberturas-backup.timer
    systemctl stop controle-coberturas-backup.service
fi
echo 'Instalação concluída.'
