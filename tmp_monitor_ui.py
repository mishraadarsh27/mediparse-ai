import os
import re

# 1. Update index.css
css_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/index.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_text = f.read()

# Replace the dark theme block entirely using regex
dark_theme_replacement = """[data-theme='dark'] {
  --bg:          #020806;
  --bg-image:    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83v58.34h-58.34l-.83-.83V0h58.34zM54.04 1.414H1.414v52.626h52.626V1.414z' fill='%2310b981' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E");
  --bg-opacity:  1;
  
  --surface:     rgba(10, 38, 29, 0.45);
  --surface2:    rgba(16, 50, 38, 0.65);
  --surface3:    rgba(22, 65, 50, 0.8);
  --border:      rgba(16, 185, 129, 0.3);
  --border2:     rgba(16, 185, 129, 0.5);

  --text:        #ecfdf5;
  --text2:       #a7f3d0;
  --text3:       #6ee7b7;
  
  --card-bg:     rgba(6, 22, 17, 0.6);
  --card-border: rgba(16, 185, 129, 0.35);

  --sidebar-bg:  rgba(6, 24, 18, 0.75);
  --sidebar-text:#ecfdf5;

  --accent-glow: rgba(16, 185, 129, 0.4);
  --accent-glow2:rgba(5, 150, 105, 0.5);
  
  --shadow:      0 12px 32px rgba(16, 185, 129, 0.1), inset 0 1px 2px rgba(16, 185, 129, 0.2);
  --shadow2:     0 20px 40px rgba(16, 185, 129, 0.15), inset 0 2px 4px rgba(16, 185, 129, 0.3);

  --glass:       blur(24px) saturate(180%);
}"""
css_text = re.sub(r"\[data-theme='dark'\]\s*\{[^}]+\}", dark_theme_replacement, css_text, flags=re.DOTALL)

# Append the monitor screen wrapper
if ".cyber-monitor-glass" not in css_text:
    css_text += """
/* Curved Cyber Monitor Layout */
.cyber-monitor-glass {
  display: flex;
  min-height: calc(100vh - 24px);
  margin: 12px;
  border-radius: 32px;
  background: var(--surface);
  backdrop-filter: var(--glass);
  -webkit-backdrop-filter: var(--glass);
  border: 1px solid var(--border);
  box-shadow: 
    0 30px 60px -15px rgba(0, 0, 0, 0.8), 
    inset 0 0 0 1px var(--border2),
    inset 0 0 80px rgba(16, 185, 129, 0.08); /* Inner curve glow */
  overflow: hidden;
  position: relative;
  transition: all 0.5s ease;
}
.cyber-monitor-glass::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 160px;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), transparent);
  pointer-events: none;
  z-index: 10;
}
"""
with open(css_path, "w", encoding="utf-8") as f:
    f.write(css_text)

# 2. Update App.jsx to insert className="cyber-monitor-glass"
app_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/App.jsx"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

app_text = app_text.replace(
    "<div style={{ display: 'flex', minHeight: '100vh' }}>",
    "<div className=\"cyber-monitor-glass\">"
)
app_text = app_text.replace(
    "<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>",
    "<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 2 }}>"
)
with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_text)

# 3. Update RCMPage.jsx case-card to have glowing neon borders based on stage
rcm_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/pages/RCMPage.jsx"
with open(rcm_path, "r", encoding="utf-8") as f:
    rcm_text = f.read()

rcm_text = rcm_text.replace(
    """<div key={caseItem.id} onClick={() => onOpenCase(caseItem.id)} className="futuristic-card cyber-shift case-card" style={{ cursor:'pointer' }}>""",
    """<div key={caseItem.id} onClick={() => onOpenCase(caseItem.id)} className="futuristic-card cyber-shift case-card" style={{ cursor:'pointer', border: `1.5px solid ${STATUS_COLOR[caseItem.status] || 'var(--border)'}`, boxShadow: `inset 0 0 24px ${STATUS_COLOR[caseItem.status] || 'transparent'}18, 0 4px 16px rgba(0,0,0,0.2)` }}>"""
)
with open(rcm_path, "w", encoding="utf-8") as f:
    f.write(rcm_text)
