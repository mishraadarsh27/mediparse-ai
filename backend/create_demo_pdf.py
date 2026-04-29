import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

path = r"c:\Users\adars\Downloads\mediparse-ai-main\DEMO_TPA_RECORD.pdf"
c = canvas.Canvas(path, pagesize=letter)
width, height = letter

# Header
c.setFillColor(colors.darkblue)
c.setFont("Helvetica-Bold", 18)
c.drawString(50, height - 50, "CASHLESS HOSPITALISATION PRE-AUTHORIZATION FORM")

c.setFillColor(colors.black)
c.setFont("Helvetica-Bold", 12)
c.drawString(50, height - 90, "PART A: TO BE FILLED BY THE INSURED")
c.setFont("Helvetica", 11)
c.drawString(50, height - 110, "Insurance Provider: Star Health & Allied Insurance")
c.drawString(50, height - 130, "Policy Number: SH-2026-99182399-X")
c.drawString(50, height - 150, "TPA Name: Medi Assist TPA")
c.drawString(50, height - 170, "Patient Name: Rajesh Sharma")
c.drawString(50, height - 190, "Age: 45      Gender: Male")
c.drawString(50, height - 210, "UHID / Patient ID: RS-993881")
c.drawString(50, height - 230, "Contact: +91-9876543210      Email: rajesh.s@example.com")

c.setFont("Helvetica-Bold", 12)
c.drawString(50, height - 270, "PART B: TO BE FILLED BY THE TREATING DOCTOR/HOSPITAL")
c.setFont("Helvetica", 11)
c.drawString(50, height - 290, "Hospital Name: Apollo Spectra Hospitals")
c.drawString(50, height - 310, "Treating Doctor / Surgeon: Dr. Vivek Murthy")
c.drawString(50, height - 330, "Proposed Date of Admission: 25-05-2026")
c.drawString(50, height - 350, "Room Category: Single Private AC Room")
c.drawString(50, height - 370, "Diagnosis / Medical Condition:")
c.setFont("Helvetica-Bold", 11)
c.drawString(50, height - 390, "Acute Appendicitis with localized peritonitis. Appendectomy required.")
c.setFont("Helvetica", 11)

c.drawString(50, height - 420, "Expected Cost Breakdown:")
c.drawString(70, height - 440, "- Surgeon Fees: INR 45,000")
c.drawString(70, height - 460, "- OT Charges: INR 25,000")
c.drawString(70, height - 480, "- Room & Nursing (3 days): INR 35,000")
c.drawString(70, height - 500, "- Consumables & Meds: INR 20,000")

c.setFont("Helvetica-Bold", 12)
c.drawString(50, height - 530, "Total Estimated Amount: INR 125,000")

c.setFont("Helvetica", 10)
c.drawString(50, height - 600, "Signed by:")
c.drawString(50, height - 620, "Dr. Vivek Murthy")
c.drawString(50, height - 640, "Reg No: MMC-39912")

c.save()
print(f"Created PDF successfully at {path}")
