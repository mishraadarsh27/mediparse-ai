import csv, io
from datetime import datetime

def export_to_csv(fields: dict) -> str:
    out = io.StringIO()
    w = csv.writer(out)
    
    w.writerow(["Category", "Field", "Value"])
    
    def write_section(category, data_dict):
        if not data_dict: return
        for k, v in data_dict.items():
            if v and v != "null":
                key_title = str(k).replace("_", " ").title()
                w.writerow([category, key_title, str(v)])

    write_section("Document Info", {"Document Type": fields.get("document_type")})
    write_section("Patient", fields.get("patient", {}))
    write_section("Hospital", fields.get("hospital", {}))
    write_section("Dates", fields.get("dates", {}))
    write_section("Diagnosis", fields.get("diagnosis", {}))
    write_section("Billing", fields.get("billing", {}))
    write_section("Insurance", fields.get("insurance", {}))
    
    meds = fields.get("medications", [])
    if meds:
        for i, m in enumerate(meds):
            val = f"{m.get('dosage','')} | {m.get('frequency','')} | {m.get('duration','')} | {m.get('route','')}".strip(" |")
            w.writerow(["Medication", m.get("name", f"Med {i+1}"), val])
            
    labs = fields.get("lab_tests", [])
    if labs:
        for i, l in enumerate(labs):
            val = f"{l.get('value','')} {l.get('unit','')} (Ref: {l.get('reference_range','')}) [{l.get('status','')}]".strip()
            w.writerow(["Lab Test", l.get("name", f"Test {i+1}"), val])
            
    procs = fields.get("procedures", [])
    if procs:
        for i, p in enumerate(procs):
            val = f"Date: {p.get('date','')} | Cost: {p.get('cost','')} | CPT: {p.get('cpt_code','')}".strip(" |")
            w.writerow(["Procedure", p.get("name", f"Proc {i+1}"), val])
            
    return out.getvalue()

def export_to_fhir_json(fields: dict) -> dict:
    """Produce a clean, beautifully structured JSON document."""
    return {
        "Document_Information": {
            "Type": fields.get("document_type"),
            "Date": fields.get("dates", {}).get("document_date")
        },
        "Patient_Demographics": fields.get("patient", {}),
        "Hospital_Details": fields.get("hospital", {}),
        "Clinical_Diagnosis": fields.get("diagnosis", {}),
        "Admissions_and_Dates": fields.get("dates", {}),
        "Billing_and_Financials": fields.get("billing", {}),
        "Insurance_Details": fields.get("insurance", {}),
        "Prescribed_Medications": fields.get("medications", []),
        "Laboratory_Tests": fields.get("lab_tests", []),
        "Procedures": fields.get("procedures", [])
    }
