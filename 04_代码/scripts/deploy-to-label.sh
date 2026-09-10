#!/usr/bin/env bash
# Package backend + web and deploy to SSH host `label`.
set -euo pipefail

export PATH="$HOME/.local/node/bin:$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="${TMPDIR:-/tmp}/ruilai-stage"
PACK="${TMPDIR:-/tmp}/ruilai-pack.tar.gz"

echo "== backend package =="
(
  cd "$ROOT/backend"
  mvn -q -DskipTests package
)

echo "== web build =="
(
  cd "$ROOT/web"
  if [[ ! -d node_modules ]]; then npm install; fi
  npm run build
)

echo "== stage pack =="
rm -rf "$STAGE"
mkdir -p "$STAGE/backend" "$STAGE/web-dist" "$STAGE/deploy"
cp "$ROOT/backend/target/ruilai.jar" "$STAGE/backend/ruilai-server.jar"
cp -R "$ROOT/deploy/." "$STAGE/deploy/"
cp -R "$ROOT/web/dist/." "$STAGE/web-dist/"
cp "$ROOT/scripts/remote-deploy.sh" "$STAGE/remote-deploy.sh"
tar -C "$STAGE" -czf "$PACK" .

echo "== scp to label =="
scp "$PACK" ubuntu@label:/tmp/ruilai-pack.tar.gz
scp "$ROOT/scripts/remote-deploy.sh" ubuntu@label:/tmp/ruilai-remote-deploy.sh

echo "== remote deploy =="
ssh label "bash /tmp/ruilai-remote-deploy.sh"
echo "open https://label.onnsa.cn/ruilai/"
