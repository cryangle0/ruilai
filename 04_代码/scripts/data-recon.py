"""Reconcile Web / mini / SN / stock / return numbers against live API."""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

BASE = "https://label.onnsa.cn/ruilai-api"
OUT = Path(r"e:\angsa\angsa_data\项目\锐涞经销商管理系统\docs\test-evidence\data-recon-2026-09-03.json")


def req(method, path, body=None, token=None, tries=4):
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = BASE + urllib.parse.quote(path, safe="/:?&=%,")
    last = None
    for i in range(tries):
        try:
            r = urllib.request.urlopen(
                urllib.request.Request(url, data=data, headers=headers, method=method),
                timeout=45,
            )
            return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            last = RuntimeError(f"HTTP {e.code} {path}: {raw[:300]}")
            if e.code < 500:
                raise last
            time.sleep(1.2 * (i + 1))
        except Exception as e:
            last = e
            time.sleep(1.2 * (i + 1))
    raise last


def login(user, client="web"):
    body = req("POST", "/api/auth/login", {"username": user, "password": "demo", "client": client})
    d = body.get("data") or {}
    return d.get("token"), d.get("user") or {}


def all_pages(token, path, extra=""):
    page, size, rows = 1, 100, []
    total = None
    while True:
        sep = "&" if "?" in path else "?"
        q = f"{path}{sep}page={page}&pageSize={size}{extra}"
        body = req("GET", q, token=token)
        data = body.get("data")
        if isinstance(data, dict) and "list" in data:
            chunk = data["list"] or []
            total = data.get("total")
            rows.extend(chunk)
            if len(chunk) < size or (total is not None and len(rows) >= int(total)):
                break
            page += 1
        elif isinstance(data, list):
            return data, len(data)
        else:
            return data, 0
    return rows, int(total or len(rows))


admin_tok, admin_user = login("admin")
hd_tok, hd_user = login("agent_hd", "mini")
hz_tok, hz_user = login("agent_hz", "mini")

dash = req("GET", "/api/dashboard", token=admin_tok).get("data") or {}
sns, sn_total = all_pages(admin_tok, "/api/sns")
stock = req("GET", "/api/stock/summary", token=admin_tok).get("data") or []
pos, po_total = all_pages(admin_tok, "/api/purchases")
sos, so_total = all_pages(admin_tok, "/api/sales")
rts, rt_total = all_pages(admin_tok, "/api/returns")
exs, ex_total = all_pages(admin_tok, "/api/exceptions")
prods, prod_total = all_pages(admin_tok, "/api/products")
l1s, l1_total = all_pages(admin_tok, "/api/agents/l1")
l2s, l2_total = all_pages(admin_tok, "/api/agents/l2", "&auditStatus=")

# mini homes for Sep 1-3 (what the screenshots used)
hd_home = req("GET", "/api/mini/home?from=2026-09-01&to=2026-09-03", token=hd_tok).get("data") or {}
hz_home = req("GET", "/api/mini/home?from=2026-09-01&to=2026-09-03", token=hz_tok).get("data") or {}
hd_home_all = req("GET", "/api/mini/home", token=hd_tok).get("data") or {}
web_stats = req("GET", "/api/dashboard/stats?from=2026-09-01&to=2026-09-03", token=admin_tok).get("data") or {}
web_stats_l1a = req("GET", "/api/dashboard/stats?l1Id=L1A&from=2026-09-01&to=2026-09-03", token=admin_tok).get("data") or {}
web_stats_l2a = req("GET", "/api/dashboard/stats?l1Id=L1A&l2Id=L2A&from=2026-09-01&to=2026-09-03", token=admin_tok).get("data") or {}

hd_stock_self = req("GET", "/api/stock/summary?agentType=l1", token=hd_tok).get("data") or []
hd_stock_all = req("GET", "/api/stock/summary?agentType=all", token=hd_tok).get("data") or []
hz_stock = req("GET", "/api/stock/summary", token=hz_tok).get("data") or []

# SN status breakdown
by_status = Counter(s.get("status") for s in sns)
by_l1_status = defaultdict(Counter)
for s in sns:
    by_l1_status[s.get("l1Id") or "—"][s.get("status")] += 1

stock_qty = sum(int(r.get("qty") or 0) for r in stock)
hd_self_qty = sum(int(r.get("qty") or 0) for r in hd_stock_self)
hd_all_qty = sum(int(r.get("qty") or 0) for r in hd_stock_all)
hz_qty = sum(int(r.get("qty") or 0) for r in hz_stock)

