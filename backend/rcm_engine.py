"""
rcm_engine.py — Revenue Cycle Management State Machine
Full workflow: PreAuth → Admission → Enhancement → Discharge → Payment → Settlement → Closure
"""
from datetime import datetime

# ─── WORKFLOW STAGES ──────────────────────────────────────────────────────────
STAGES = {
    1: "Pre-Authorization",
    2: "Admission",
    3: "Enhancement",
    4: "Discharge Intimation",
    5: "Discharge Approval",
    6: "Payment & Discharge",
    7: "Settlement",
    8: "Case Closed",
}

STATUS_LABELS = {
    "pre_auth_pending":       "Pre-Auth Pending",
    "pre_auth_approved":      "Pre-Auth Approved",
    "rejected":               "Rejected",
    "admitted":               "Patient Admitted",
    "enhancement_requested":  "Enhancement Requested",
    "enhancement_approved":   "Enhancement Approved",
    "discharge_initiated":    "Discharge Initiated",
    "discharge_approved":     "Discharge Approved",
    "discharge_held":         "Discharge On Hold",
    "payment_done":           "Payment Processed",
    "settled":                "Settlement Recorded",
    "closed":                 "Case Closed",
}

STATUS_STAGE_MAP = {
    "pre_auth_pending":       1,
    "pre_auth_approved":      1,
    "rejected":               1,
    "admitted":               2,
    "enhancement_requested":  3,
    "enhancement_approved":   3,
    "discharge_initiated":    4,
    "discharge_approved":     5,
    "discharge_held":         5,
    "payment_done":           6,
    "settled":                7,
    "closed":                 8,
}


def _now():
    return datetime.utcnow().isoformat()


def _admission_number():
    import random, string
    return "ADM-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


# ─── STAGE 1: Pre-Authorization ───────────────────────────────────────────────
def create_case(data: dict) -> dict:
    """Initialize a new RCM case at Stage 1 — Pre-Authorization."""
    import uuid
    case_id = str(uuid.uuid4())[:10].upper()
    return {
        "id": case_id,
        "patient_name": data.get("patient_name", "Unknown"),
        "patient_id": data.get("patient_id", ""),
        "age": data.get("age"),
        "gender": data.get("gender", ""),
        "hospital": data.get("hospital", ""),
        "insurance_provider": data.get("insurance_provider", ""),
        "policy_number": data.get("policy_number", ""),
        "tpa_name": data.get("tpa_name", ""),
        "diagnosis": data.get("diagnosis", ""),
        "status": "pre_auth_pending",
        "stage": 1,
        "pre_auth": {
            "documents": data.get("documents", []),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "submitted_at": _now(),
            "approved_amount": None,
            "approval_status": "pending",
            "approved_at": None,
            "remarks": "",
        },
        "admission": {},
        "enhancement": {"requested": False},
        "discharge": {},
        "payment": {},
        "settlement": {},
        "notes": data.get("notes", ""),
    }


def approve_preauth(case: dict, approved_amount: float, remarks: str = "") -> dict:
    """TPA approves pre-authorization with a covered amount."""
    case["status"] = "pre_auth_approved"
    case["stage"] = 1
    case["pre_auth"]["approval_status"] = "approved"
    case["pre_auth"]["approved_amount"] = approved_amount
    case["pre_auth"]["approved_at"] = _now()
    case["pre_auth"]["remarks"] = remarks
    return case


def reject_case(case: dict, reason: str = "") -> dict:
    """TPA rejects authorization."""
    case["status"] = "rejected"
    case["pre_auth"]["approval_status"] = "rejected"
    case["pre_auth"]["remarks"] = reason
    case["pre_auth"]["approved_at"] = _now()
    return case


# ─── STAGE 2: Admission ───────────────────────────────────────────────────────
def admit_patient(case: dict, diagnosis: str = "", ward: str = "") -> dict:
    """Patient is admitted — Admission Number generated."""
    if case["status"] != "pre_auth_approved":
        raise ValueError("Case must be pre-auth approved before admission.")
    case["status"] = "admitted"
    case["stage"] = 2
    case["diagnosis"] = diagnosis or case.get("diagnosis", "")
    case["admission"] = {
        "admission_number": _admission_number(),
        "admitted_at": _now(),
        "ward": ward,
        "diagnosis": diagnosis,
    }
    return case


