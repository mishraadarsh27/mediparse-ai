import os
import re

path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/pages/CaseDetailPage.jsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update inp occurrences to use className
text = text.replace("style={inp}", "className=\"premium-inp\"")
text = text.replace("style={{...inp, ", "className=\"premium-inp\" style={{")
text = text.replace("style={{...inp}}", "className=\"premium-inp\"")

# 2. Update btn occurrences to use className and pass color via HTML styles
text = re.sub(r"style=\{btn\('([^']+)'\)\}", r'className="premium-btn" style={{background: "\1"}}', text)
text = re.sub(r"style=\{\{\.\.\.btn\('([^']+)'\),\s*(.*?)\}\}", r'className="premium-btn" style={{background: "\1", \2}}', text)

# 3. Upgrade UI wrappers globally for the left side panels
text = text.replace(
    "background:'var(--card-bg)', border:'1px solid var(--border)',\n            borderRadius:16, padding:24",
    "background:'linear-gradient(145deg, var(--card-bg), var(--surface2))', border:'1px solid var(--border)',\n            borderRadius:24, padding:32, boxShadow:'0 12px 32px rgba(0,0,0,0.03)'"
)

# Replace 'Patient & Insurance Details' small styling
text = text.replace(
    "padding:'10px 14px', background:'var(--surface2)', borderRadius:8",
    "padding:'16px', background:'var(--surface2)', borderRadius:16, border:'1px solid var(--border)', boxShadow:'inset 0 2px 4px rgba(0,0,0,0.02)'"
)

# And replace action panel internal borders/wrappers
text = text.replace(
    "border:'1px dashed var(--border2)', padding:'10px', borderRadius:8",
    "border:'2px dashed var(--border)', padding:'24px 16px', borderRadius:16, transition:'all 0.3s'"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

css_path = "c:/Users/adars/Downloads/mediparse-ai-main/mediparse-ai-main/frontend/src/index.css"
with open(css_path, "a", encoding="utf-8") as f:
    f.write('''
/* Premium Action Forms UX */
.premium-inp {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  width: 100%;
  outline: none;
  font-family: var(--font);
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.premium-inp:hover {
  border-color: rgba(59, 130, 246, 0.4);
}
.premium-inp:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2), inset 0 2px 4px rgba(0,0,0,0.02);
  background: var(--surface);
}
[data-theme='dark'] .premium-inp:focus {
  background: rgba(30, 41, 59, 0.5);
}
.premium-btn {
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #ffffff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.premium-btn:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3);
  filter: brightness(1.15);
}
.premium-btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
''')
