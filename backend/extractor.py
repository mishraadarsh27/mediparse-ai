import io, base64, os
import pdfplumber
import fitz  # PyMuPDF
from groq import Groq

# Enabled Native Groq Vision OCR Support
OCR_AVAILABLE = True
print("[INFO] Hardware OCR + AI Vision Engine Enabled")

def extract_text_from_pdf(pdf_bytes: bytes):
    # Step 1: Attempt standard digital text extraction
    text = _extract_digital(pdf_bytes)
    if text and len(text.strip()) > 100:
        return text, "digital"
    
    # Step 2: Fallback to AI Vision if scanned image / handwritten
    print("[INFO] Scanned/Handwritten Document Detected. Triggering Llama-3 Vision OCR...")
    try:
        vision_text = _extract_vision_ocr(pdf_bytes)
        if vision_text and len(vision_text.strip()) > 10:
            return vision_text, "vision-ocr"
    except Exception as e:
        print(f"[ERROR] Vision OCR failed: {e}")

    return text or "Could not extract text", "digital"

def _extract_digital(pdf_bytes: bytes) -> str:
    parts = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t: parts.append(t)
                for table in page.extract_tables() or []:
                    for row in table:
                        parts.append(" | ".join(c.strip() if c else "" for c in row))
    except Exception as e:
        print(f"[pdfplumber error] {e}")
    return "\n".join(parts)

def _extract_vision_ocr(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if len(doc) == 0: return ""
    
    full_text = []
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Process ONLY the first page for blistering speed to avoid frontend timeout
    for i in range(min(1, len(doc))):
        page = doc.load_page(i)
        # Apply standard 1.2x zoom for fast transmission (avoids massive base64 payload lag)
        mat = fitz.Matrix(1.2, 1.2)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        base64_img = base64.b64encode(img_bytes).decode('utf-8')

        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract all text exactly as written from this medical document scan. If there is handwriting (e.g. doctor's prescription), transcribe it as accurately as possible line by line. IMPORTANT: Analyze the visual structure and explicitly state the document type at the very top (e.g., 'DOCUMENT TYPE: PRESCRIPTION' or 'DOCUMENT TYPE: LAB REPORT'). Then output the full extracted text."},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_img}"}}
                ]
            }],
            temperature=0.1,
            max_tokens=4000
        )
        full_text.append(response.choices[0].message.content.strip())
        
    return "\n\n".join(full_text)