def frozen(s):
    v = s.get("frozen")
    return v in (1, "1", True)

l1_sn = sum(1 for s in sns if s.get("status") == "l1")
l2_sn = sum(1 for s in sns if s.get("status") == "l2")
bound_sn = sum(1 for s in sns if s.get("status") == "bound")
wh_sn = sum(1 for s in sns if s.get("status") == "warehouse")
frozen_in_stock = sum(1 for s in sns if frozen(s) and s.get("status") in ("l1", "l2"))
dash_stock = l1_sn + l2_sn - frozen_in_stock
l1a_l1 = sum(1 for s in sns if s.get("l1Id") == "L1A" and s.get("status") == "l1")
l1a_l2 = sum(1 for s in sns if s.get("l1Id") == "L1A" and s.get("status") == "l2")
l1a_bound = sum(1 for s in sns if s.get("l1Id") == "L1A" and s.get("status") == "bound")
l2a_l2 = sum(1 for s in sns if s.get("l2Id") == "L2A" and s.get("status") == "l2")
l2a_bound = sum(1 for s in sns if s.get("l2Id") == "L2A" and s.get("status") == "bound")

# the stock-detail vs SN-lib row: L1A/L2A/M/腰带M/l2
row_key = [r for r in stock if r.get("l1Id") == "L1A" and r.get("l2Id") == "L2A"
           and r.get("size") == "M" and r.get("belt") == "腰带M"]
row = row_key[0] if row_key else {}
row_sns = list(row.get("sns") or [])
lib_local = [
    s for s in sns
    if s.get("l1Id") == "L1A" and s.get("l2Id") == "L2A"
    and s.get("sizeCode") == "M" and s.get("belt") == "腰带M" and s.get("status") == "l2"
    and (not row.get("productId") or s.get("productId") == row.get("productId"))
]
qs = urllib.parse.urlencode({
    "l1Id": "L1A", "l2Id": "L2A", "size": "M", "belt": "腰带M", "status": "l2",
    "productId": row.get("productId") or "",
})
lib, lib_total = all_pages(admin_tok, "/api/sns", "&" + qs)
lib_sns = {s.get("sn") for s in lib}
missing = sorted(set(row_sns) - lib_sns)
extra = sorted(lib_sns - set(row_sns))
lib2_total = len(lib_local)

# products
prod_by_id = {p.get("id"): p for p in (prods if isinstance(prods, list) else [])}
prod_types = Counter(p.get("type") for p in prod_by_id.values())

# sales with missing product name
so_bad = []
for s in sos:
    pid = s.get("productId")
    name = s.get("productName")
    pname = (prod_by_id.get(pid) or {}).get("name")
    lines = s.get("lines") or []
    if not pname or name in (None, "", "undefined"):
        so_bad.append({
            "no": s.get("no"), "status": s.get("status"), "channel": s.get("channel"),
            "productId": pid, "productName": name, "line0": (lines[0] if lines else None),
            "scannedN": len(s.get("scanned") or []), "planTotal": s.get("planTotal"),
        })

# purchases qty vs home
def line_qty(lines):
    n = 0
    for ln in lines or []:
        try:
            n += int(ln.get("qty") or 0)
        except Exception:
            pass
    return n

def po_qty(p):
    return line_qty(p.get("lines")) + line_qty(p.get("customLines")) + line_qty(p.get("parts"))

hd_pos = [p for p in pos if p.get("l1Id") == "L1A" and p.get("status") == "approved"]
hd_po_qty = sum(po_qty(p) for p in hd_pos)

def so_scanned(s):
    return len(s.get("scanned") or [])

hd_so_done = [s for s in sos if s.get("l1Id") == "L1A" and s.get("status") == "done"]
hd_so_qty = sum(so_scanned(s) for s in hd_so_done)
hd_dist = sum(so_scanned(s) for s in hd_so_done if s.get("channel") == "distribute")
hd_direct = sum(so_scanned(s) for s in hd_so_done if s.get("channel") == "direct")

# month range
def in_month(ts):
    t = str(ts or "")[:10]
    return "2026-09-01" <= t <= "2026-09-03"

hd_so_range = [s for s in hd_so_done if in_month(s.get("createdAt"))]
hd_dist_r = sum(so_scanned(s) for s in hd_so_range if s.get("channel") == "distribute")
hd_direct_r = sum(so_scanned(s) for s in hd_so_range if s.get("channel") == "direct")

