"""
MediParse AI — New Discharge Summary Dataset Ingestion
======================================================
72 Discharge Summary PDFs from the second dataset batch.
Run AFTER jilo_ingest.py completes.

Usage:
    python discharge_ingest.py
"""

import os, sys, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

FOLDER     = r"C:\Users\adars\Downloads\New Discharge Summary-20260328T095356Z-3-001\New Discharge Summary"
PREFIX     = "DS2_"
DOC_TYPE   = "Discharge Summary"
DELAY      = 5
SKIP_LARGE = 5   # MB — skip very large scanned files

sys.path.insert(0, os.path.dirname(__file__))
from extractor   import extract_text_from_pdf
from ai_pipeline import run_extraction
from validator   import validate_fields
from storage     import save_document, get_all_documents

def color(text, code): return f"\033[{code}m{text}\033[0m"
GREEN, RED, YELLOW, CYAN, BOLD = 92, 91, 93, 96, 1

def already_ingested():
    try: return {d["filename"] for d in get_all_documents()}
    except: return set()

def process(path: Path, idx: int, total: int):
    size_mb = path.stat().st_size / (1024*1024)
    print(f"\n  {color(f'[{idx}/{total}]', BOLD)} {color(path.name, CYAN)} ({size_mb:.2f} MB)")

    if size_mb > SKIP_LARGE:
        print(color(f"    ⚠ Skipped — {size_mb:.1f} MB > {SKIP_LARGE} MB limit", YELLOW))
        return "skipped"

    try:
        print(f"    ⟳ Extracting...", end="", flush=True)
        raw_text, method = extract_text_from_pdf(path.read_bytes())

        if not raw_text or len(raw_text.strip()) < 20:
            print(color(" EMPTY", RED)); return "empty"

        hinted = f"DOCUMENT TYPE: {DOC_TYPE}\n\n{raw_text}"
        print(color(f" {method} ({len(raw_text)} chars)", GREEN))

        print(f"    ⟳ AI Extraction...", end="", flush=True)
        extracted = None
        for attempt in range(3):
            try:
                extracted = run_extraction(hinted)
                extracted["document_type"] = DOC_TYPE
                break
            except Exception as e:
                if 'rate_limit' in str(e).lower() and attempt < 2:
                    wait = (attempt+1) * 15
                    print(color(f" ⏳{wait}s...", YELLOW), end="", flush=True)
                    time.sleep(wait)
                else: raise

        if not extracted: raise Exception("All retries failed")
        validated, warnings, confidence = validate_fields(extracted)
        patient = (validated.get("patient") or {}).get("name") or "—"
        print(color(f" {DOC_TYPE} | {patient} | conf:{confidence}%", GREEN))

        print(f"    ⟳ Saving...", end="", flush=True)
        doc_id = save_document(
            filename=PREFIX + path.name, raw_text=raw_text,
            extraction_method=method, extracted_fields=validated,
            warnings=warnings, confidence=confidence,
        )
        print(color(f" id={doc_id} ✓", GREEN))
        return "success"

    except KeyboardInterrupt: raise
    except Exception as e:
        print(color(f"\n    ✕ {e}", RED)); return "error"

def main():
    print(color("\n╔══════════════════════════════════════════════╗", BOLD))
    print(color( "║  MediParse AI — Discharge Summary Batch 2    ║", BOLD))
    print(color( "╚══════════════════════════════════════════════╝\n", BOLD))

    folder   = Path(FOLDER)
    all_pdfs = sorted(folder.glob("*.pdf"))
    ingested = already_ingested()
    to_proc  = [p for p in all_pdfs if (PREFIX + p.name) not in ingested]

    print(f"  Found {color(str(len(all_pdfs)), CYAN)} total | "
          f"{color(str(len(to_proc)), GREEN)} new to process\n")

    if not to_proc:
        print(color("  ✓ All already ingested!", GREEN)); return

    stats = {"success":0,"error":0,"empty":0,"skipped":0}
    start = time.time()

    for i, p in enumerate(to_proc, 1):
        r = process(p, i, len(to_proc))
        stats[r] = stats.get(r,0) + 1
        if i < len(to_proc): time.sleep(DELAY)

    elapsed = time.time() - start
    print(color("\n\n═══════════ DISCHARGE BATCH 2 COMPLETE ═══════", BOLD))
    print(f"  ✓ Success:  {color(str(stats['success']), GREEN)}")
    print(f"  ✕ Errors:   {color(str(stats['error']), RED)}")
    print(f"  ⊘ Skipped:  {stats.get('skipped',0)+stats.get('empty',0)}")
    print(f"  ⏱ Time:     {elapsed:.0f}s ({elapsed/60:.1f} min)")
    print(color("\n  🚀 All datasets fully loaded into MediParse AI!", GREEN))

if __name__ == "__main__":
    try: main()
    except KeyboardInterrupt:
        print(color("\n\n  ⚡ Interrupted. Progress saved.", YELLOW))
