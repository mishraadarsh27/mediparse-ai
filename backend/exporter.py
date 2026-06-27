"""
Exporter - Export extracted data to CSV and FHIR JSON formats
"""
import csv
import io

# ============================================
# CONFIGURATION CONSTANTS
# ============================================

CSV_HEADERS = ["Category", "Field", "Value"]

CATEGORY_NAMES = {
    "document": "Document Info",
    "patient": "Patient",
    "hospital": "Hospital",
    "dates": "Dates",
    "diagnosis": "Diagnosis",
    "billing": "Billing",
    "insurance": "Insurance",
    "medication": "Medication",
    "lab": "Lab Test",
    "procedure": "Procedure"
}

# ============================================
# CSV EXPORT
# ============================================

def export_to_csv(fields: dict) -> str:
    """
    Export extracted fields to CSV format.
    
    Args:
        fields: Extracted fields from document
        
    Returns:
        str: CSV formatted string
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write CSV headers
    writer.writerow(CSV_HEADERS)
    
    # Helper function to write a section
    def write_section(category: str, data_dict: dict) -> None:
        """Write a section of data to CSV."""
        if not data_dict:
            return
        for key, value in data_dict.items():
            if value and value != "null":
                key_title = str(key).replace("_", " ").title()
                writer.writerow([category, key_title, str(value)])

    # Write basic sections
    write_section(CATEGORY_NAMES["document"], {"Document Type": fields.get("document_type")})
    write_section(CATEGORY_NAMES["patient"], fields.get("patient", {}))
    write_section(CATEGORY_NAMES["hospital"], fields.get("hospital", {}))
    write_section(CATEGORY_NAMES["dates"], fields.get("dates", {}))
    write_section(CATEGORY_NAMES["diagnosis"], fields.get("diagnosis", {}))
    write_section(CATEGORY_NAMES["billing"], fields.get("billing", {}))
    write_section(CATEGORY_NAMES["insurance"], fields.get("insurance", {}))
    
    # Write medications
    medications = fields.get("medications", [])
    if medications:
        for index, med in enumerate(medications):
            value = f"{med.get('dosage','')} | {med.get('frequency','')} | {med.get('duration','')} | {med.get('route','')}".strip(" |")
            writer.writerow([CATEGORY_NAMES["medication"], med.get("name", f"Med {index+1}"), value])
            
    # Write lab tests
    lab_tests = fields.get("lab_tests", [])
    if lab_tests:
        for index, test in enumerate(lab_tests):
            value = f"{test.get('value','')} {test.get('unit','')} (Ref: {test.get('reference_range','')}) [{test.get('status','')}]".strip()
            writer.writerow([CATEGORY_NAMES["lab"], test.get("name", f"Test {index+1}"), value])
            
    # Write procedures
    procedures = fields.get("procedures", [])
    if procedures:
        for index, proc in enumerate(procedures):
            value = f"Date: {proc.get('date','')} | Cost: {proc.get('cost','')} | CPT: {proc.get('cpt_code','')}".strip(" |")
            writer.writerow([CATEGORY_NAMES["procedure"], proc.get("name", f"Proc {index+1}"), value])
            
    return output.getvalue()

# ============================================
# FHIR JSON EXPORT
# ============================================

def export_to_fhir_json(fields: dict) -> dict:
    """
    Export extracted fields to FHIR-compliant JSON format.
    
    Args:
        fields: Extracted fields from document
        
    Returns:
        dict: FHIR-compliant JSON structure
    """
    return {
        "Document_Information": {
            "Type": fields.get("document_type"),
            "Date": fields.get("dates", {}).get("document_date")
        },
        "Patient_Demographics": fields.get("patient", {}),
        "Hospital_Details": fields.get("hospital", {}),
        "Clinical_Diagnosis": fields.get("diagnosis", {}),
        "Admissions_and_Dates": fields.get("dates", {}),
        "Billing_and_Financials": fields.get("billing", {}),
        "Insurance_Details": fields.get("insurance", {}),
        "Prescribed_Medications": fields.get("medications", []),
        "Laboratory_Tests": fields.get("lab_tests", []),
        "Procedures": fields.get("procedures", [])
    }