hd_rts = [r for r in rts if r.get("fromId") == "L1A" or r.get("approverId") == "L1A"]
hd_rt_qty = sum(len(r.get("sns") or []) for r in hd_rts)
hd_rt_range = sum(len(r.get("sns") or []) for r in hd_rts if in_month(r.get("createdAt")))

# L2A
hz_so_in = [s for s in sos if s.get("l2Id") == "L2A" and s.get("channel") == "distribute" and s.get("status") == "done"]
hz_in_qty = sum(so_scanned(s) for s in hz_so_in)
hz_in_range = sum(so_scanned(s) for s in hz_so_in if in_month(s.get("createdAt")))
hz_rts = [r for r in rts if r.get("fromId") == "L2A"]
hz_rt_qty = sum(len(r.get("sns") or []) for r in hz_rts)

# dashboard vs lists
pending_po = sum(1 for p in pos if p.get("status") in ("pending", "cosigning"))
pending_rt = sum(1 for r in rts if r.get("status") == "pending")
open_ex = sum(1 for e in exs if e.get("status") in ("待处理", "会签中"))
l2_approved = [a for a in l2s if a.get("auditStatus") == "approved" and int(a.get("pending") or 0) == 0]
l2_pending_audit = [a for a in l2s if a.get("auditStatus") == "pending"]
l2_pending_assign = [a for a in l2s if int(a.get("pending") or 0) == 1]
l1_enabled = [a for a in l1s if a.get("status") == "启用"]

checks = []

def chk(name, ok, detail):
    checks.append({"name": name, "ok": bool(ok), "detail": detail})