# ─── STAGE 3: Enhancement ─────────────────────────────────────────────────────
def request_enhancement(case: dict, provisional_bill: float, reason: str = "", documents: list = None) -> dict:
    """Hospital raises an enhancement request if treatment cost increases. Can be called multiple times."""
    if case["status"] not in ("admitted", "enhancement_approved"):
        raise ValueError("Enhancement can only be raised for admitted patients.")
    
    prev_enh = case.get("enhancement", {})
    history = prev_enh.get("history", [])
    if prev_enh and prev_enh.get("requested"):
        history.append({
            "provisional_bill": prev_enh.get("provisional_bill"),
            "reason": prev_enh.get("reason"),
            "approved_amount": prev_enh.get("approved_amount"),
        })

    cumulative_approved = prev_enh.get("approved_amount", 0) or 0

    case["status"] = "enhancement_requested"
    case["stage"] = 3
    case["enhancement"] = {
        "requested": True,
        "provisional_bill": provisional_bill,
        "reason": reason,
        "documents": documents or [],
        "requested_at": _now(),
        "approved_amount": None,
        "previous_approved_amount": cumulative_approved,
        "history": history,
        "approved_at": None,
    }
    return case


def approve_enhancement(case: dict, approved_amount: float) -> dict:
    """TPA approves the new enhancement amount (added to previous)."""
    if case["status"] != "enhancement_requested":
        raise ValueError("No pending enhancement request found.")
    case["status"] = "enhancement_approved"
    
    prev = case["enhancement"].get("previous_approved_amount", 0) or 0
    case["enhancement"]["approved_amount"] = prev + approved_amount
    case["enhancement"]["approved_at"] = _now()
    return case


# ─── STAGE 4: Discharge Intimation ───────────────────────────────────────────
def send_discharge_intimation(case: dict, final_bill: float, documents: list = None) -> dict:
    """Hospital informs TPA that patient is ready for discharge with final bill."""
    if case["status"] not in ("admitted", "enhancement_approved"):
        raise ValueError("Patient must be admitted to initiate discharge.")
    case["status"] = "discharge_initiated"
    case["stage"] = 4
    case["discharge"] = {
        "final_bill": final_bill,
        "documents": documents or ["Discharge Summary", "Final Bill", "ICP"],
        "intimation_sent_at": _now(),
        "approval_status": "pending",
        "copay": None,
        "deductions": None,
        "approved_at": None,
        "tpa_payable": None,
    }
    return case


# ─── STAGE 5: Discharge Approval ─────────────────────────────────────────────
def approve_discharge(case: dict, copay: float, deductions: float, remarks: str = "") -> dict:
    """TPA gives final discharge approval with copay & deduction details."""
    if case["status"] != "discharge_initiated":
        raise ValueError("Discharge must be initiated first.")

    final_bill = case["discharge"].get("final_bill", 0)
    # TPA Payable = Final Bill - Copay - Deductions
    tpa_payable = max(0, final_bill - copay - deductions)

    case["status"] = "discharge_approved"
    case["stage"] = 5
    case["discharge"]["approval_status"] = "approved"
    case["discharge"]["copay"] = copay
    case["discharge"]["deductions"] = deductions
    case["discharge"]["tpa_payable"] = tpa_payable
    case["discharge"]["remarks"] = remarks
    case["discharge"]["approved_at"] = _now()
    return case


def hold_discharge(case: dict, reason: str = "") -> dict:
    """TPA puts discharge on hold for review."""
    case["status"] = "discharge_held"
    case["discharge"]["approval_status"] = "held"
    case["discharge"]["hold_reason"] = reason
    return case


def convert_self_pay(case: dict) -> dict:
    """Hospital forces a self-pay discharge if TPA puts it on hold."""
    if case["status"] != "discharge_held":
        raise ValueError("Must be on TPA hold to convert to self-pay.")
    final_bill = case["discharge"].get("final_bill", 0)
    case["status"] = "payment_done"
    case["stage"] = 6
    case["discharge"]["approval_status"] = "self_pay"
    case["discharge"]["copay"] = final_bill
    case["discharge"]["deductions"] = 0
    case["discharge"]["tpa_payable"] = 0
    case["payment"] = {
        "patient_paid": final_bill,
        "tpa_payable": 0,
        "total_bill": final_bill,
        "processed_at": _now(),
        "hard_copy_issued": True,
    }
    return case


