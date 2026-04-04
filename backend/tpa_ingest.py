"""
MediParse AI — TPA Database Ingestion Script
=============================================
Processes TPA/Insurance PDFs and ingests them into Supabase.
These documents specifically improve claim reconciliation accuracy.
"""

import os, sys, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

TPA_FOLDER  = r"C:\Users\adars\Downloads\TPA-databases\masked_reports"
DELAY       = 4    # slightly longer delay for TPA docs (more complex)
SKIP_LARGE  = 10   # MB limit

sys.path.insert(0, os.path.dirname(__file__))
from extractor   import extract_text_from_pdf
from ai_pipeline import run_extraction
from validator   import validate_fields
from storage     import save_document, get_all_documents

def color(text, code): return f"\033[{code}m{text}\033[0m"
GREEN, RED, YELLOW, CYAN, BOLD = 92, 91, 93, 96, 1

def already_ingested():
    try:
        docs = get_all_documents()
        return {d["filename"] for d in docs}
    except Exception:
        return set()

def process_pdf(path: Path, idx: int, total: int):
    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"\n{color(f'[{idx}/{total}]', BOLD)} {color(path.name, CYAN)} ({size_mb:.1f} MB)")

    if size_mb > SKIP_LARGE:
        print(color(f"  ⚠ Skipped — too large ({size_mb:.1f} MB)", YELLOW))
        return "skipped_large"

    try:
        pdf_bytes = path.read_bytes()
        print(f"  ⟳ Extracting text...", end="", flush=True)
        raw_text, method = extract_text_from_pdf(pdf_bytes)

        if not raw_text.strip() or len(raw_text.strip()) < 30:
            print(color(" EMPTY", RED))
            return "empty"

        print(color(f" OK ({method}, {len(raw_text)} chars)", GREEN))
        print(f"  ⟳ Running AI extraction (TPA/Insurance mode)...", end="", flush=True)
        extracted = run_extraction(raw_text)
        validated, warnings, confidence = validate_fields(extracted)

        doc_type = validated.get("document_type", "Other")
        provider = (validated.get("insurance") or {}).get("provider") or \
                   (validated.get("hospital") or {}).get("name") or "Unknown TPA"
        print(color(f" OK — {doc_type} | {provider} | conf:{confidence}%", GREEN))

        print(f"  ⟳ Saving to Supabase...", end="", flush=True)
        doc_id = save_document(
            filename          = f"TPA_{path.name}",   # prefix to identify TPA source
            raw_text          = raw_text,
            extraction_method = method,
            extracted_fields  = validated,
            warnings          = warnings,
            confidence        = confidence,
        )
        print(color(f" Saved (id={doc_id})", GREEN))
        return "success"

    except KeyboardInterrupt:
        raise
    except Exception as e:
        print(color(f"\n  ✕ Error: {e}", RED))
        return "error"

def main():
    print(color("\n╔══════════════════════════════════════════════╗", BOLD))
    print(color( "║  MediParse AI — TPA Database Ingestion       ║", BOLD))
    print(color( "╚══════════════════════════════════════════════╝\n", BOLD))

    folder = Path(TPA_FOLDER)
    all_pdfs = sorted(folder.glob("*.pdf"))
    print(f"  Found {color(str(len(all_pdfs)), CYAN)} TPA PDFs.")

    ingested = already_ingested()
    to_process = [p for p in all_pdfs if f"TPA_{p.name}" not in ingested]
    print(f"  Will process: {color(str(len(to_process)), CYAN)} new TPA files\n")

    if not to_process:
        print(color("  ✓ All TPA files already ingested!", GREEN))
        return

    stats = {"success": 0, "error": 0, "empty": 0, "skipped_large": 0}
    start = time.time()

    for i, pdf_path in enumerate(to_process, 1):
        result = process_pdf(pdf_path, i, len(to_process))
        stats[result] = stats.get(result, 0) + 1
        if i < len(to_process):
            print(f"  ⏱ Waiting {DELAY}s...", end="\r")
            time.sleep(DELAY)

    elapsed = time.time() - start
    print(color("\n\n═══════════ TPA INGESTION COMPLETE ═══════════", BOLD))
    print(f"  ✓ Success:       {color(str(stats['success']), GREEN)}")
    print(f"  ✕ Errors:        {color(str(stats['error']), RED)}")
    print(f"  ⊘ Skipped:       {stats.get('skipped_large',0) + stats.get('empty',0)}")
    print(f"  ⏱ Time:          {elapsed:.0f}s")
    print(color("✨ TPA data ready — Claim Reconciliation Engine turbo-charged!", GREEN))

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(color("\n\n  ⚡ Interrupted. Progress saved.", YELLOW))