chk("SN total vs page total", sn_total == len(sns), {"listed": len(sns), "total": sn_total})
chk("stock summary qty == l1+l2 SN", stock_qty == l1_sn + l2_sn, {
    "stock_qty": stock_qty, "l1": l1_sn, "l2": l2_sn, "bound": bound_sn, "sn_total": len(sns)
})
chk("dashboard boundSn == bound SN", dash.get("boundSn") == bound_sn, {
    "dash": dash.get("boundSn"), "count": bound_sn
})
chk("dashboard pendingPo", dash.get("pendingPo") == pending_po, {
    "dash": dash.get("pendingPo"), "count": pending_po
})
chk("dashboard pendingReturn", dash.get("pendingReturn") == pending_rt, {
    "dash": dash.get("pendingReturn"), "count": pending_rt
})
chk("dashboard openEx", dash.get("openEx") == open_ex, {
    "dash": dash.get("openEx"), "count": open_ex, "ex_total": ex_total
})
chk("dashboard l1Count 启用", dash.get("l1Count") == len(l1_enabled), {
    "dash": dash.get("l1Count"), "enabled": len(l1_enabled), "l1_total": l1_total
})
chk("dashboard l2Count approved+not pending", dash.get("l2Count") == len(l2_approved), {
    "dash": dash.get("l2Count"), "approved": len(l2_approved),
    "pendingAudit": [a.get("name") for a in l2_pending_audit],
    "pendingAssign": [a.get("name") for a in l2_pending_assign],
})
chk("mini L1 home stockQty == L1A status=l1", hd_home.get("stockQty") == l1a_l1, {
    "home": hd_home.get("stockQty"), "l1a_l1": l1a_l1, "l1a_l2": l1a_l2,
    "note": "首页文案写本级及下属，接口只计 status=l1"
})
chk("mini L1 self stock sum == l1a_l1", hd_self_qty == l1a_l1, {
    "self_stock": hd_self_qty, "l1a_l1": l1a_l1, "rows": len(hd_stock_self)
})
chk("mini L1 all-scope stock == l1+l2 under L1A", hd_all_qty == l1a_l1 + l1a_l2, {
    "all_stock": hd_all_qty, "l1a_l1": l1a_l1, "l1a_l2": l1a_l2
})
chk("mini L2 stockQty == L2A status=l2", hz_home.get("stockQty") == l2a_l2, {
    "home": hz_home.get("stockQty"), "l2a_l2": l2a_l2, "hz_stock": hz_qty
})
chk("mini L1 purchaseAll == approved PO qty", hd_home.get("purchaseAll") == hd_po_qty, {
    "home": hd_home.get("purchaseAll"), "po_qty": hd_po_qty, "po_n": len(hd_pos)
})
chk("mini L1 salesAll == dist+direct scanned", hd_home.get("salesAll") == hd_so_qty, {
    "home": hd_home.get("salesAll"), "scanned": hd_so_qty, "dist": hd_dist, "direct": hd_direct
})
chk("mini L1 distAll+directAll == salesAll", (hd_home.get("distAll") or 0) + (hd_home.get("directAll") or 0) == hd_home.get("salesAll"), {
    "distAll": hd_home.get("distAll"), "directAll": hd_home.get("directAll"), "salesAll": hd_home.get("salesAll")
})
chk("mini L1 month salesRange == distRange+directRange", (hd_home.get("distRange") or 0) + (hd_home.get("directRange") or 0) == hd_home.get("salesRange"), {
    "salesRange": hd_home.get("salesRange"), "distRange": hd_home.get("distRange"), "directRange": hd_home.get("directRange"),
    "recalc_dist": hd_dist_r, "recalc_direct": hd_direct_r
})
chk("mini L1 returnAll == SN count on related RTs", hd_home.get("returnAll") == hd_rt_qty, {
    "home": hd_home.get("returnAll"), "rt_sn": hd_rt_qty, "rt_n": len(hd_rts)
})
chk("mini L1 actAll == L1A bound SN", hd_home.get("actAll") == l1a_bound, {
    "home": hd_home.get("actAll"), "bound": l1a_bound
})
chk("mini L2 inbound purchaseAll", hz_home.get("purchaseAll") == hz_in_qty, {
    "home": hz_home.get("purchaseAll"), "inbound_scanned": hz_in_qty
})
chk("mini L2 salesAll == L2A bound", hz_home.get("salesAll") == l2a_bound, {
    "home": hz_home.get("salesAll"), "bound": l2a_bound
})
chk("mini L2 returnAll", hz_home.get("returnAll") == hz_rt_qty, {
    "home": hz_home.get("returnAll"), "rt_sn": hz_rt_qty, "rt_n": len(hz_rts)
})
chk("Web 87 == all in-stock SN", stock_qty == l1_sn + l2_sn, {
    "web_seen": 87, "now": stock_qty
})
chk("return 5 orders / 6 SN pieces", True, {
    "orders": len(rts), "sns": sum(len(r.get("sns") or []) for r in rts),
    "note": "KPI 件数=SN 条数，列表=单数，单位不同"
})
chk("stock row L2A M+腰带M qty vs SN lib", len(row_sns) == lib_total, {
    "row_qty": row.get("qty"), "row_sns": len(row_sns), "productId": row.get("productId"),
    "lib_with_jump_filters": lib_total, "lib_local_same_spec": lib2_total,
    "missing_in_lib": missing, "extra_in_lib": extra,
    "note": "码库按 productId+规格筛选",
})
chk("products 6 = kit3 + single1 + other", prod_total == 6, {
    "total": prod_total, "types": dict(prod_types)
})
chk("SN identity l1+l2+bound+warehouse == total", l1_sn + l2_sn + bound_sn + wh_sn == len(sns), {
    "l1": l1_sn, "l2": l2_sn, "bound": bound_sn, "warehouse": wh_sn, "other": dict(by_status),
    "total": len(sns),
})
leftover_l2 = [s.get("sn") for s in sns if s.get("l2Id") and s.get("status") in ("l1", "warehouse")]
chk("no leftover l2Id on l1/warehouse SN", leftover_l2 == [], {"leftover": leftover_l2})
chk("dashboard stats.stock == l1+l2 minus frozen", web_stats.get("stock") == dash_stock, {
    "stats": web_stats.get("stock"), "l1_l2": l1_sn + l2_sn, "frozen_in_stock": frozen_in_stock,
    "stock_page": stock_qty, "note": "库存页含冻结，数据看板不含",
})
for k in ("purchaseAll", "salesAll", "distAll", "directAll", "actAll"):
    chk(f"L1A {k} mini==web stats", hd_home.get(k) == web_stats_l1a.get(k), {
        "mini": hd_home.get(k), "web": web_stats_l1a.get(k)
    })
chk("L1A mini stockQty == L1A status=l1", hd_home.get("stockQty") == l1a_l1, {
    "mini_l1_only": hd_home.get("stockQty"), "l1a_l1": l1a_l1,
    "web_in_stock_includes_l2": web_stats_l1a.get("stock"), "l1a_l2": l1a_l2,
})
chk("L1A returnAll mini==web stats", hd_home.get("returnAll") == web_stats_l1a.get("returnAll"), {
    "mini": hd_home.get("returnAll"), "web": web_stats_l1a.get("returnAll"),
    "note": "看板多计 SN 仍挂在该一级的退货单",
})
chk("L2A salesAll mini==web stats", hz_home.get("salesAll") == web_stats_l2a.get("salesAll"), {
    "mini": hz_home.get("salesAll"), "web": web_stats_l2a.get("salesAll")
})
chk("L2A stockQty mini==web stats.stock", hz_home.get("stockQty") == web_stats_l2a.get("stock"), {
    "mini": hz_home.get("stockQty"), "web": web_stats_l2a.get("stock")
})
chk("global returnAll stats vs SN pieces", web_stats.get("returnAll") == sum(len(r.get("sns") or []) for r in rts), {
    "stats": web_stats.get("returnAll"), "rt_sns": sum(len(r.get("sns") or []) for r in rts), "orders": len(rts)
})

