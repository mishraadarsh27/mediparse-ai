import os

# 1. Update App.jsx to handle split screen RCM view
app_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

app_text = app_text.replace(
    "{page === 'rcm'         && <RCMPage role={sessionRole} onOpenCase={openCase} toast={toast} search={search} />}",
    """{page === 'rcm' && (
            <div style={{ display:'flex', gap:24, alignItems:'flex-start', height:'100%' }}>
              <div style={{ flex: selectedCaseId ? '0 0 38%' : 1, transition:'all 0.5s ease', height:'calc(100vh - 120px)', overflowY:'auto', paddingRight:12 }} className="custom-scroll">
                <RCMPage role={sessionRole} onOpenCase={(id) => { setSelectedCaseId(id); setPage('rcm') }} toast={toast} search={search} isSplit={!!selectedCaseId} />
              </div>
              {selectedCaseId && (
                <div style={{ flex: 1, animation:'anim-fade 0.5s ease', height:'calc(100vh - 120px)', overflowY:'auto', paddingRight:12 }} className="custom-scroll">
                  <CaseDetailPage caseId={selectedCaseId} role={sessionRole} onBack={() => setSelectedCaseId(null)} toast={toast} />
                </div>
              )}
            </div>
          )}"""
)

# Also fix the openCase function so it doesn't leave 'rcm' page
app_text = app_text.replace(
    "function openCase(id)    { setSelectedCaseId(id); setPage('case-detail') }",
    "function openCase(id)    { setSelectedCaseId(id); setPage('rcm') }"
)
# disable standalone case-detail page render just in case
app_text = app_text.replace(
    "{page === 'case-detail' && selectedCaseId && <CaseDetailPage caseId={selectedCaseId} role={sessionRole} onBack={() => setPage('rcm')} toast={toast} />}",
    ""
)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_text)


# 2. Update RCMPage.jsx to adapt its header if it is in split view
rcm_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/pages/RCMPage.jsx"
with open(rcm_path, "r", encoding="utf-8") as f:
    rcm_text = f.read()

rcm_text = rcm_text.replace(
    "export default function RCMPage({ role, onOpenCase, toast, search: globalSearch }) {",
    "export default function RCMPage({ role, onOpenCase, toast, search: globalSearch, isSplit }) {"
)

# Modify the header of RCMPage dynamically based on isSplit
rcm_header_old = """      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {isHospital ? '🏥 Hospital — RCM Cases' : '🏦 TPA — Claims Queue'}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>
            {isHospital
              ? 'Submit & track insurance cases: Pre-Auth → Admission → Discharge → Settlement'
              : 'Review pending requests and take approval actions'}
          </p>
        </div>"""

rcm_header_new = """      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: isSplit ? 16 : 28, flexDirection: isSplit ? 'column' : 'row', gap: isSplit ? 16 : 0 }}>
        <div>
          <h1 style={{ fontSize: isSplit ? 20 : 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {isSplit ? 'Case Status List' : (isHospital ? '🏥 Hospital — RCM Cases' : '🏦 TPA — Claims Queue')}
          </h1>
          {!isSplit && (
            <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>
              {isHospital
                ? 'Submit & track insurance cases: Pre-Auth → Admission → Discharge → Settlement'
                : 'Review pending requests and take approval actions'}
            </p>
          )}
        </div>"""
rcm_text = rcm_text.replace(rcm_header_old, rcm_header_new)

with open(rcm_path, "w", encoding="utf-8") as f:
    f.write(rcm_text)


# 3. Update CaseDetailPage.jsx to adapt its header to "Case Workflow"
case_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/pages/CaseDetailPage.jsx"
with open(case_path, "r", encoding="utf-8") as f:
    case_text = f.read()

# Remove the back button and add "Case Workflow" as title
css_back_btn = """      {/* Back + Header */}
      <button onClick={onBack} style={{
        background:'transparent', border:'1px solid var(--border)', color:'var(--text2)',
        borderRadius:8, padding:'8px 16px', cursor:'pointer', marginBottom:20, fontSize:13
      }}>← Back to Cases</button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)', margin:0 }}>
            {caseData.patient_name}
          </h1>"""

new_case_header = """      {/* Back + Header hidden in split view, replaced with elegant workflow title */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'var(--text)', marginBottom:8, letterSpacing:'0.02em' }}>Case Workflow</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--accent)', margin:0, display:'flex', alignItems:'center', gap:8 }}>
            {caseData.patient_name} <span style={{fontSize:16, color:'var(--text3)', fontWeight:500}}>- {summary?.status_label}</span>
          </h1>"""
case_text = case_text.replace(css_back_btn, new_case_header)

with open(case_path, "w", encoding="utf-8") as f:
    f.write(case_text)


# 4. Add custom scrollbar for dark emerald theme in index.css
css_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/index.css"
with open(css_path, "a", encoding="utf-8") as f:
    f.write('''
/* Custom Smooth Scrollbar for Split View */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--border2);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}
/* Ensure the grid of Financial Summary fits gracefully in 1fr space */
.case-workflow-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media(min-width: 1400px) {
  .case-workflow-grid {
    grid-template-columns: 1.2fr 1fr;
  }
}
''')
