"""
Validator + Confidence Scorer
Returns (validated_fields, warnings, confidence_score 0-100)
"""
import re
from typing import Any

DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

BILLING_REQUIRED   = ["patient.name", "hospital.name", "dates.admission_date",
                       "dates.discharge_date", "diagnosis.primary", "billing.total_amount"]
LAB_REQUIRED       = ["patient.name", "dates.document_date", "lab_tests"]
GENERAL_REQUIRED   = ["patient.name", "dates.document_date"]

def validate_fields(fields: dict) -> tuple[dict, list[str], int]:
    warnings = []
    fields["amount"] = int(fields.get("amount", 0))
    doc_type = fields.get("document_type", "Other")

    required = (BILLING_REQUIRED if doc_type in ("Hospital Bill", "Discharge Summary", "Insurance Form")
                else LAB_REQUIRED if doc_type == "Lab Report"
                else GENERAL_REQUIRED)

    # Check required fields (dot-notation traversal)
    for path in required:
        val = _get(fields, path)
        if val is None or val == "" or val == []:
            warnings.append(f"Missing required field: {path}")

    # Validate dates
    dates = fields.get("dates", {})
    for k, v in dates.items():
        if v and not DATE_RE.match(str(v)):
            warnings.append(f"Date format issue in dates.{k}: got '{v}', expected YYYY-MM-DD")

    # Validate amounts
    billing = fields.get("billing", {})
    for k in ["total_amount","amount_paid","amount_due"]:
        v = billing.get(k)
        if v is not None:
            try: float(v)
            except: warnings.append(f"Invalid billing amount: billing.{k} = '{v}'")

    # Amount reconciliation
    total = _f(billing.get("total_amount"))
    paid  = _f(billing.get("amount_paid"))
    due   = _f(billing.get("amount_due"))
    if total and paid and due:
        expected = round(total - paid, 2)
        if abs(expected - due) > 2:
            warnings.append(f"Amount mismatch: {total} - {paid} = {expected}, but amount_due = {due}")

    # Date logic
    adm = dates.get("admission_date")
    dis = dates.get("discharge_date")
    if adm and dis and DATE_RE.match(adm) and DATE_RE.match(dis) and adm > dis:
        warnings.append(f"admission_date ({adm}) is after discharge_date ({dis})")

    # Abnormal labs
    labs = fields.get("lab_tests", []) or []
    abnormal = [t.get("name","?") for t in labs if t.get("status") in ("High","Low")]
    if abnormal:
        warnings.append(f"Abnormal results: {', '.join(abnormal)}")

    # Confidence score
    filled = _count_filled(fields)
    total_fields = _count_total(fields)
    base_score = int((filled / max(total_fields, 1)) * 100)
    penalty = len([w for w in warnings if "Missing required" in w]) * 8
    confidence = max(0, min(100, base_score - penalty))

    return fields, warnings, confidence

def _get(d: dict, path: str):
    parts = path.split(".")
    cur = d
    for p in parts:
        if not isinstance(cur, dict): return None
        cur = cur.get(p)
    return cur

def _f(v: Any):
    try: return float(v)
    except: return None

def _count_filled(obj, depth=0):
    if depth > 3: return 0
    if isinstance(obj, dict):
        return sum(_count_filled(v, depth+1) for v in obj.values())
    if isinstance(obj, list):
        return len(obj)
    return 1 if obj is not None and obj != "" else 0

def _count_total(obj, depth=0):
    if depth > 3: return 1
    if isinstance(obj, dict):
        return max(1, sum(_count_total(v, depth+1) for v in obj.values()))
    if isinstance(obj, list):
        return 3  # expect at least a few items
    return 1
