# 锐涞经销商 · 本地打包并部署到 label（SSH Host label）
# 用法：在 04_代码 目录执行
#   powershell -File .\scripts\deploy-to-label.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$JavaHome = "E:\java17"
$Mvn = "mvn"
$Pack = Join-Path $env:TEMP "ruilai-pack.tar.gz"
$Stage = Join-Path $env:TEMP "ruilai-stage"

Write-Host "== backend package (Java 17) =="
$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;" + $env:Path
Push-Location (Join-Path $Root "backend")
& $Mvn -q -DskipTests package
if ($LASTEXITCODE -ne 0) { throw "maven package failed" }
Pop-Location

Write-Host "== web build =="
Push-Location (Join-Path $Root "web")
if (-not (Test-Path "node_modules")) { npm install }
npm run build
if ($LASTEXITCODE -ne 0) { throw "web build failed" }
Pop-Location

Write-Host "== stage pack =="
if (Test-Path $Stage) { Remove-Item -Recurse -Force $Stage }
New-Item -ItemType Directory -Path (Join-Path $Stage "backend") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $Stage "web-dist") | Out-Null
New-Item -ItemType Directory -Path (Join-Path $Stage "deploy") | Out-Null
Copy-Item (Join-Path $Root "backend\target\ruilai.jar") (Join-Path $Stage "backend\ruilai-server.jar")
Copy-Item (Join-Path $Root "deploy\*") (Join-Path $Stage "deploy") -Recurse
Copy-Item (Join-Path $Root "web\dist\*") (Join-Path $Stage "web-dist") -Recurse
Copy-Item (Join-Path $Root "scripts\remote-deploy.sh") (Join-Path $Stage "remote-deploy.sh")

if (Test-Path $Pack) { Remove-Item $Pack }
Push-Location $Stage
tar -czf $Pack *
Pop-Location

Write-Host "== scp to label =="
scp -O $Pack ubuntu@label:/tmp/ruilai-pack.tar.gz
scp -O (Join-Path $Root "scripts\remote-deploy.sh") ubuntu@label:/tmp/ruilai-remote-deploy.sh

Write-Host "== remote deploy =="
ssh label "bash /tmp/ruilai-remote-deploy.sh"

Write-Host "open https://label.onnsa.cn/ruilai/"
