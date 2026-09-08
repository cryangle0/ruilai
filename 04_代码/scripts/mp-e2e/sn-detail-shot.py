import subprocess
import time

ide = r"D:\weixindev\微信web开发者工具\wechatide.cmd"
proj = r"E:\angsa\angsa_data\项目\锐涞经销商管理系统\04_代码\miniprogram\dist\build\mp-weixin"
out = r"E:\angsa\angsa_data\项目\锐涞经销商管理系统\docs\test-evidence\sn-e2e-2026-09-04\mp-sn-query.jpg"
fn = (
    "function(){ var u='/pkg/detail/index?kind=sn'+String.fromCharCode(38)+'id=RL202609040001';"
    " wx.reLaunch({url:u}); return {ok:true}; }"
)
r = subprocess.run(
    [ide, "-c", "cursor", "automation_evaluate", "--project", proj, "--fnSource", fn],
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
    timeout=60,
)
print("EVAL", (r.stdout or "")[-1500:])
print("EVAL_ERR", (r.stderr or "")[-400:])
time.sleep(3)
r2 = subprocess.run(
    [ide, "-c", "cursor", "simulator_screenshot", "--project", proj, "--path", out, "--wait", "2"],
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
    timeout=60,
)
print("SHOT", (r2.stdout or "")[-600:])
