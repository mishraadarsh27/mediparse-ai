"""
MediParse AI — Batch Dataset Ingestion Script
=============================================
Processes all PDFs from a folder through the full AI pipeline
and saves results to Supabase for few-shot RAG enhancement.

Usage:
    python batch_ingest.py
"""

import os, sys, time, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DATASET_FOLDER = r"C:\Users\adars\Downloads\New Diagnostic Reports-20260325T175427Z-3-001\New Diagnostic Reports"
DELAY_BETWEEN_CALLS = 6   # increased delay for Groq rate limit safety
SKIP_LARGE_MB       = 6   # skip files larger than this (MB) to avoid timeout
MAX_FILES           = 60  # safety cap

# ── Import pipeline modules ──────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))
from extractor    import extract_text_from_pdf
from ai_pipeline  import run_extraction
from validator    import validate_fields
from storage      import save_document, get_all_documents

# ── Helpers ──────────────────────────────────────────────────────────────────
def color(text, code): return f"\033[{code}m{text}\033[0m"
GREEN, RED, YELLOW, CYAN, BOLD = 92, 91, 93, 96, 1

def already_ingested():
    """Return set of filenames already in Supabase so we don't re-process."""
    try:
        docs = get_all_documents()
        return {d["filename"] for d in docs}
    except Exception:
        return set()

def process_pdf(path: Path, idx: int, total: int):
    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"\n{color(f'[{idx}/{total}]', BOLD)} {color(path.name, CYAN)} ({size_mb:.1f} MB)")

    if size_mb > SKIP_LARGE_MB:
        print(color(f"  ⚠ Skipped — file too large ({size_mb:.1f} MB > {SKIP_LARGE_MB} MB limit)", YELLOW))
        return "skipped_large"

    try:
        pdf_bytes = path.read_bytes()
        print(f"  ⟳ Extracting text...", end="", flush=True)
        raw_text, method = extract_text_from_pdf(pdf_bytes)

        if not raw_text.strip() or len(raw_text.strip()) < 30:
            print(color(" EMPTY", RED))
            return "empty"

        print(color(f" OK ({method}, {len(raw_text)} chars)", GREEN))
        print(f"  ⟳ Running AI extraction (Llama-3)...", end="", flush=True)
        
        # Retry up to 2 times on rate limit
        extracted = None
        for attempt in range(3):
            try:
                extracted = run_extraction(raw_text)
                break
            except Exception as retry_err:
                if 'rate_limit' in str(retry_err).lower() and attempt < 2:
                    wait = (attempt + 1) * 10
                    print(color(f" Rate limit, waiting {wait}s...", YELLOW), end="", flush=True)
                    time.sleep(wait)
                else:
                    raise
        if not extracted: raise Exception("All retries failed")
        validated, warnings, confidence = validate_fields(extracted)

        doc_type = validated.get("document_type", "Other")
        patient  = (validated.get("patient") or {}).get("name") or "Unknown"
        print(color(f" OK — {doc_type} | {patient} | conf:{confidence}%", GREEN))

        print(f"  ⟳ Saving to Supabase...", end="", flush=True)
        doc_id = save_document(
            filename         = path.name,
            raw_text         = raw_text,
            extraction_method= method,
            extracted_fields = validated,
            warnings         = warnings,
            confidence       = confidence,
        )
        print(color(f" Saved (id={doc_id})", GREEN))
        return "success"

    except KeyboardInterrupt:
        raise
    except Exception as e:
        print(color(f"\n  ✕ Error: {e}", RED))
        return "error"

# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    print(color("\n╔══════════════════════════════════════════════╗", BOLD))
    print(color( "║   MediParse AI — Batch Dataset Ingestion     ║", BOLD))
    print(color( "╚══════════════════════════════════════════════╝\n", BOLD))

    folder = Path(DATASET_FOLDER)
    if not folder.exists():
        print(color(f"✕ Folder not found: {folder}", RED))
        sys.exit(1)

    all_pdfs = sorted(folder.glob("*.pdf"))[:MAX_FILES]
    print(f"  Found {color(str(len(all_pdfs)), CYAN)} PDFs in dataset folder.")

    print(f"  Checking Supabase for already-ingested files...", end="", flush=True)
    ingested = already_ingested()
    print(color(f" {len(ingested)} already in DB", GREEN))

    to_process = [p for p in all_pdfs if p.name not in ingested]
    print(f"  Will process: {color(str(len(to_process)), CYAN)} new files\n")

    if not to_process:
        print(color("  ✓ All files already ingested! Nothing to do.", GREEN))
        return

    stats = {"success": 0, "error": 0, "empty": 0, "skipped_large": 0}
    start = time.time()

    for i, pdf_path in enumerate(to_process, 1):
        result = process_pdf(pdf_path, i, len(to_process))
        stats[result] = stats.get(result, 0) + 1

        # Rate limit cooldown between calls
        if i < len(to_process):
            print(f"  ⏱ Waiting {DELAY_BETWEEN_CALLS}s (rate limit)...", end="\r")
            time.sleep(DELAY_BETWEEN_CALLS)

    elapsed = time.time() - start
    print(color("\n\n═══════════ INGESTION COMPLETE ═══════════", BOLD))
    print(f"  ✓ Success:       {color(str(stats['success']), GREEN)}")
    print(f"  ✕ Errors:        {color(str(stats['error']), RED)}")
    print(f"  ⊘ Empty:         {stats['empty']}")
    print(f"  ⊘ Skipped large: {stats['skipped_large']}")
    print(f"  ⏱ Total time:    {elapsed:.0f}s ({elapsed/60:.1f} min)")
    print(color("══════════════════════════════════════════\n", BOLD))
    print(color("  ✨ Supabase now has real-world training data!", GREEN))
    print(color("  ✨ MediParse AI will now use RAG few-shot on every new upload.", GREEN))

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(color("\n\n  ⚡ Interrupted by user. Progress saved to Supabase.", YELLOW))
