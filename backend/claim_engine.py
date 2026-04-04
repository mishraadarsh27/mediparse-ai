def generate_claim(data):
    billing = data.get("billing", {})
    patient = data.get("patient", {})
    diagnosis = data.get("diagnosis", {})
    procedures = data.get("procedures", [])

    try:
        bill = float(billing.get("total_amount") or 0)
    except (ValueError, TypeError):
        bill = 0.0

    claim = {
        "patient_name": patient.get("name"),
        "diagnosis": diagnosis.get("primary") or diagnosis.get("icd10_primary"),
        "procedures": [p.get("cpt_code") for p in procedures if isinstance(p, dict) and p.get("cpt_code")],
        "total_bill": bill,
        "insurance": "Star Health",
        "approved_claim": round(bill * 0.8, 2)
    }

    return claim


def reconcile(bill, claim):
    try:
        b = float(bill or 0)
        c = float(claim or 0)
    except (ValueError, TypeError):
        b = 0.0
        c = 0.0
        
    return {
        "bill": b,
        "claim": c,
        "loss": round(b - c, 2),
        "status": "Mismatch" if b != c else "Matched"
    }
