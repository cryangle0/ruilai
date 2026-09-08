"""Lightweight NFR smoke (not a pentest): latency, concurrency, unauth 401."""
from __future__ import annotations

import json
import statistics
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE = "https://label.onnsa.cn/ruilai-api"
OUT = Path(r"e:\angsa\angsa_data\项目\锐涞经销商管理系统\docs\test-evidence\nfr-2026-09-03.json")


def req(method: str, path: str, body=None, token=None, timeout=20):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    t0 = time.perf_counter()
    try:
        r = urllib.request.urlopen(
            urllib.request.Request(BASE + path, data=data, headers=headers, method=method),
            timeout=timeout,
        )
        raw = r.read()
        ms = (time.perf_counter() - t0) * 1000
        return {"ok": True, "status": r.status, "ms": round(ms, 1), "n": len(raw), "body": json.loads(raw.decode() or "null")}
    except urllib.error.HTTPError as e:
        raw = e.read()
        ms = (time.perf_counter() - t0) * 1000
        try:
            parsed = json.loads(raw.decode() or "null")
        except Exception:
            parsed = raw[:200].decode("utf-8", "replace")
        return {"ok": False, "status": e.code, "ms": round(ms, 1), "n": len(raw), "body": parsed}
    except Exception as e:
        ms = (time.perf_counter() - t0) * 1000
        return {"ok": False, "status": 0, "ms": round(ms, 1), "error": str(e)}


def stats(samples):
    xs = [s["ms"] for s in samples]
    return {
        "n": len(xs),
        "min": round(min(xs), 1),
        "p50": round(statistics.median(xs), 1),
        "p95": round(sorted(xs)[max(0, int(len(xs) * 0.95) - 1)], 1),
        "max": round(max(xs), 1),
        "mean": round(statistics.mean(xs), 1),
        "ok": sum(1 for s in samples if s.get("ok")),
        "fail": sum(1 for s in samples if not s.get("ok")),
        "statuses": sorted({s.get("status") for s in samples}),
    }


report = {"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "base": BASE, "cases": {}}

# 1) health serial
health = [req("GET", "/api/health") for _ in range(8)]
report["cases"]["NFR-PERF-01"] = {
    "title": "GET /api/health serial x8",
    "expect": "200, p95 < 800ms (smoke)",
    "stats": stats(health),
    "sample": health[0],
}

# 2) health concurrent
conc = []
with ThreadPoolExecutor(max_workers=12) as ex:
    futs = [ex.submit(req, "GET", "/api/health") for _ in range(20)]
    for f in as_completed(futs):
        conc.append(f.result())
report["cases"]["NFR-CONC-01"] = {
    "title": "GET /api/health concurrent x20",
    "expect": "all 200, no 5xx",
    "stats": stats(conc),
}

# 3) unauth protected APIs
unauth_paths = [
    "/api/products?page=1&pageSize=5",
    "/api/agents/l1?page=1&pageSize=5",
    "/api/sns?page=1&pageSize=5",
    "/api/purchases?page=1&pageSize=5",
]
unauth = []
for p in unauth_paths:
    r = req("GET", p)
    unauth.append({"path": p, **{k: r[k] for k in r if k != "body"}, "code": (r.get("body") or {}).get("code") if isinstance(r.get("body"), dict) else None})
report["cases"]["NFR-AUTH-01"] = {
    "title": "unauthenticated GET business APIs",
    "expect": "401/403, not 200 with data",
    "rows": unauth,
}

# 4) login + authenticated list latency
login = req("POST", "/api/auth/login", {"username": "admin", "password": "demo", "client": "web"})
token = None
if isinstance(login.get("body"), dict):
    token = ((login["body"].get("data") or {}).get("token"))
report["cases"]["NFR-AUTH-02"] = {
    "title": "admin login",
    "expect": "200 + token",
    "status": login.get("status"),
    "ms": login.get("ms"),
    "hasToken": bool(token),
}

if token:
    authed = []
    for p in [
        "/api/health",
        "/api/products?page=1&pageSize=20",
        "/api/sns?page=1&pageSize=20",
        "/api/stock/summary",
        "/api/purchases?page=1&pageSize=20",
        "/api/sales?page=1&pageSize=20",
    ]:
        samples = [req("GET", p, token=token) for _ in range(3)]
        authed.append({"path": p, "stats": stats(samples), "status0": samples[0].get("status")})
    report["cases"]["NFR-PERF-02"] = {
        "title": "authenticated list GETs x3 each",
        "expect": "200, p95 < 1500ms smoke",
        "rows": authed,
    }

    # 5) ops cannot hit roles (already known, keep as authz smoke)
    ops = req("POST", "/api/auth/login", {"username": "ops", "password": "demo", "client": "web"})
    ops_token = ((ops.get("body") or {}).get("data") or {}).get("token") if isinstance(ops.get("body"), dict) else None
    roles = req("GET", "/api/roles", token=ops_token) if ops_token else {"status": 0}
    report["cases"]["NFR-AUTHZ-01"] = {
        "title": "ops GET /api/roles",
        "expect": "403",
        "status": roles.get("status"),
        "ms": roles.get("ms"),
        "msg": (roles.get("body") or {}).get("message") if isinstance(roles.get("body"), dict) else None,
    }

print(json.dumps(report, ensure_ascii=False, indent=2))
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", OUT)
