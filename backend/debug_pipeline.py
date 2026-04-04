import time, sys, os
from extractor import extract_text_from_pdf
from ai_pipeline import run_extraction
from storage import save_document

# create a dummy pdf in memory
import reportlab.pdfgen.canvas as canvas
import io
pdf_bytes = io.BytesIO()
c = canvas.Canvas(pdf_bytes)
c.drawString(100, 100, "Patient Name: Rajesh Kumar\nHospital: Max\nTotal Bill: 45000")
c.save()
doc_bytes = pdf_bytes.getvalue()

print("[1] Testing Extractor...")
t0 = time.time()
try:
    text, method = extract_text_from_pdf(doc_bytes)
    print(f"Extracted {len(text)} chars in {time.time()-t0:.2f}s")
except Exception as e:
    print("Extractor Failed:", e)
    sys.exit(1)

print("[2] Testing AI Pipeline...")
t0 = time.time()
try:
    res = run_extraction(text)
    print(f"Extracted {len(str(res))} chars in {time.time()-t0:.2f}s")
except Exception as e:
    print("AI Pipeline Failed:", e)
    sys.exit(1)

print("[3] Testing Storage (Supabase)...")
t0 = time.time()
try:
    save_document("dummy.pdf", text, method, res, [], 90)
    print(f"Storage Saved in {time.time()-t0:.2f}s")
except Exception as e:
    print("Storage Failed:", e)
    sys.exit(1)

print("ALL PASSED!")
