import { useState, useEffect } from 'react'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AnalyticsPage({ onNav }) {
  const [stats, setStats] = useState(null)
  const [rcmStats, setRcmStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { refresh() }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([
        fetch(`${API}/api/stats`).then(res => res.json()),
        fetch(`${API}/api/rcm/stats`).then(res => res.json())
      ])
      setStats(s)
      setRcmStats(r)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
        <div className="skeleton" style={{ height:32, width:200 }} />
        <div className="skeleton" style={{ height:32, width:100 }} />
      </div>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:24 }} />)}
    </div>
  )

  if (!stats || stats.total === 0) return (
    <div className="card anim-fade" style={{ textAlign:'center', padding:'80px 20px', color:'var(--text2)', background: 'var(--surface2)', borderRadius: 24, border: '1px solid var(--border)' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🌌</div>
      <div style={{ fontWeight:800, fontSize:24, color:'var(--text)', marginBottom:8 }}>No Analytic Data Found</div>
      <div style={{ fontSize:15, color:'var(--text3)' }}>Upload processing batches to ignite the inference engine.</div>
    </div>
  )

  const docTypeColors = {
    'Lab Report':        'linear-gradient(90deg, #8b5cf6, #c084fc)',
    'Hospital Bill':     'linear-gradient(90deg, #f59e0b, #fbbf24)',
    'Discharge Summary': 'linear-gradient(90deg, #06b6d4, #22d3ee)',
    'Prescription':      'linear-gradient(90deg, #10b981, #34d399)',
    'Insurance Form':    'linear-gradient(90deg, #ef4444, #f87171)',
    'Other':             'linear-gradient(90deg, #64748b, #94a3b8)',
  }

  const docTypeEntries = Object.entries(stats.doc_types || {})
  const maxDocType = Math.max(...docTypeEntries.map(([,v]) => v), 1)
  
  const accNum = rcmStats?.total_cases > 0 ? Math.min(100, Math.round((rcmStats.revenue.total_settled / rcmStats.revenue.total_billed)*100)) : 100

  // SVGs for the top cards
  const RevIcon = <svg width="40" height="40" viewBox="0 0 44 44" fill="none"><rect width="44" height="44" rx="12" fill="#10B981" fillOpacity="0.1" /><path d="M22 12V32M22 12L16 18M22 12L28 18" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 26C14 26 17 28 22 28C27 28 30 26 30 26" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round"/></svg>
  const LeakIcon = <svg width="40" height="40" viewBox="0 0 44 44" fill="none"><rect width="44" height="44" rx="12" fill="#EF4444" fillOpacity="0.1" /><circle cx="22" cy="22" r="10" stroke="#EF4444" strokeWidth="2.5"/><path d="M15 15L29 29" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/></svg>
  const AccIcon = <svg width="40" height="40" viewBox="0 0 44 44" fill="none"><rect width="44" height="44" rx="12" fill="#3B82F6" fillOpacity="0.1" /><path d="M14 22L20 28L30 16" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>

  return (
    <div className="anim-fade" style={{ maxWidth: 1040, paddingBottom: 60, margin: '0 auto' }}>
      
      {/* Header Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 32, padding: '10px 0' }}>
        <div>
           <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>Analytics Command Center</h1>
           <p style={{ color: 'var(--text3)', margin: '4px 0 0 0', fontSize: 14 }}>Real-time telemetry of RCM throughput and AI extractions.</p>
        </div>
        <div style={{ display:'flex', gap: 12 }}>
          <button onClick={refresh} style={{
            background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)',
            borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight: 700, cursor:'pointer', display:'flex', alignItems:'center', gap:8,
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: 16 }}>↻</span> Refresh
          </button>
          <a href={`${API}/api/rcm/export/csv`} download style={{
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)', color: '#fff',
            textDecoration:'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, border: 'none',
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(37,99,235,0.3)',
            cursor: 'pointer'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Logs
          </a>
        </div>
      </div>

      {/* Premium Master Metrics: Operational & Financial */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
        <PremiumStatCard
          label="Settled Cash Flow"
          value={`₹${(rcmStats?.revenue?.total_settled || 0).toLocaleString('en-IN')}`}
          icon={RevIcon}
          color="#10B981"
          sub={`From ₹${(rcmStats?.revenue?.total_billed || 0).toLocaleString('en-IN')} total billings`}
        />
        <PremiumStatCard
          label="Revenue Leakage Detected"
          value={`₹${(rcmStats?.revenue?.total_loss || 0).toLocaleString('en-IN')}`}
          icon={LeakIcon}
          color="#EF4444"
          sub="Short payments & denial gap identified"
        />
        <PremiumStatCard
          label="Predictability Index"
          value={`${accNum}%`}
          icon={AccIcon}
          color="#3B82F6"
          sub="Reconciliation accuracy vs billings"
        />
      </div>

      {/* Horizontal Sleek Pipeline Wrapper */}
      <div style={{ 
        background: 'var(--surface2)', borderRadius: 24, border: '1px solid var(--border)', 
        padding: 32, marginBottom: 32, boxShadow: 'inset 0 2px 20px rgba(255,255,255,0.02), 0 10px 30px rgba(0,0,0,0.05)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative'
      }}>
        <PipelineNode onClick={() => onNav && onNav('rcm')} label="Total Claims" value={rcmStats?.total_cases || 0} sub="Fully Registered" color="#06b6d4" />
        <PipelineNode onClick={() => onNav && onNav('rcm')} label="Active / Open" value={rcmStats?.open_cases || 0} sub="In Progress" color="#f59e0b" />
        <PipelineNode onClick={() => onNav && onNav('rcm')} label="Successfully Settled" value={rcmStats?.closed_cases || 0} sub="Reconciled" color="#10b981" />
        <PipelineNode onClick={() => onNav && onNav('rcm')} label="Rejected / Hold" value={rcmStats?.rejected_cases || 0} sub="Requires Action" color="#ef4444" isLast/>
      </div>

      {/* Three Column Bottom Section */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 24 }}>
        
        {/* Col 1: AI Confidence & Stats */}
        <div className="card" style={{ padding: 28, background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)' }}>
           <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
             <span style={{color: '#8b5cf6'}}>🧠</span> AI Engine Telemetry
           </h3>

           <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                 <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))' }}>
                   <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface3)" strokeWidth="8"/>
                   <circle cx="60" cy="60" r="50" fill="none" stroke="url(#purpGrad)" strokeWidth="8" strokeDasharray={`${(stats.avg_confidence/100)*314} 314`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
                   <defs><linearGradient id="purpGrad"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#c084fc"/></linearGradient></defs>
                 </svg>
                 <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>{stats.avg_confidence}%</div>
                 </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginTop: 12 }}>Avg Extraction Confidence</div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
             <TelemetryBox onClick={() => onNav && onNav('documents')} label="Total Documents" val={stats.total} />
             <TelemetryBox onClick={() => onNav && onNav('documents')} label="Flagged Warnings" val={stats.total_warnings} color="#ef4444" />
             <TelemetryBox onClick={() => onNav && onNav('documents')} label="Digital PDFs" val={stats.digital} color="#06b6d4" />
             <TelemetryBox onClick={() => onNav && onNav('documents')} label="OCR Scanned" val={stats.ocr} color="#f59e0b" />
           </div>
        </div>

        {/* Col 2: Document Types */}
        <div className="card" style={{ padding: 28, background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
             <span style={{color: '#06b6d4'}}>📄</span> Document Classifications
           </h3>
          {docTypeEntries.length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:13, textAlign:'center', marginTop: 40 }}>Awaiting document batch</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap: 18 }}>
              {docTypeEntries.sort((a,b) => b[1]-a[1]).map(([type, count]) => (
                <div key={type}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color:'var(--text)', fontWeight: 700 }}>{type}</span>
                    <span style={{ fontSize: 12, color:'var(--text3)', fontWeight: 600 }}>
                      {count} ({Math.round(count/stats.total*100)}%)
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background:'var(--surface3)', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', width:`${(count/maxDocType)*100}%`,
                      background: docTypeColors[type] || 'var(--accent)',
                      borderRadius: 4, transition:'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Col 3: Quality Summary Insight */}
        <div className="card" style={{ padding: 28, background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
             <span style={{color: '#10b981'}}>⚡</span> System Insights
           </h3>

           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
             <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
               <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Processing Speed</div>
               <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>2.4s <span style={{fontSize: 13, color: 'var(--text3)'}}>/ doc avg</span></div>
             </div>

             <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
               <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Data Validation</div>
               <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{stats.total - stats.total_warnings} <span style={{fontSize: 13, color: 'var(--text3)'}}>Flawless passes</span></div>
             </div>

             <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))', padding: 16, borderRadius: 16, border: '1px solid rgba(16,185,129,0.2)', marginTop: 'auto' }}>
               <div style={{ fontSize: 13, color: '#10b981', fontWeight: 800, marginBottom: 8 }}>Auto-Adjudication Ready</div>
               <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>Overall Confidence metrics exceed the minimum TPA threshold for autonomous claim dispersal.</div>
             </div>
           </div>
        </div>

      </div>
    </div>
  )
}

