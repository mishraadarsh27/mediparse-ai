from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn, io, json
from datetime import datetime
from typing import List

from extractor import extract_text_from_pdf
from ai_pipeline import run_extraction
from validator import validate_fields
from storage import save_document, get_all_documents, get_document_by_id, get_stats, delete_document, save_claim
from exporter import export_to_csv, export_to_fhir_json
from claim_engine import generate_claim, reconcile
import google.generativeai as genai
from groq import Groq
import os

app = FastAPI(title="MediParse AI", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup_event():
    from storage import test_connection
    test_connection()

@app.get("/")
def root():
    return {"status": "MediParse AI v2.0", "time": datetime.utcnow().isoformat()}

async def _process_file(filename: str, contents: bytes) -> dict:
    raw_text, method = extract_text_from_pdf(contents)
    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF.")
    extracted  = run_extraction(raw_text)
    validated, warnings, confidence = validate_fields(extracted)
    
    claim = generate_claim(validated)
    revenue = reconcile(
        bill=claim["total_bill"],
        claim=claim["approved_claim"]
    )
    save_claim(claim)
    
    doc_id = save_document(
        filename=filename, raw_text=raw_text,
        extraction_method=method, extracted_fields=validated,
        warnings=warnings, confidence=confidence,
    )
    return {
        "id": doc_id, "filename": filename,
        "extraction_method": method, "fields": validated,
        "warnings": warnings, "confidence": confidence,
        "uploaded_at": datetime.utcnow().isoformat(),
        "claim": claim,
        "revenue_analysis": revenue
    }

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files supported.")
    return await _process_file(file.filename, await file.read())

@app.post("/api/upload/batch")
async def upload_batch(files: List[UploadFile] = File(...)):
    if len(files) > 10:
        raise HTTPException(400, "Max 10 files per batch.")
    results = []
    for f in files:
        try:
            contents = await f.read()
            results.append(await _process_file(f.filename, contents))
        except Exception as e:
            results.append({"filename": f.filename, "error": str(e)})
    return {"batch_size": len(files), "results": results}

@app.get("/api/stats")
def analytics():
    return get_stats()

@app.get("/api/documents")
def list_documents():
    return get_all_documents()

@app.get("/api/documents/{doc_id}")
def get_document(doc_id: str):
    doc = get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(404, "Not found")
    
    claim = generate_claim(doc.get("fields", {}))
    revenue = reconcile(
        bill=claim["total_bill"],
        claim=claim["approved_claim"]
    )
    doc["claim"] = claim
    doc["revenue_analysis"] = revenue
    return doc

@app.delete("/api/documents/{doc_id}")
def remove_document(doc_id: str):
    if not delete_document(doc_id):
        raise HTTPException(404, "Not found")
    return {"deleted": doc_id}

@app.get("/api/documents/{doc_id}/export/csv")
def export_csv(doc_id: str):
    doc = get_document_by_id(doc_id)
    if not doc: raise HTTPException(404, "Not found")
    return StreamingResponse(io.StringIO(export_to_csv(doc["fields"])),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=mediparse_{doc_id}.csv"})

@app.get("/api/documents/{doc_id}/export/json")
def export_json_fhir(doc_id: str):
    doc = get_document_by_id(doc_id)
    if not doc: raise HTTPException(404, "Not found")
    return StreamingResponse(io.StringIO(json.dumps(export_to_fhir_json(doc["fields"]), indent=2)),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=mediparse_{doc_id}_fhir.json"})

@app.put("/api/documents/{doc_id}/fields")
def update_fields(doc_id: str, payload: dict):
    from storage import update_document_fields
    if not update_document_fields(doc_id, payload):
        raise HTTPException(500, "Failed to update record")
    return {"status": "success", "message": "Feedback loop synchronized"}


# ═══════════════════════════════════════════════════════════════════════════════
# RCM WORKFLOW ROUTES
# Full Revenue Cycle Management: PreAuth → Admission → Enhancement →
#   Discharge → Payment → Settlement → Closure
# ═══════════════════════════════════════════════════════════════════════════════
from rcm_engine import (
    create_case, approve_preauth, reject_case, admit_patient,
    request_enhancement, approve_enhancement,
    send_discharge_intimation, approve_discharge, hold_discharge, convert_self_pay,
    process_payment, record_settlement, close_case,
    get_case_summary, STAGES, STATUS_LABELS
)
from rcm_storage import (
    save_case as rcm_save, update_case as rcm_update,
    get_all_cases, get_case, delete_case as rcm_delete
)

@app.post("/api/rcm/cases")
def create_rcm_case(payload: dict):
    """Stage 1 — Create new case and submit for Pre-Authorization."""
    case = create_case(payload)
    rcm_save(case)
    return {**case, "summary": get_case_summary(case)}

@app.get("/api/rcm/cases")
def list_rcm_cases():
    """Get all RCM cases ordered by creation date."""
    cases = get_all_cases()
    return [{"id": c["id"], "patient_name": c["patient_name"],
             "status": c["status"], "stage": c["stage"],
             "status_label": STATUS_LABELS.get(c["status"], c["status"]),
             "stage_label": STAGES.get(c["stage"], ""),
             "hospital": c.get("hospital",""), "tpa_name": c.get("tpa_name",""),
             "insurance_provider": c.get("insurance_provider",""),
             "created_at": c.get("created_at",""),
             "summary": get_case_summary(c)} for c in cases]

@app.get("/api/rcm/cases/{case_id}")
def get_rcm_case(case_id: str):
    """Get full case details with summary."""
    case = get_case(case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    return {**case, "summary": get_case_summary(case)}

@app.delete("/api/rcm/cases/{case_id}")
def delete_rcm_case(case_id: str):
    if not rcm_delete(case_id):
        raise HTTPException(404, "Case not found")
    return {"deleted": case_id}

@app.post("/api/rcm/cases/{case_id}/approve-preauth")
def approve_preauth_route(case_id: str, payload: dict):
    """Stage 1 → TPA approves pre-authorization."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    case = approve_preauth(case, payload.get("approved_amount", 0), payload.get("remarks",""))
    rcm_update(case_id, {"status": case["status"], "pre_auth": case["pre_auth"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/reject")
def reject_route(case_id: str, payload: dict):
    """Stage 1 → TPA rejects authorization."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    case = reject_case(case, payload.get("reason",""))
    rcm_update(case_id, {"status": case["status"], "pre_auth": case["pre_auth"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/admit")
def admit_route(case_id: str, payload: dict):
    """Stage 2 → Admit patient after pre-auth approval."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = admit_patient(case, payload.get("diagnosis",""), payload.get("ward","General"))
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"],
                          "admission": case["admission"], "diagnosis": case.get("diagnosis","")})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/enhancement")
def enhancement_route(case_id: str, payload: dict):
    """Stage 3 → Hospital raises enhancement request."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = request_enhancement(case, payload.get("provisional_bill",0), payload.get("reason",""), payload.get("documents"))
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "enhancement": case["enhancement"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/approve-enhancement")
def approve_enhancement_route(case_id: str, payload: dict):
    """Stage 3 → TPA approves enhancement amount."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = approve_enhancement(case, payload.get("approved_amount",0))
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "enhancement": case["enhancement"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/discharge-intimation")
def discharge_intimation_route(case_id: str, payload: dict):
    """Stage 4 → Hospital sends discharge intimation with final bill."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = send_discharge_intimation(case, payload.get("final_bill",0), payload.get("documents"))
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "discharge": case["discharge"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/discharge-approval")
def discharge_approval_route(case_id: str, payload: dict):
    """Stage 5 → TPA gives final discharge approval with copay & deductions."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = approve_discharge(case, payload.get("copay",0), payload.get("deductions",0), payload.get("remarks",""))
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "discharge": case["discharge"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/discharge-hold")
def discharge_hold_route(case_id: str, payload: dict):
    """Stage 5 → TPA holds discharge for review."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    case = hold_discharge(case, payload.get("reason",""))
    rcm_update(case_id, {"status": case["status"], "discharge": case["discharge"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/convert-self-pay")
def convert_self_pay_route(case_id: str):
    """Stage 5 → Hospital forcibly converts to self-pay during TPA hold."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = convert_self_pay(case)
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "discharge": case["discharge"], "payment": case["payment"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/payment")
def payment_route(case_id: str):
    """Stage 6 → Patient pays copay/deductions — discharge processed."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = process_payment(case)
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "payment": case["payment"]})
    return {**case, "summary": get_case_summary(case)}

@app.post("/api/rcm/cases/{case_id}/settlement")
def settlement_route(case_id: str, payload: dict):
    """Stage 7 → TPA sends settlement with UTR number."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = record_settlement(
            case,
            utr_number=payload.get("utr_number",""),
            utr_date=payload.get("utr_date",""),
            tds=payload.get("tds",0),
            final_paid=payload.get("final_paid",0),
            remarks=payload.get("remarks","")
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "settlement": case["settlement"]})
    
    send_automated_notification(case)

    return {**case, "summary": get_case_summary(case)}

# ─── EMAIL / SMS MOCK NOTIFICATION ──────────────────────────────────────────────
def send_automated_notification(case: dict):
    email = case.get("pre_auth", {}).get("email", "")
    phone = case.get("pre_auth", {}).get("phone", "")
    patient = case.get("patient_name", "Valued Patient")
    utr = case.get("settlement", {}).get("utr_number", "N/A")
    date = case.get("settlement", {}).get("utr_date", "N/A")
    amount = case.get("settlement", {}).get("final_paid", 0)

    if not email and not phone: return # Nothing to send to

    import datetime
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    msg = f"""
============================================================
[AUTOMATED MAIL / SMS] - Sent at {timestamp}
To: {patient} | Email: {email} | Phone: {phone}
From: no-reply@mediparse.ai
Subject: MediParse AI - Insurance Claim Settled!

Dear {patient},

We are pleased to inform you that your insurance claim has been fully settled by the TPA.
The payment of ₹{amount} has been processed successfully to the hospital.

Details of Settlement:
- UTR Number: {utr}
- Transaction Date: {date}
- Total Final Paid Amount: ₹{amount}

Thank you for using the MediParse AI Platform for a seamless health insurance experience.
============================================================
"""
    print(msg)
    try:
        with open("automated_notifications.log", "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception as e:
        print("Failed to save automated notification to log.", repr(e))

@app.get("/api/rcm/export/csv")
def export_rcm_csv():
    """Export all RCM case details for Excel analysis."""
    import pandas as pd
    import io
    
    cases = get_all_cases()
    if not cases:
        # Return empty CSV with headers
        headers = ["Case ID", "Patient Name", "Stage", "Status", "Final Bill", "Copay", "Deductions", "TPA Payable", "Patient Paid", "Final Settled", "TDS", "Revenue Loss"]
        return StreamingResponse(io.StringIO(",".join(headers)), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=rcm_report.csv"})
    
    flat_data = []
    for c in cases:
        sum_data = get_case_summary(c)
        flat_data.append({
            "Case ID": c.get("id"),
            "Patient Name": c.get("patient_name"),
            "Stage": f"Stage {c.get('stage')}",
            "Status": STATUS_LABELS.get(c.get("status"), c.get("status")),
            "Hospital": c.get("hospital"),
            "TPA": c.get("tpa_name"),
            "Diagnosis": c.get("diagnosis"),
            "Final Bill": sum_data.get("final_bill", 0),
            "Copay": sum_data.get("copay", 0),
            "Deductions": sum_data.get("deductions", 0),
            "TPA Payable (Expected)": sum_data.get("tpa_payable", 0),
            "Patient Paid": sum_data.get("patient_paid", 0),
            "Final Settled (UTR Amt)": sum_data.get("final_settled", 0),
            "TDS": c.get("settlement", {}).get("tds", 0),
            "Revenue Loss": sum_data.get("revenue_loss", 0),
            "UTR Number": sum_data.get("utr_number"),
            "UTR Date": c.get("settlement", {}).get("utr_date"),
            "Deduction Reason": c.get("discharge", {}).get("remarks"),
            "Settlement Remarks": c.get("settlement", {}).get("remarks")
        })
    
    df = pd.DataFrame(flat_data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    return StreamingResponse(
        io.StringIO(stream.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mediparse_rcm_report.csv"}
    )


@app.post("/api/rcm/cases/{case_id}/close")
def close_route(case_id: str, payload: dict):
    """Stage 8 → Finance closes the case after settlement verification."""
    case = get_case(case_id)
    if not case: raise HTTPException(404, "Case not found")
    try:
        case = close_case(case, payload.get("bill_no",""), payload.get("account_entry",""))
    except ValueError as e:
        raise HTTPException(400, str(e))
    rcm_update(case_id, {"status": case["status"], "stage": case["stage"], "settlement": case["settlement"]})
    return {**case, "summary": get_case_summary(case)}

@app.get("/api/rcm/stats")
def rcm_stats():
    """RCM analytics — case counts by stage and revenue summary."""
    cases = get_all_cases()
    total = len(cases)
    by_status = {}
    total_billed = total_settled = total_loss = 0
    for c in cases:
        s = c.get("status","unknown")
        by_status[s] = by_status.get(s, 0) + 1
        summary = get_case_summary(c)
        total_billed  += summary.get("final_bill", 0)
        total_settled += summary.get("final_settled", 0)
        total_loss    += summary.get("revenue_loss", 0)
    return {
        "total_cases": total,
        "by_status": by_status,
        "open_cases": sum(v for k, v in by_status.items() if k not in ("closed","rejected")),
        "closed_cases": by_status.get("closed", 0),
        "rejected_cases": by_status.get("rejected", 0),
        "revenue": {
            "total_billed": total_billed,
            "total_settled": total_settled,
            "total_loss": total_loss,
        }
    }



# ═══════════════════════════════════════════════════════════════════════════════
# HELPBOT — AI ASSISTANT FOR MEDIPARSE AI
# ═══════════════════════════════════════════════════════════════════════════════

CHATBOT_SYSTEM_PROMPT = """
You are HELPBOT, a premium, multilingual AI medical and insurance expert for the MediParse AI platform. 

KNOWLEDGE BASE:
1. MediParse AI: Next-Gen Medical Data Extraction (OCR) and Revenue Cycle Management (RCM). 
   - Workflow: Stage 1 (Pre-Auth), Stage 2 (Admission), Stage 3 (Enhancement), Stage 4 (Discharge Intimation), Stage 5 (Discharge Approval), Stage 6 (Payment), Stage 7 (Settlement), Stage 8 (Closure).
2. Medical Knowledge: You have expert-level knowledge of medical terminology, symptoms, ICD codes, and healthcare processes.
3. Insurance Knowledge: You understand health insurance policies, claims, TPAs, copayment, deductions, and settlements.
4. Languages: You are expert in both English and Hindi/Hinglish. Reply in the same language the user uses.

GUIDELINES:
- Provide helpful advice for using current MediParse platform features.
- Answer general medical and insurance queries clearly.
- If asked "KAISE KAREIN?", answer in Hindi. If "HOW TO?", answer in English.
- Always be professional, empathetic, and premium.
"""

@app.post("/api/chatbot")
async def helpbot_chat(payload: dict):
    user_message = payload.get("message")
    if not user_message: raise HTTPException(400, "Message is required")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key: return {"reply": "❌ GEMINI_API_KEY not found in settings."}

    try:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            return {"reply": "❌ GROQ_API_KEY not found in settings. Switching to Groq for better reliability."}
            
        client = Groq(api_key=groq_api_key)
        
        # Using llama-3.3-70b-versatile for high quality medical/insurance answers
        # Previous llama-3.1-70b was decommissioned, 3.3 is the latest version.
        
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": CHATBOT_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2048,
        )
        
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        print(f"[HELPBOT] ❌ Error: {e}")
        return {"reply": f"⚠️ Error: {str(e)[:100]}. Groq connection failed."}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
