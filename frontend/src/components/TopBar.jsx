import { useState, useEffect } from 'react'

// ── TopBar ─────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  upload:    { title:'Upload Document', sub:'Drag & drop or batch upload health record PDFs' },
  documents: { title:'Document Library', sub:'All processed records — search, filter, export' },
  analytics: { title:'Analytics Dashboard', sub:'Extraction quality, document types, confidence trends' },
  forms:     { title:'TPA Forms Download', sub:'Official Pre-Auth and Claim documents' },
  detail:    { title:'Extraction Results', sub:'Structured fields, lab data, billing & cloud sync' },
  settings:  { title:'Platform Settings', sub:'Admin Profile, Auto-Extraction rules & Integrations' },
}

export function TopBar({ page, role, onSearch }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const info = PAGE_TITLES[page] || PAGE_TITLES.upload
  return (
    <div className="anim-fade" style={{
      padding: '20px 32px',
      background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      gap: 24
    }}>
      <div>
        <button style={{
          background: 'linear-gradient(135deg, #5b869e, #3a6884)',
          color: '#ffffff',
          borderRadius: '14px',
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: '14px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 20px rgba(58, 104, 132, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
          fontFamily: 'var(--font)',
          cursor: 'pointer'
        }}>
          Upload Document
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Search Bar Input */}
        <div className="google-search" style={{ 
          background: 'var(--surface)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          width: '380px'
        }}>
          <svg style={{width: 18, height: 18, color: 'var(--text2)'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search patient, ID, or documents..." 
            onChange={(e) => onSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', 
              color: 'var(--text)', fontSize: 13, fontWeight: 500,
              width: '100%', outline: 'none', fontFamily: 'var(--font)'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', padding: '6px 14px 6px 14px', borderRadius: '100px', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 800 }}>Dr. Adarsh Kumar</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.04em' }}>CHIEF ADMINISTRATOR</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            overflow: 'hidden', 
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <img 
               src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" 
               alt="Provider Administrator" 
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             />
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ 
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', border:'none', 
              width: 36, height: 36, cursor:'pointer', padding: 0, 
              borderRadius:'50%', display:'flex', alignItems:'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)' 
            }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopBar

// ── Toast ──────────────────────────────────────────────────────────────────
export function Toast({ msg, type }) {
  const colors = {
    success: { bg:'rgba(0,229,160,0.1)', border:'rgba(0,229,160,0.3)', color:'var(--green)', icon:'✓' },
    error:   { bg:'rgba(255,77,106,0.1)', border:'rgba(255,77,106,0.3)', color:'var(--red)',   icon:'✕' },
    info:    { bg:'var(--accent-glow2)',  border:'rgba(0,212,255,0.3)',  color:'var(--accent)', icon:'ℹ' },
  }
  const s = colors[type] || colors.info
  return (
    <div className="anim-fade" style={{
      background:s.bg, border:`1px solid ${s.border}`,
      borderRadius:10, padding:'11px 16px',
      display:'flex', alignItems:'center', gap:10,
      minWidth:280, maxWidth:380,
      boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
      backdropFilter:'blur(12px)',
    }}>
      <span style={{ color:s.color, fontWeight:700, fontSize:14 }}>{s.icon}</span>
      <span style={{ fontSize:12, color:'var(--text)', flex:1 }}>{msg}</span>
    </div>
  )
}

// ── Confidence Ring ────────────────────────────────────────────────────────
export function ConfidenceRing({ score }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--orange)' : 'var(--red)'
  const size = 56, stroke = 5, r = (size - stroke*2) / 2
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{
        position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, color,
      }}>
        {score}%
      </div>
    </div>
  )
}
