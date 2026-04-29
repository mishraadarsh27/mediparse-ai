import io, base64, os, datetime
import pdfplumber
import fitz  # PyMuPDF
from groq import Groq
from PIL import Image

def log_event(msg):
    try:
        with open("extraction.log", "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().isoformat()
            f.write(f"[{ts}] {msg}\n")
    except:
        pass

def extract_text_from_pdf(file_bytes: bytes, filename: str = ""):
    is_image = filename.lower().endswith(('.png', '.jpg', '.jpeg'))
    log_event(f"Extracting: {filename} (size={len(file_bytes)})")
    
    # Use Groq Llama 3.2 11b Vision for optimized handwriting OCR
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        if is_image:
            img = Image.open(io.BytesIO(file_bytes))
        else:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            page = doc.load_page(0)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        if img.mode != 'RGB': img = img.convert('RGB')
        img.thumbnail((1200, 1200))
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        base64_img = base64.b64encode(buffered.getvalue()).decode('utf-8')

        prompt = "Transcribe this healthcare document. Focus on Rx (medicines) and Diagnosis. Output ONLY plain text transcription. Faithfully capture handwriting."

        response = client.chat.completions.create(
            model="llama-3.2-11b-vision-preview",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_img}"}}
                ]
            }],
            temperature=0.0
        )
        text = response.choices[0].message.content.strip()
        log_event(f"Groq OCR Success: {len(text)} chars extracted.")
        return text, "groq-vision-ocr"
    except Exception as e:
        log_event(f"Groq OCR Critical Error: {e}")
        if not is_image:
            return _extract_digital(file_bytes), "digital-fallback"
        return "Could not extract text", "failed"

def _extract_digital(pdf_bytes: bytes) -> str:
    parts = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t: parts.append(t)
    except Exception as e:
        log_event(f"Fallback Digital Error: {e}")
    return "\n".join(parts)