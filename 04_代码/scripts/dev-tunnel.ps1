# 把 label 上的 MySQL/Redis 映射到本机 3307 / 6380（不要用本机安装的库）
# 用法：在另一个终端保持运行
#   powershell -File .\04_代码\scripts\dev-tunnel.ps1

$ErrorActionPreference = "Stop"
Write-Host "SSH tunnel  label  3306->3307  6379->6380  (Ctrl+C to stop)"
ssh -N -L 3307:127.0.0.1:3306 -L 6380:127.0.0.1:6379 label
