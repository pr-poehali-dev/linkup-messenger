"""
Активация промокодов LinkUp v2.
Действие передаётся в поле action тела запроса (POST) или query-параметре (GET).
"""
import json
import os
import re
import random
import string
from datetime import datetime
import psycopg2

SCHEMA = "t_p25924869_linkup_messenger"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    }

def resp(status: int, data: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    user_id = (event.get("headers") or {}).get("X-User-Id", "demo_user")
    qs = event.get("queryStringParameters") or {}

    body = {}
    if method == "POST":
        body = json.loads(event.get("body") or "{}")

    action = body.get("action") or qs.get("action", "")

    # ── activate ─────────────────────────────────────────────────────────────
    if action == "activate":
        code = body.get("code", "").upper().strip()
        if not code:
            return resp(400, {"success": False, "error": "Введите промокод"})
        if not re.match(r'^[A-Z0-9_]{1,20}$', code):
            return resp(400, {"success": False, "error": "Неверный формат кода"})

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, reward_links, reward_badge, reward_status, reward_description, "
            f"max_activations, activations_count, expires_at, min_level, is_active "
            f"FROM {SCHEMA}.promocodes WHERE code = %s",
            (code,)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return resp(404, {"success": False, "error": "Код недействителен"})

        pid, links, badge, pstatus, desc, max_act, act_count, expires_at, min_level, is_active = row

        if not is_active:
            cur.close(); conn.close()
            return resp(400, {"success": False, "error": "Промокод неактивен"})
        if expires_at and datetime.now() > expires_at:
            cur.close(); conn.close()
            return resp(400, {"success": False, "error": "Срок действия истёк"})
        if max_act is not None and act_count >= max_act:
            cur.close(); conn.close()
            return resp(400, {"success": False, "error": "Лимит активаций исчерпан"})

        cur.execute(
            f"SELECT id FROM {SCHEMA}.promo_activations WHERE user_id = %s AND promocode_id = %s",
            (user_id, pid)
        )
        if cur.fetchone():
            cur.close(); conn.close()
            return resp(400, {"success": False, "error": "Вы уже использовали этот промокод"})

        cur.execute(
            f"INSERT INTO {SCHEMA}.promo_activations (user_id, promocode_id, reward_description) VALUES (%s, %s, %s)",
            (user_id, pid, desc)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.promocodes SET activations_count = activations_count + 1 WHERE id = %s",
            (pid,)
        )
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {
            "success": True,
            "reward": {"description": desc, "links": links, "badge": badge, "status": pstatus}
        })

    # ── my ────────────────────────────────────────────────────────────────────
    if action == "my":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT pa.reward_description, pa.activated_at, p.type "
            f"FROM {SCHEMA}.promo_activations pa "
            f"JOIN {SCHEMA}.promocodes p ON p.id = pa.promocode_id "
            f"WHERE pa.user_id = %s ORDER BY pa.activated_at DESC",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return resp(200, {
            "activations": [{"reward": r[0], "activated_at": r[1], "type": r[2]} for r in rows]
        })

    # ── info ──────────────────────────────────────────────────────────────────
    if action == "info":
        code = (body.get("code") or qs.get("code", "")).upper().strip()
        if not code:
            return resp(400, {"error": "Укажите код"})
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT type, reward_description, max_activations, activations_count, expires_at, min_level, is_active "
            f"FROM {SCHEMA}.promocodes WHERE code = %s",
            (code,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return resp(404, {"error": "Код не найден"})
        ptype, desc, max_act, act_count, expires_at, min_level, is_active = row
        return resp(200, {
            "type": ptype, "description": desc,
            "max_activations": max_act, "activations_count": act_count,
            "expires_at": expires_at, "min_level": min_level, "is_active": is_active
        })

    # ── referral ──────────────────────────────────────────────────────────────
    if action == "referral":
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        ref_code = f"REF_{suffix}"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.promocodes (code, type, reward_links, reward_description, max_activations) "
            f"VALUES (%s, 'referral', 20, '20 ₾ за реферала', 50) ON CONFLICT DO NOTHING",
            (ref_code,)
        )
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {"code": ref_code, "reward": "20 ₾ за каждого приглашённого"})

    # ── default health check ──────────────────────────────────────────────────
    return resp(200, {"ok": True, "service": "LinkUp Promo API"})