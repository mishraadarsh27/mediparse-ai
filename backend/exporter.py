import csv, io
from datetime import datetime

def export_to_csv(fields: dict) -> str:
    out = io.StringIO()
    w = csv.writer(out)
    p = fields.get("patient",{}) or {}
    h = fields.get("hospital",{}) or {}
    d = fields.get("dates",{}) or {}
    diag = fields.get("diagnosis",{}) or {}
    b = fields.get("billing",{}) or {}
    ins = fields.get("insurance",{}) or {}

    w.writerow(["Field","Value"])
    for label, val in [
        ("document_type", fields.get("document_type")),
        ("patient_name", p.get("name")), ("dob", p.get("dob")),
        ("age", p.get("age")), ("gender", p.get("gender")),
        ("uhid", p.get("uhid")), ("contact", p.get("contact")),
        ("hospital", h.get("name")), ("doctor", h.get("doctor")),
        ("department", h.get("department")), ("ward_type", h.get("ward_type")),
        ("admission_date", d.get("admission_date")), ("discharge_date", d.get("discharge_date")),
        ("follow_up_date", d.get("follow_up_date")),
        ("primary_diagnosis", diag.get("primary")), ("icd10", diag.get("icd10_primary")),
        ("total_amount", b.get("total_amount")), ("amount_paid", b.get("amount_paid")),
        ("amount_due", b.get("amount_due")), ("gst", b.get("gst")),
        ("insurance_provider", ins.get("provider")), ("policy_number", ins.get("policy_number")),
        ("claim_number", ins.get("claim_number")), ("approved_amount", ins.get("approved_amount")),
    ]:
        w.writerow([label, val if val is not None else ""])

    labs = fields.get("lab_tests",[]) or []
    if labs:
        w.writerow([]); w.writerow(["--- LAB TESTS ---"])
        w.writerow(["Test","Value","Unit","Reference Range","Status"])
        for t in labs:
            w.writerow([t.get("name",""),t.get("value",""),t.get("unit",""),
                        t.get("reference_range",""),t.get("status","")])

    procs = fields.get("procedures",[]) or []
    if procs:
        w.writerow([]); w.writerow(["--- PROCEDURES ---"])
        w.writerow(["Procedure","CPT Code","Date","Cost"])
        for p2 in procs:
            w.writerow([p2.get("name",""),p2.get("cpt_code",""),p2.get("date",""),p2.get("cost","")])

    meds = fields.get("medications",[]) or []
    if meds:
        w.writerow([]); w.writerow(["--- MEDICATIONS ---"])
        w.writerow(["Medicine","Dosage","Frequency","Duration","Route"])
        for m in meds:
            w.writerow([m.get("name",""),m.get("dosage",""),m.get("frequency",""),
                        m.get("duration",""),m.get("route","")])
    return out.getvalue()

def export_to_fhir_json(fields: dict) -> dict:
    """Produce a FHIR-compatible QuestionnaireResponse-style document."""
    p = fields.get("patient",{}) or {}
    h = fields.get("hospital",{}) or {}
    d = fields.get("dates",{}) or {}
    diag = fields.get("diagnosis",{}) or {}
    b = fields.get("billing",{}) or {}
    ins = fields.get("insurance",{}) or {}
    labs = fields.get("lab_tests",[]) or []
    meds = fields.get("medications",[]) or []
    procs = fields.get("procedures",[]) or []

    return {
        "resourceType": "Bundle",
        "id": "mediparse-extraction",
        "meta": {"lastUpdated": datetime.utcnow().isoformat()},
        "type": "document",
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "identifier": [{"value": p.get("uhid")}],
                    "name": [{"text": p.get("name")}],
                    "birthDate": p.get("dob"),
                    "gender": (p.get("gender") or "unknown").lower(),
                    "telecom": [{"value": p.get("contact")}],
                    "address": [{"text": p.get("address")}],
                }
            },
            {
                "resource": {
                    "resourceType": "Encounter",
                    "status": "finished",
                    "class": {"code": h.get("ward_type","inpatient")},
                    "period": {"start": d.get("admission_date"), "end": d.get("discharge_date")},
                    "serviceProvider": {"display": h.get("name")},
                    "participant": [{"individual": {"display": h.get("doctor")}}],
                }
            },
            {
                "resource": {
                    "resourceType": "Condition",
                    "code": {
                        "coding": [{"system": "http://hl7.org/fhir/sid/icd-10",
                                    "code": diag.get("icd10_primary"),
                                    "display": diag.get("primary")}]
                    },
                    "subject": {"display": p.get("name")},
                }
            },
            {
                "resource": {
                    "resourceType": "DiagnosticReport",
                    "status": "final",
                    "effectiveDateTime": d.get("document_date"),
                    "result": [
                        {"display": f"{t.get('name')}: {t.get('value')} {t.get('unit') or ''} [{t.get('status')}]"}
                        for t in labs
                    ],
                }
            },
            {
                "resource": {
                    "resourceType": "Claim",
                    "status": "active",
                    "billablePeriod": {"start": d.get("admission_date"), "end": d.get("discharge_date")},
                    "total": {"value": b.get("total_amount"), "currency": "INR"},
                    "insurance": [{
                        "sequence": 1,
                        "focal": True,
                        "identifier": {"value": ins.get("policy_number")},
                        "coverage": {"display": ins.get("provider")},
                    }],
                    "item": [
                        {"sequence": i+1, "productOrService": {"text": pr.get("name")},
                         "unitPrice": {"value": pr.get("cost"), "currency": "INR"}}
                        for i, pr in enumerate(procs)
                    ],
                }
            },
            {
                "resource": {
                    "resourceType": "MedicationRequest",
                    "status": "active",
                    "subject": {"display": p.get("name")},
                    "contained": [
                        {"resourceType": "Medication",
                         "code": {"text": m.get("name")},
                         "dosage": m.get("dosage"),
                         "frequency": m.get("frequency")}
                        for m in meds
                    ],
                }
            }
        ]
    }
