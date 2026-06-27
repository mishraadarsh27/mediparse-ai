"""
rcm_storage.py — Supabase REST API operations for RCM Cases
"""
import os, requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
TABLE = "rcm_cases"


def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def _ok():
    return bool(SUPABASE_URL and SUPABASE_KEY)


def save_case(case: dict) -> dict:
    if not _ok():
        return case
    payload = {**case, "updated_at": datetime.utcnow().isoformat()}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/{TABLE}", headers=_headers(), json=payload, timeout=10)
    if r.status_code in (200, 201):
        print(f"[RCM] ✅ Case saved: {case['id']}")
    else:
        print(f"[RCM] ❌ Save failed ({r.status_code}): {r.text[:300]}")
    return case


def update_case(case_id: str, updates: dict) -> bool:
    if not _ok():
        return False
    updates["updated_at"] = datetime.utcnow().isoformat()
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{case_id}",
        headers=_headers(), json=updates, timeout=10
    )
    if r.status_code in (200, 204):
        print(f"[RCM] ✅ Case updated: {case_id}")
        return True
    print(f"[RCM] ❌ Update failed ({r.status_code}): {r.text[:300]}")
    return False


def get_all_cases() -> list:
    if not _ok():
        return []
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?select=*&order=created_at.desc",
        headers=_headers(), timeout=10
    )
    return r.json() if r.status_code == 200 else []


def get_case(case_id: str) -> dict | None:
    if not _ok():
        return None
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{case_id}&select=*",
        headers=_headers(), timeout=10
    )
    data = r.json() if r.status_code == 200 else []
    return data[0] if data else None


def delete_case(case_id: str) -> bool:
    if not _ok():
        return False
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/{TABLE}?id=eq.{case_id}",
        headers=_headers(), timeout=10
    )
    return r.status_code in (200, 204)