# ─── STAGE 6: Payment ─────────────────────────────────────────────────────────
def process_payment(case: dict) -> dict:
    """Patient pays copay/deductions — hospital discharges patient."""
    if case["status"] != "discharge_approved":
        raise ValueError("Discharge must be approved before payment.")

    disc = case["discharge"]
    case["status"] = "payment_done"
    case["stage"] = 6
    case["payment"] = {
        # Patient pays Copay + Deductions (Non-medical/Disallowed)
        "patient_paid": (disc.get("copay") or 0) + (disc.get("deductions") or 0),
        "tpa_payable": disc.get("tpa_payable", 0),
        "total_bill": disc.get("final_bill", 0),
        "processed_at": _now(),
        "hard_copy_issued": True,
    }
    return case


# ─── STAGE 7: Settlement ──────────────────────────────────────────────────────
def record_settlement(case: dict, utr_number: str, utr_date: str, tds: float, final_paid: float, remarks: str = "") -> dict:
    """TPA sends settlement letter with UTR and final paid amount."""
    if case["status"] != "payment_done":
        raise ValueError("Payment must be processed before settlement.")
    case["status"] = "settled"
    case["stage"] = 7
    case["settlement"] = {
        "utr_number": utr_number,
        "utr_date": utr_date,
        "tds": tds,
        "final_paid": final_paid,
        "remarks": remarks,
        "settled_at": _now(),
    }
    return case


# ─── STAGE 8: Case Closure ────────────────────────────────────────────────────
def close_case(case: dict, bill_no: str = "", account_entry: str = "") -> dict:
    """Finance team closes the case after verifying settlement."""
    if case["status"] != "settled":
        raise ValueError("Case must be settled before closure.")
    case["status"] = "closed"
    case["stage"] = 8
    case["settlement"]["bill_no"] = bill_no
    case["settlement"]["account_entry"] = account_entry
    case["settlement"]["closed_at"] = _now()
    return case


# ─── COMPUTE SUMMARY ─────────────────────────────────────────────────────────
def get_case_summary(case: dict) -> dict:
    """Return a human-readable summary of the case's current financial state."""
    disc = case.get("discharge", {})
    pay  = case.get("payment", {})
    sett = case.get("settlement", {})
    pre  = case.get("pre_auth", {})
    enh  = case.get("enhancement", {})

    final_bill = float(disc.get("final_bill", 0) or 0)
    tpa_payable = float(disc.get("tpa_payable", 0) or 0)
    copay = float(disc.get("copay", 0) or 0)
    final_settled = float(sett.get("final_paid", 0) or 0)
    patient_paid = float(pay.get("patient_paid", 0) or 0)

    if case["status"] in ["settled", "closed"]:
        # After settlement, loss is any part of the bill not covered by patient OR TPA (including TDS)
        tds = float(sett.get("tds", 0) or 0)
        revenue_loss = max(0, final_bill - (final_settled + tds + patient_paid))
    elif case["status"] in ["discharge_approved", "payment_done"]:
        # Before settlement, loss is anything not covered by TPA Payable or Copay/Deductions
        # Since tpa_payable = final_bill - copay - deductions, loss should be 0 unless tpa_payable is less than expected
        revenue_loss = max(0, final_bill - (tpa_payable + copay + (float(disc.get("deductions", 0) or 0))))
    else:
        revenue_loss = 0

    return {
        "case_id": case["id"],
        "patient": case["patient_name"],
        "status": case["status"],
        "status_label": STATUS_LABELS.get(case["status"], case["status"]),
        "stage": case["stage"],
        "stage_label": STAGES.get(case["stage"], "Unknown"),
        "pre_auth_amount": pre.get("approved_amount", 0) or 0,
        "enhancement_amount": enh.get("approved_amount", 0) or 0,
        "final_bill": final_bill,
        "copay": copay,
        "deductions": float(disc.get("deductions", 0) or 0),
        "tpa_payable": tpa_payable,
        "patient_paid": patient_paid,
        "final_settled": final_settled,
        "utr_number": sett.get("utr_number", ""),
        "revenue_loss": revenue_loss,
    }