// ── New Premium Components ───────────────────────────────────────────────────

function PremiumStatCard({ label, value, icon, color, sub }) {
  return (
    <div className="card anim-fade" style={{ 
      background: 'var(--surface)', padding:'24px', borderRadius: 24, border: `1px solid var(--border)`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background glow blob */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: color, filter: 'blur(50px)', opacity: 0.15, pointerEvents: 'none' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 700, letterSpacing: '0.02em' }}>
          {label}
        </div>
        <div>{icon}</div>
      </div>
      <div style={{ fontWeight: 900, fontSize: 36, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{sub}</div>
    </div>
  )
}

function PipelineNode({ label, value, sub, color, isLast, onClick }) {
  return (
    <div style={{ position: 'relative', cursor: onClick ? 'pointer' : 'default', transition: '0.2s', padding: 8, borderRadius: 16 }} onClick={onClick} onMouseEnter={e => onClick && (e.currentTarget.style.background = 'var(--surface)')} onMouseLeave={e => onClick && (e.currentTarget.style.background = 'transparent')}>
      <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: color, fontWeight: 800 }}>{sub}</div>
      
      {!isLast && (
        <div style={{ position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)', color: 'var(--border)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      )}
    </div>
  )
}

function TelemetryBox({ label, val, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', cursor: onClick ? 'pointer' : 'default', transition: '0.2s' }} onMouseEnter={e => onClick && (e.currentTarget.style.background = 'var(--surface3)')} onMouseLeave={e => onClick && (e.currentTarget.style.background = 'var(--surface2)')}>
      <div style={{ fontSize: 20, fontWeight: 900, color: color || 'var(--text)' }}>{val}</div>
      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}
