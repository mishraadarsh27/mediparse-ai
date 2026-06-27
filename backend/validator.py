"""
Validator + Confidence Scorer
Returns (validated_fields, warnings, confidence_score 0-100)
"""
import re
from typing import Any

# ============================================
# CONFIGURATION CONSTANTS
# ============================================

DATE_REGEX = re.compile(r'^\d{4}-\d{2}-\d{2}$')
MISSING_FIELD_PENALTY = 8
MAX_DEPTH = 3
AMOUNT_TOLERANCE = 2
EXPECTED_LIST_ITEMS = 3

# Required fields by document type
BILLING_REQUIRED = [
    "patient.name", 
    "hospital.name", 
    "dates.admission_date",
    "dates.discharge_date", 
    "diagnosis.primary", 
    "billing.total_amount"
]

LAB_REQUIRED = [
    "patient.name", 
    "dates.document_date", 
    "lab_tests"
]

GENERAL_REQUIRED = [
    "patient.name", 
    "dates.document_date"
]

# ============================================
# MAIN VALIDATION FUNCTION
# ============================================

def validate_fields(fields: dict) -> tuple[dict, list[str], int]:
    """
    Validate extracted fields and calculate confidence score.
    
    Returns:
        tuple: (validated_fields, warnings_list, confidence_score)
    """
    warnings = []
    fields["amount"] = int(fields.get("amount", 0))
    doc_type = fields.get("document_type", "Other")

    # Determine required fields based on document type
    if doc_type in ("Hospital Bill", "Discharge Summary", "Insurance Form"):
        required = BILLING_REQUIRED
    elif doc_type == "Lab Report":
        required = LAB_REQUIRED
    else:
        required = GENERAL_REQUIRED

    # Check required fields (dot-notation traversal)
    for path in required:
        val = _get_nested_value(fields, path)
        if val is None or val == "" or val == []:
            warnings.append(f"Missing required field: {path}")

    # Validate date formats
    dates = fields.get("dates", {})
    for key, value in dates.items():
        if value and not DATE_REGEX.match(str(value)):
            warnings.append(f"Date format issue in dates.{key}: got '{value}', expected YYYY-MM-DD")

    # Validate billing amounts
    billing = fields.get("billing", {})
    for key in ["total_amount", "amount_paid", "amount_due"]:
        value = billing.get(key)
        if value is not None:
            try:
                float(value)
            except (ValueError, TypeError):
                warnings.append(f"Invalid billing amount: billing.{key} = '{value}'")

    # Amount reconciliation check
    total = _to_float(billing.get("total_amount"))
    paid = _to_float(billing.get("amount_paid"))
    due = _to_float(billing.get("amount_due"))
    
    if total and paid and due:
        expected = round(total - paid, 2)
        if abs(expected - due) > AMOUNT_TOLERANCE:
            warnings.append(f"Amount mismatch: {total} - {paid} = {expected}, but amount_due = {due}")

    # Date logic validation
    admission = dates.get("admission_date")
    discharge = dates.get("discharge_date")
    if (admission and discharge and 
        DATE_REGEX.match(admission) and DATE_REGEX.match(discharge) and 
        admission > discharge):
        warnings.append(f"admission_date ({admission}) is after discharge_date ({discharge})")

    # Check for abnormal lab results
    labs = fields.get("lab_tests", []) or []
    abnormal = [test.get("name", "?") for test in labs if test.get("status") in ("High", "Low")]
    if abnormal:
        warnings.append(f"Abnormal results: {', '.join(abnormal)}")

    # Calculate confidence score
    filled_count = _count_filled_fields(fields)
    total_count = _count_total_fields(fields)
    base_score = int((filled_count / max(total_count, 1)) * 100)
    penalty = len([w for w in warnings if "Missing required" in w]) * MISSING_FIELD_PENALTY
    confidence = max(0, min(100, base_score - penalty))

    return fields, warnings, confidence

# ============================================
# HELPER FUNCTIONS
# ============================================

def _get_nested_value(data: dict, path: str) -> Any:
    """Get value from nested dictionary using dot-notation path."""
    parts = path.split(".")
    current = data
    for part in parts:
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current

def _to_float(value: Any) -> float | None:
    """Safely convert value to float."""
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def _count_filled_fields(obj: Any, depth: int = 0) -> int:
    """Count number of filled (non-empty) fields in nested structure."""
    if depth > MAX_DEPTH:
        return 0
    
    if isinstance(obj, dict):
        return sum(_count_filled_fields(value, depth + 1) for value in obj.values())
    
    if isinstance(obj, list):
        return len(obj)
    
    return 1 if obj is not None and obj != "" else 0

def _count_total_fields(obj: Any, depth: int = 0) -> int:
    """Count total number of fields in nested structure."""
    if depth > MAX_DEPTH:
        return 1
    
    if isinstance(obj, dict):
        return max(1, sum(_count_total_fields(value, depth + 1) for value in obj.values()))
    
    if isinstance(obj, list):
        return EXPECTED_LIST_ITEMS
    
    return 1