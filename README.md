# MediParse AI 🏥

MediParse AI is an automated Revenue Cycle Management (RCM) system. It helps hospitals and insurance providers (TPAs) quickly turn messy PDFs, handwritten prescriptions, and scanned bills into structured, actionable data using AI. 

## What it Does 📋

- **Document Parsing:** Upload medical PDFs or scanned images, and the system automatically extracts key clinical parameters (like ICD codes, medicines, and billing amounts) using OCR and AI.
- **RCM Workflow Tracking:** Manages the entire patient billing lifecycle: Pre-Auth → Admission → Enhancement → Discharge → Payment → Settlement.
- **Financial Analytics:** Automatically checks for revenue leakage, TDS calculations, and hospital-payer mismatches.
- **Role-Based Dashboards:** Separate, synced portals for Hospital staff and TPA Auditors.
- **Export Options:** Easily export your data to FHIR-compliant JSON or CSV for your existing EMR/HIS systems.

## Architecture & Tech Stack 💻

MediParse AI is built as a modern full-stack web application designed for high performance and rapid development.

- **Frontend:** React (Vite) with a custom CSS UI for dynamic, responsive user experiences.
- **Backend:** Python and FastAPI for fast, asynchronous API endpoints.
- **AI/Extraction:** Groq API / Gemini combined with PyMuPDF and pdfplumber for high-accuracy OCR.
- **Database:** Supabase (PostgreSQL) for real-time data sync and persistent storage.

## Project Structure 📁

```text
mediparse/
├── backend/
│   ├── main.py           # API routes
│   ├── ai_pipeline.py    # AI text extraction logic
│   ├── rcm_engine.py     # Revenue reconciliation logic
│   ├── storage.py        # Supabase database operations
│   └── extractor.py      # PDF parsing and OCR
├── frontend/
│   ├── src/
│   │   ├── api.js        # API client
│   │   ├── components/   # React components (TopBar, Sidebar, etc.)
│   │   └── pages/        # Dashboard, Analytics, Upload pages
│   └── package.json
└── README.md
```

## How to Run Locally ⚙️

### Backend
1. Go to the `backend` folder.
2. Install the required packages: `pip install -r requirements.txt`.
3. Add your API keys (`SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`) to a `.env` file.
4. Run the server: `python main.py`.

### Frontend
1. Go to the `frontend` folder.
2. Install dependencies: `npm install`.
3. Start the Vite server: `npm run dev`.
