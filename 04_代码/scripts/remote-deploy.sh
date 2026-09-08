#!/usr/bin/env bash
# 锐涞：在 label 上建库、落 jar/前端、systemd、nginx snippet
set -euo pipefail

ROOT=/home/ubuntu/work/ruilai
WEB_DEST=/var/www/ruilai
PORT=8610
DB_NAME=ruilai
MINI_ADMIN_ENV=/home/ubuntu/work/miniapps/admin/server/.env
PACK=/tmp/ruilai-pack.tar.gz

echo "[1] unpack"
mkdir -p "$ROOT"
if [ -f "$PACK" ]; then
  tar -xzf "$PACK" -C "$ROOT"
  rm -f "$PACK"
fi

echo "[2] db password"
DB_PASS=$(grep -E '^DB_PASSWORD=' "$MINI_ADMIN_ENV" | head -1 | cut -d= -f2-)
DB_USER=$(grep -E '^DB_USER=' "$MINI_ADMIN_ENV" | head -1 | cut -d= -f2-)
DB_USER=${DB_USER:-miniapps}
if [ -z "$DB_PASS" ]; then echo "ERROR: cannot read DB_PASSWORD"; exit 2; fi

echo "[3] create database"
sudo mysql --defaults-file=/etc/mysql/debian.cnf <<EOF
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "[4] env file"
ENVFILE=$ROOT/backend/.env
if [ ! -f "$ENVFILE" ]; then
  JWT=$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)
  cat > "$ENVFILE" <<EOF
RUILAI_PROFILE=prod
RUILAI_PORT=$PORT
RUILAI_DB_USER=$DB_USER
RUILAI_DB_PWD=$DB_PASS
RUILAI_JWT_SECRET=$JWT
RUILAI_OSS_ENABLED=true
RUILAI_OSS_AK=${RUILAI_OSS_AK:-}
RUILAI_OSS_SK=${RUILAI_OSS_SK:-}
RUILAI_SMS_MOCK=false
RUILAI_SMS_AK=${RUILAI_SMS_AK:-}
RUILAI_SMS_SK=${RUILAI_SMS_SK:-}
RUILAI_SMS_MASTER_CODE=${RUILAI_SMS_MASTER_CODE:-888888}
EOF
  chmod 600 "$ENVFILE"
  echo "  created $ENVFILE (fill OSS/SMS keys if empty)"
else
  echo "  keep existing $ENVFILE"
fi

echo "[5] web static"
sudo mkdir -p "$WEB_DEST"
if [ -d "$ROOT/web-dist" ]; then
  sudo rsync -a --delete "$ROOT/web-dist/" "$WEB_DEST/"
  sudo chown -R www-data:www-data "$WEB_DEST"
fi

echo "[6] systemd"
sudo cp "$ROOT/deploy/ruilai.service" /etc/systemd/system/ruilai.service
sudo systemctl daemon-reload
sudo systemctl enable ruilai
sudo systemctl restart ruilai

echo "[7] nginx snippet"
sudo cp "$ROOT/deploy/nginx-ruilai.conf" /etc/nginx/snippets/ruilai.conf
if ! grep -q 'snippets/ruilai.conf' /etc/nginx/sites-enabled/label.onnsa.cn; then
  sudo python3 - <<'PY'
from pathlib import Path
p = Path('/etc/nginx/sites-enabled/label.onnsa.cn')
text = p.read_text()
needle = 'include /etc/nginx/snippets/finance.conf;'
insert = needle + '\n    include /etc/nginx/snippets/ruilai.conf;'
if 'snippets/ruilai.conf' not in text:
    if needle in text:
        p.write_text(text.replace(needle, insert, 1))
    else:
        # fallback: insert before last closing brace of first server
        idx = text.rfind('}')
        text = text[:idx] + '    include /etc/nginx/snippets/ruilai.conf;\n' + text[idx:]
        p.write_text(text)
print('inserted ruilai include')
PY
fi
sudo nginx -t
sudo systemctl reload nginx

echo "[8] smoke"
sleep 2
curl -sS "http://127.0.0.1:8610/api/health" || true
echo
curl -sS -o /dev/null -w "web %{http_code}\n" "https://label.onnsa.cn/ruilai/"
curl -sS -o /dev/null -w "api %{http_code}\n" "https://label.onnsa.cn/ruilai-api/api/health"
echo "DONE -> https://label.onnsa.cn/ruilai/"
