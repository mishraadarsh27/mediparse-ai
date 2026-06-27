"""
Claim Engine - Generate and reconcile insurance claims
"""
import os

# ============================================
# CONFIGURATION CONSTANTS
# ============================================

DEFAULT_INSURANCE_PROVIDER = os.getenv("DEFAULT_INSURANCE_PROVIDER", "Star Health")
DEFAULT_APPROVAL_PERCENTAGE = float(os.getenv("DEFAULT_APPROVAL_PERCENTAGE", "0.8"))

# ============================================
# CLAIM GENERATION
# ============================================

def generate_claim(data: dict) -> dict:
    """
    Generate an insurance claim from extracted document data.
    
    Args:
        data: Extracted fields from document
        
    Returns:
        dict: Claim details with patient info, diagnosis, procedures, and amounts
    """
    billing = data.get("billing", {})
    patient = data.get("patient", {})
    diagnosis = data.get("diagnosis", {})
    procedures = data.get("procedures", [])

    # Safely extract total bill amount
    try:
        bill = float(billing.get("total_amount") or 0)
    except (ValueError, TypeError):
        bill = 0.0

    # Extract valid CPT codes from procedures
    cpt_codes = [
        p.get("cpt_code") 
        for p in procedures 
        if isinstance(p, dict) and p.get("cpt_code")
    ]

    claim = {
        "patient_name": patient.get("name"),
        "diagnosis": diagnosis.get("primary") or diagnosis.get("icd10_primary"),
        "procedures": cpt_codes,
        "total_bill": bill,
        "insurance": DEFAULT_INSURANCE_PROVIDER,
        "approved_claim": round(bill * DEFAULT_APPROVAL_PERCENTAGE, 2)
    }

    return claim

# ============================================
# CLAIM RECONCILIATION
# ============================================

def reconcile(bill: float, claim: float) -> dict:
    """
    Reconcile bill amount with approved claim amount.
    
    Args:
        bill: Total bill amount
        claim: Approved claim amount
        
    Returns:
        dict: Reconciliation details with loss calculation and status
    """
    # Safely convert to float
    try:
        bill_amount = float(bill or 0)
        claim_amount = float(claim or 0)
    except (ValueError, TypeError):
        bill_amount = 0.0
        claim_amount = 0.0
    
    loss = round(bill_amount - claim_amount, 2)
    status = "Mismatch" if bill_amount != claim_amount else "Matched"
    
    return {
        "bill": bill_amount,
        "claim": claim_amount,
        "loss": loss,
        "status": status
    }