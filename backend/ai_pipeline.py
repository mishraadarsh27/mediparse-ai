import os, json, re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def _get_few_shot_examples(hint_text: str) -> str:
    """Pull 2 similar real documents from Supabase to use as few-shot examples."""
    try:
        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL",""), os.getenv("SUPABASE_KEY",""))
        # Fetch recent high-confidence documents as examples
        resp = sb.table("documents").select("raw_text,fields,confidence") \
                  .gte("confidence", 70) \
                  .order("confidence", desc=True) \
                  .limit(3).execute()
        examples = resp.data if resp.data else []
        if not examples:
            return ""
        
        shots = []
        for ex in examples[:2]:
            raw_snippet = (ex.get("raw_text") or "")[:800]
            fields_json = json.dumps(ex.get("fields",{}), indent=None, ensure_ascii=False)[:600]
            shots.append(
                f"=== EXAMPLE DOCUMENT (snippet) ===\n{raw_snippet}\n\n"
                f"=== CORRECT EXTRACTED JSON ===\n{fields_json}"
            )
        
        if shots:
            return "\n\nHere are real examples from similar Indian medical documents to guide your extraction:\n\n" + \
                   "\n\n---\n\n".join(shots) + \
                   "\n\n=== NOW EXTRACT THE FOLLOWING NEW DOCUMENT ===\n"
        return ""
    except Exception as e:
        print(f"[RAG] Could not fetch few-shot examples: {e}")
        return ""

PROMPT = """You are an advanced medical document analysis AI.
Extract ALL fields from the health document and return ONLY valid JSON. No markdown, no backticks.
If a field is not found, set it to null. Use [] for missing arrays.
CRITICAL INSTRUCTION: Analyze the document and assign the MOST ACCURATE "document_type" from this list: (Lab Report, Hospital Bill, Discharge Summary, Prescription, Insurance Form, Medical Record, or Other). If the text mentions 'DOCUMENT TYPE:' at the top, trust it.

Return this exact JSON structure:
{
  "document_type": "Lab Report|Hospital Bill|Discharge Summary|Prescription|Insurance Form|Other",
  "patient": {"name":null,"dob":null,"age":null,"gender":null,"uhid":null,"phone":null,"email":null,"address":null},
  "hospital": {"name":null,"doctor":null,"department":null,"ward_type":null,"registration_no":null},
  "dates": {"document_date":null,"admission_date":null,"discharge_date":null,"follow_up_date":null},
  "diagnosis": {"primary":null,"icd10_primary":null,"secondary":[],"icd10_secondary":[]},
  "procedures": [{"name":null,"cpt_code":null,"date":null,"cost":null}],
  "lab_tests": [{"name":null,"value":null,"unit":null,"reference_range":null,"status":null}],
  "medications": [{"name":null,"dosage":null,"frequency":null,"duration":null,"route":null}],
  "billing": {"total_amount":null,"amount_paid":null,"amount_due":null,"gst":null,"discount":null,"bill_number":null},
  "insurance": {"provider":null,"policy_number":null,"claim_number":null,"pre_auth_number":null,"approved_amount":null,"tpa_name":null},
  "special_instructions": null,
  "referring_doctor": null
}

HANDWRITING & RX INSTRUCTIONS:
1. If you see 'Rx', it denotes a prescription. The lines following it are medications. 
2. Examples: 'T Spenzo 1mg OD' -> {name: 'Spenzo', dosage: '1mg', frequency: 'Once Daily', route: 'Tablet'}.
3. 'Full Diagnosis' or 'Diagnosis' section must be captured in diagnosis.primary.
4. If patient info like Name, Age, or Gender is written in a box or next to 'NAME:', capture it perfectly.
5. Transcribe handwriting as accurately as possible. Do not guess, but look for medical context.

DOCUMENT TEXT:
"""

def run_extraction(raw_text: str) -> dict:
    few_shot = _get_few_shot_examples(raw_text)
    full_prompt = PROMPT + few_shot + raw_text[:12000]
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a specialized medical JSON parser. You never hallucinate. If a field is missing, use null. For Rx medicines, ensure Name, Dosage, and Frequency are extracted separately."},
                {"role": "user", "content": full_prompt}
            ],
            temperature=0.0,
        )
        text = response.choices[0].message.content.strip()
        return _parse_json(text)
    except Exception as e:
        print(f"[Groq] attempt failed: {e}")
        return _empty()

def _parse_json(text: str) -> dict:
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'^```\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    start = text.find('{')
    end = text.rfind('}') + 1
    if start >= 0 and end > start:
        text = text[start:end]
    return json.loads(text)

def _empty() -> dict:
    return {
        "document_type": "Other",
        "patient": {k: None for k in ["name","dob","age","gender","uhid","phone","email","address"]},
        "hospital": {k: None for k in ["name","doctor","department","ward_type","registration_no"]},
        "dates": {k: None for k in ["document_date","admission_date","discharge_date","follow_up_date"]},
        "diagnosis": {"primary": None, "icd10_primary": None, "secondary": [], "icd10_secondary": []},
        "procedures": [], "lab_tests": [], "medications": [],
        "billing": {k: None for k in ["total_amount","amount_paid","amount_due","gst","discount","bill_number"]},
        "insurance": {k: None for k in ["provider","policy_number","claim_number","pre_auth_number","approved_amount","tpa_name"]},
        "special_instructions": None, "referring_doctor": None,
    }