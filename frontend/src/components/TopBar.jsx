import { useState, useEffect } from 'react'

// ── TopBar ─────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  upload:    { title:'Upload Document', sub:'Drag & drop or batch upload health record PDFs' },
  documents: { title:'Document Library', sub:'All processed records — search, filter, export' },
  analytics: { title:'Analytics Dashboard', sub:'Extraction quality, document types, confidence trends' },
  detail:    { title:'Extraction Results', sub:'Structured fields, lab data, billing & cloud sync' },
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
      borderBottom: '1px solid var(--border)',
      padding: '20px 32px',
      background: 'var(--sidebar-bg)',
      backdropFilter: 'var(--glass)',
      WebkitBackdropFilter: 'var(--glass)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      gap: 24
    }}>
      <div style={{ flex: 1, maxWidth: 600 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color:'var(--text)', letterSpacing:'-0.03em' }}>
          {info.title}
        </h2>
        <p style={{ fontSize:13, color:'var(--text2)', fontWeight: 500 }}>{info.sub}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Search Bar Input */}
        <div className="google-search">
          <svg style={{width: 18, height: 18, color: 'var(--text2)'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input 
            type="text" 
            placeholder="Search patient, ID, or documents..." 
            onChange={(e) => onSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', 
              color: 'var(--text)', fontSize: 14, fontWeight: 500,
              width: '100%', outline: 'none', fontFamily: 'var(--font)'
            }}
          />
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 700 }}>Dr. Adarsh Kumar</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.04em' }}>CHIEF ADMINISTRATOR</div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'var(--surface2)',
            border: '2px solid var(--surface3)',
            overflow: 'hidden', 
            boxShadow: 'var(--shadow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <img 
               src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop" 
               alt="Provider Administrator" 
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             />
          </div>
        </div>

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ 
            background:'var(--surface2)', border:'1px solid var(--border)', 
            fontSize:16, cursor:'pointer', padding:'10px', 
            borderRadius:12, display:'flex', alignItems:'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)' 
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
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