# screenshot vs live for L1 home month
shot_l1 = {
    "purchaseRange": 1, "purchaseAll": 52, "salesRange": 2, "salesAll": 12,
    "distRange": 1, "distAll": 8, "directRange": 1, "directAll": 4,
    "returnRange": 1, "returnAll": 5, "actRange": 1, "actAll": 11, "stockQty": 51,
}
shot_mismatch = {k: {"shot": v, "api": hd_home.get(k)} for k, v in shot_l1.items() if hd_home.get(k) != v}

shot_l2 = {
    "purchaseRange": 1, "purchaseAll": 8, "salesRange": 1, "salesAll": 7,
    "returnRange": 1, "returnAll": 3, "actRange": 1, "actAll": 7, "stockQty": 8,
}
shot_l2_mismatch = {k: {"shot": v, "api": hz_home.get(k)} for k, v in shot_l2.items() if hz_home.get(k) != v}

report = {
    "dashboard": dash,
    "sn": {"total": len(sns), "byStatus": dict(by_status), "byL1": {k: dict(v) for k, v in by_l1_status.items()}},
    "stock": {"summaryRows": len(stock), "qty": stock_qty, "hd_self": hd_self_qty, "hd_all": hd_all_qty, "hz": hz_qty},
    "mini_hd_month": hd_home,
    "mini_hz_month": hz_home,
    "web_stats_month": {k: web_stats.get(k) for k in ("purchaseRange", "purchaseAll", "salesRange", "salesAll", "stock", "returnRange", "returnAll", "actAll", "distAll", "directAll")},
    "web_stats_l1a": {k: web_stats_l1a.get(k) for k in ("purchaseRange", "purchaseAll", "salesRange", "salesAll", "stock", "returnRange", "returnAll", "actAll", "distAll", "directAll")},
    "web_stats_l2a": {k: web_stats_l2a.get(k) for k in ("purchaseRange", "purchaseAll", "salesRange", "salesAll", "stock", "returnRange", "returnAll", "actAll")},
    "shot_l1_vs_api": shot_mismatch,
    "shot_l2_vs_api": shot_l2_mismatch,
    "so_missing_product": so_bad[:15],
    "so_missing_n": len(so_bad),
    "stock_row_M": {
        "qty": row.get("qty"), "productId": row.get("productId"), "productName": row.get("productName"),
        "sns": row_sns, "lib_total": lib_total, "lib2_total": lib2_total, "missing": missing,
    },
    "counts": {
        "po": po_total, "so": so_total, "rt": rt_total, "ex": ex_total, "prod": prod_total,
        "l1": l1_total, "l2": l2_total,
    },
    "checks": checks,
    "pass": sum(1 for c in checks if c["ok"]),
    "fail": sum(1 for c in checks if not c["ok"]),
}

print(json.dumps({
    "pass": report["pass"], "fail": report["fail"],
    "fails": [c for c in checks if not c["ok"]],
    "shot_l1_vs_api": shot_mismatch,
    "shot_l2_vs_api": shot_l2_mismatch,
    "so_missing_n": len(so_bad),
    "so_missing_product": so_bad[:8],
    "stock_row_M": report["stock_row_M"],
    "sn": report["sn"],
    "stock": report["stock"],
    "dashboard": dash,
    "mini_hd_month": {k: hd_home.get(k) for k in shot_l1},
    "mini_hz_month": {k: hz_home.get(k) for k in shot_l2},
    "web_stats_l1a": {k: web_stats_l1a.get(k) for k in ("purchaseAll", "salesAll", "stock", "returnAll", "actAll", "distAll", "directAll")},
    "web_stats_l2a": {k: web_stats_l2a.get(k) for k in ("purchaseAll", "salesAll", "stock", "returnAll", "actAll")},
    "frozen_in_stock": frozen_in_stock,
    "warehouse": wh_sn,
}, ensure_ascii=False, indent=2))

OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print("wrote", OUT)
