<div align="center">
  <h1>⚡ MediParse AI</h1>
  <p><strong>Intelligent Revenue Cycle Management (RCM) Automation Engine</strong></p>
  <p><i>An AI-Powered Framework for Automated Medical Claim Parsing & Workflow Automation</i></p>
</div>

---

## 🌐 Overview

MediParse AI is an enterprise-grade platform designed to bridge the gap between unstructured medical documentation and structured healthcare operations. By leveraging state-of-the-art Large Language Models (LLMs) and advanced Vision OCR, MediParse AI transforms messy PDFs, scanned bills, and handwritten prescriptions into validated, actionable data.

The platform provides a complete end-to-end solution for hospitals and insurance providers (TPAs) to manage the entire **Revenue Cycle Lifecycle**—from pre-authorization and admission to discharge settlement and financial reconciliation.

---

## 🚀 Core Features

- **Multi-Modal AI Extraction:** Ingests digital and scanned PDFs, extracting 30+ clinical parameters (ICD codes, medicines, billing amounts) with high confidence.
- **Full RCM Lifecycle:** Orchestrates the 8-stage journey: Pre-Auth → Admission → Enhancement → Discharge → Payment → Settlement → Case Closure.
- **Financial Analytics & Revenue Gap Tracking:** Automated reconciliation to identify revenue leakage, TDS calculations, and hospital-payer mismatch.
- **Role-Based Portals:** Dedicated, synchronized interfaces for clinical teams (Hospital Portal) and claims auditors (TPA Portal).
- **Export & Integration:** One-click exports to FHIR-compliant JSON and standardized CSV for seamless EMR/HIS integration.
- **Human-in-the-Loop Validation:** Built-in logic engine for cross-verifying billing calculations with manual feedback synchronization.

---

## 🛠 Technology Stack

- **Frontend:** React (Vite) with a premium SaaS design system and dynamic dark-mode aesthetics.
- **Backend:** FastAPI (Python) for ultra-low latency API responses and asynchronous processing.
- **AI / ML Engine:** Advanced LLM inference (Gemini 2.0 / Llama-3) coupled with PyMuPDF for document vision.
- **Database:** Supabase (PostgreSQL) for real-time synchronization and secure cloud storage.

---

## 🗂 Project Structure

```
mediparse/
├── backend/
│   ├── main.py           # API routing & service orchestration
│   ├── ai_pipeline.py    # AI logic & structured extraction
│   ├── rcm_engine.py     # Business logic for revenue reconciliation
│   ├── storage.py        # Database integration (Supabase)
│   └── extractor.py      # Vision OCR & PDF processing
├── frontend/
│   ├── src/
│   │   ├── api.js        # Global API client
│   │   ├── components/   # Modular UI architecture
│   │   └── pages/        # Dashboard, Analytics, Case Management
│   └── package.json
└── README.md             # Project documentation
```

---

## ⚡ Setup & Installation

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure your `.env` with `SUPABASE_URL`, `SUPABASE_KEY`, and `GEMINI_API_KEY`.
4. Start the server: `python main.py`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

---

## 📈 Impact

MediParse AI reduces manual data entry time by **90%**, eliminates human error in billing reconciliation, and provides healthcare administrators with real-time visibility into their revenue health, ensuring faster claim settlements and better patient care delivery.

---

© 2026 MediParse AI. All Rights Reserved.
