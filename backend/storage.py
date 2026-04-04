import os, json, uuid, requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def _headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def _check_creds() -> bool:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[WARN] Supabase credentials missing. Data will not be saved.")
        return False
    return True

# ─── TEST CONNECTION ────────────────────────────────────────────────────────
def test_connection() -> bool:
    if not _check_creds():
        return False
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/documents?select=id&limit=1",
            headers=_headers(), timeout=5
        )
        if r.status_code in (200, 206):
            print("[INFO] ✅ Supabase connected successfully!")
            return True
        else:
            print(f"[WARN] Supabase responded with status {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        print(f"[ERROR] Supabase connection failed: {e}")
        return False

# ─── SAVE DOCUMENT ──────────────────────────────────────────────────────────
def save_document(filename, raw_text, extraction_method, extracted_fields, warnings, confidence=0) -> str:
    doc_id = str(uuid.uuid4())[:8]
    if not _check_creds():
        return doc_id
    data = {
        "id": doc_id,
        "filename": filename,
        "raw_text": raw_text,
        "extraction_method": extraction_method,
        "fields": extracted_fields,
        "warnings": warnings,
        "confidence": confidence
    }
    try:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/documents",
            headers=_headers(),
            json=data, timeout=10
        )
        if r.status_code in (200, 201):
            print(f"[SUPABASE] ✅ Document saved: {doc_id}")
        else:
            print(f"[SUPABASE] ❌ Save failed ({r.status_code}): {r.text[:300]}")
    except Exception as e:
        print(f"[SUPABASE] ❌ Exception saving document: {e}")
    return doc_id

# ─── GET ALL DOCUMENTS ───────────────────────────────────────────────────────
def get_all_documents() -> list:
    if not _check_creds():
        return []
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/documents?select=id,filename,extraction_method,warnings,confidence,uploaded_at,fields&order=uploaded_at.desc",
            headers=_headers(), timeout=10
        )
        rows = r.json() if r.status_code == 200 else []
        result = []
        for d in rows:
            d["warning_count"] = len(d.get("warnings") or [])
            fields = d.get("fields") or {}
            d["document_type"] = fields.get("document_type", "Other")
            d["patient_name"] = (fields.get("patient") or {}).get("name")
            d.pop("fields", None)
            result.append(d)
        return result
    except Exception as e:
        print(f"[SUPABASE] ❌ get_all_documents error: {e}")
        return []

# ─── GET DOCUMENT BY ID ──────────────────────────────────────────────────────
def get_document_by_id(doc_id: str) -> dict | None:
    if not _check_creds():
        return None
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}&select=*",
            headers=_headers(), timeout=10
        )
        data = r.json() if r.status_code == 200 else []
        return data[0] if data else None
    except Exception as e:
        print(f"[SUPABASE] ❌ get_document_by_id error: {e}")
        return None

# ─── DELETE DOCUMENT ─────────────────────────────────────────────────────────
def delete_document(doc_id: str) -> bool:
    if not _check_creds():
        return False
    try:
        r = requests.delete(
            f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}",
            headers=_headers(), timeout=10
        )
        return r.status_code in (200, 204)
    except Exception as e:
        print(f"[SUPABASE] ❌ delete error: {e}")
        return False

# ─── GET STATS ────────────────────────────────────────────────────────────────
def get_stats() -> dict:
    empty = {"total": 0, "avg_confidence": 0, "digital": 0, "ocr": 0,
             "doc_types": {}, "total_warnings": 0, "avg_warnings": 0,
             "revenue": {"total_billed": 0, "total_approved": 0,
                         "total_loss_identified": 0, "predictability_score": 0}}
    if not _check_creds():
        return empty
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/documents?select=fields,confidence,extraction_method,warnings",
            headers=_headers(), timeout=10
        )
        rows = r.json() if r.status_code == 200 else []
        total = len(rows)
        if total == 0:
            return empty

        from claim_engine import generate_claim, reconcile
        avg_conf = sum(row.get("confidence") or 0 for row in rows) // total
        digital  = sum(1 for row in rows if row.get("extraction_method") == "digital")
        ocr      = total - digital
        doc_types, total_w = {}, 0
        total_bill = total_approved = total_loss = 0

        for row in rows:
            f = row.get("fields") or {}
            dt = f.get("document_type", "Other")
            doc_types[dt] = doc_types.get(dt, 0) + 1
            total_w += len(row.get("warnings") or [])
            claim = generate_claim(f)
            total_bill += claim.get("total_bill", 0)
            total_approved += claim.get("approved_claim", 0)
            rev = reconcile(claim.get("total_bill", 0), claim.get("approved_claim", 0))
            total_loss += rev.get("loss", 0)

        return {
            "total": total, "avg_confidence": avg_conf,
            "digital": digital, "ocr": ocr, "doc_types": doc_types,
            "total_warnings": total_w, "avg_warnings": round(total_w / total, 1),
            "revenue": {
                "total_billed": total_bill, "total_approved": total_approved,
                "total_loss_identified": total_loss,
                "predictability_score": round((total_approved / total_bill) * 100) if total_bill > 0 else 0
            }
        }
    except Exception as e:
        print(f"[SUPABASE] ❌ get_stats error: {e}")
        return empty

# ─── SAVE CLAIM ───────────────────────────────────────────────────────────────
def save_claim(claim):
    print(f"[SUPABASE] Claim logged — Total Bill: ₹{claim.get('total_bill', 0)}")

# ─── UPDATE DOCUMENT FIELDS ──────────────────────────────────────────────────
def update_document_fields(doc_id: str, new_fields: dict) -> bool:
    if not _check_creds():
        return False
    try:
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/documents?id=eq.{doc_id}",
            headers=_headers(),
            json={"fields": new_fields, "confidence": 100, "warnings": []},
            timeout=10
        )
        return r.status_code in (200, 204)
    except Exception as e:
        print(f"[SUPABASE] ❌ update error: {e}")
        return False
