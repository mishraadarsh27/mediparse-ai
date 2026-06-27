import io
import os
import base64
import logging
from datetime import datetime

import pdfplumber
import fitz  # PyMuPDF
from groq import Groq
from PIL import Image

# ============================================
# CONFIGURATION CONSTANTS
# ============================================

VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
MAX_IMAGE_SIZE = int(os.getenv("MAX_IMAGE_SIZE", "1200"))
IMAGE_SCALE_FACTOR = int(os.getenv("IMAGE_SCALE_FACTOR", "2"))
OCR_TEMPERATURE = float(os.getenv("OCR_TEMPERATURE", "0.0"))
LOG_FILE = os.getenv("EXTRACTION_LOG_FILE", "extraction.log")

OCR_PROMPT = "Transcribe this healthcare document. Focus on Rx (medicines) and Diagnosis. Output ONLY plain text transcription. Faithfully capture handwriting."

# ============================================
# LOGGING SETUP
# ============================================

def log_event(msg: str) -> None:
    """Log extraction events to file."""
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            ts = datetime.now().isoformat()
            f.write(f"[{ts}] {msg}\n")
    except Exception as e:
        print(f"[LOG ERROR] Could not write to log file: {e}")

# ============================================
# IMAGE PROCESSING
# ============================================

def _prepare_image(file_bytes: bytes, is_image: bool) -> Image.Image:
    """Convert PDF page or image to RGB PIL Image."""
    if is_image:
        img = Image.open(io.BytesIO(file_bytes))
    else:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        page = doc.load_page(0)
        pix = page.get_pixmap(matrix=fitz.Matrix(IMAGE_SCALE_FACTOR, IMAGE_SCALE_FACTOR), alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    img.thumbnail((MAX_IMAGE_SIZE, MAX_IMAGE_SIZE))
    return img

def _image_to_base64(img: Image.Image) -> str:
    """Convert PIL Image to base64 string."""
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')

# ============================================
# OCR EXTRACTION
# ============================================

def extract_text_from_pdf(file_bytes: bytes, filename: str = "") -> tuple[str, str]:
    """
    Extract text from PDF or image using Groq Vision AI.
    
    Returns:
        tuple: (extracted_text, extraction_method)
    """
    is_image = filename.lower().endswith(('.png', '.jpg', '.jpeg'))
    log_event(f"Extracting: {filename} (size={len(file_bytes)})")
    
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        
        # Prepare image
        img = _prepare_image(file_bytes, is_image)
        base64_img = _image_to_base64(img)
        
        # Call Groq Vision API
        response = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": OCR_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{base64_img}"}}
                ]
            }],
            temperature=OCR_TEMPERATURE
        )
        
        text = response.choices[0].message.content.strip()
        log_event(f"Groq OCR Success: {len(text)} chars extracted.")
        return text, "groq-vision-ocr"
        
    except Exception as e:
        log_event(f"Groq OCR Critical Error: {e}")
        if not is_image:
            return _extract_digital(file_bytes), "digital-fallback"
        return "Could not extract text", "failed"

# ============================================
# DIGITAL TEXT EXTRACTION (FALLBACK)
# ============================================

def _extract_digital(pdf_bytes: bytes) -> str:
    """Extract text from digital PDF using pdfplumber."""
    parts = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    parts.append(text)
    except Exception as e:
        log_event(f"Fallback Digital Error: {e}")
    
    return "\n".join(parts)