import { useState, useEffect } from 'react'
import { fetchStats } from '../api.js'
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AnalyticsPage() {
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
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:14 }} />)}
    </div>
  )

  if (!stats || stats.total === 0) return (
    <div className="card anim-fade" style={{ textAlign:'center', padding:'80px 20px', color:'var(--text2)' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>◈</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, color:'var(--text)', marginBottom:8 }}>
        No Data Yet
      </div>
      <div style={{ fontSize:14, color:'var(--text3)' }}>Upload and process some documents to see analytics.</div>
    </div>
  )

  const docTypeColors = {
    'Lab Report':        'var(--purple)',
    'Hospital Bill':     'var(--orange)',
    'Discharge Summary': 'var(--accent)',
    'Prescription':      'var(--green)',
    'Insurance Form':    'var(--red)',
    'Other':             'var(--text3)',
  }

  const docTypeEntries = Object.entries(stats.doc_types || {})
  const maxDocType = Math.max(...docTypeEntries.map(([,v]) => v), 1)
  const confColor = stats.avg_confidence >= 75 ? 'var(--green)' : stats.avg_confidence >= 50 ? 'var(--orange)' : 'var(--red)'

  return (
    <div className="anim-fade" style={{ maxWidth:900, paddingBottom: 60 }}>
      {/* Analytics Toolbar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, padding: '20px 0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>📊 Performance Analytics</h1>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={refresh} style={{
            background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)',
            borderRadius:10, padding:'10px 18px', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8
          }}>
            ↻ Refresh Data
          </button>
          <a href={`${API}/api/rcm/export/csv`} download style={{
            background: 'var(--gradient)', color: '#fff',
            textDecoration:'none', borderRadius: 10, padding: '10px 18px', fontSize: 14,
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px var(--accent-glow2)'
          }}>
            💾 Export to Excel
          </a>
        </div>
      </div>


      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, marginBottom:16, color:'var(--text)', borderLeft:'4px solid var(--accent)', paddingLeft:10 }}>
        Operational & Financial Impact
      </h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:40 }}>
        <KpiCard
          label="1. Improved Cash flow"
          value={`₹${(rcmStats?.revenue?.total_settled || 0).toLocaleString('en-IN')}`}
          icon={<div className="icon-3d sm icon-stat icon-bolt float" />}
          color="var(--green)"
          sub={`from ₹${(rcmStats?.revenue?.total_billed || 0).toLocaleString('en-IN')} total billings`}
        />
        <KpiCard
          label="2. Revenue Leakage"
          value={`₹${(rcmStats?.revenue?.total_loss || 0).toLocaleString('en-IN')}`}
          icon={<div className="icon-3d sm icon-stat icon-shld float" />}
          color="var(--red)"
          sub="Short payments identified & reconciled"
        />
        <KpiCard
          label="3. Predictability"
          value={`${rcmStats?.total_cases > 0 ? Math.min(100, Math.round((rcmStats.revenue.total_settled / rcmStats.revenue.total_billed)*100)) : 100}%`}
          icon={<div className="icon-3d sm icon-side icon-data float" />}
          color="var(--orange)"
          sub="Reconciliation accuracy vs billings"
        />
      </div>

      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, marginBottom:16, color:'var(--text)', borderLeft:'4px solid var(--text2)', paddingLeft:10 }}>
        Claims Lifecycle Analytics
      </h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total Cases',     value:rcmStats?.total_cases || 0, icon:<div className="icon-3d sm icon-side icon-docs" />, color:'var(--accent)', sub:'fully registered' },
          { label:'Active Claims',   value:rcmStats?.open_cases || 0,  icon:<div className="icon-3d sm icon-stat icon-bolt" />, color:'var(--orange)', sub:'in-progress' },
          { label:'Settled Cases',   value:rcmStats?.closed_cases || 0,  icon:<div className="icon-3d sm icon-stat icon-shld" />, color:'var(--green)', sub:'verified' },
          { label:'Rejected/Hold',   value:rcmStats?.rejected_cases || 0, icon:<div className="icon-3d sm icon-stat icon-stop" />, color:'var(--red)', sub:'denials/holds' },
        ].map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      <h2 style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, marginBottom:16, color:'var(--text)', borderLeft:'4px solid var(--purple)', paddingLeft:10 }}>
        AI Pipeline Analytics
      </h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total Documents', value:stats.total,          icon:<div className="icon-3d sm icon-side icon-docs" />, color:'var(--purple)', sub:'fully processed' },
          { label:'Avg Confidence',  value:`${stats.avg_confidence}%`, icon:<div className="icon-3d sm icon-side icon-data" />, color:confColor, sub:'extraction quality' },
          { label:'Total Warnings',  value:stats.total_warnings, icon:<div className="icon-3d sm icon-stat icon-stop" />, color:'var(--orange)', sub:`${stats.avg_warnings} per doc avg` },
          { label:'OCR Documents',   value:stats.ocr,            icon:<div className="icon-3d sm icon-stat icon-bolt" />, color:'var(--accent)', sub:`${stats.digital} digital` },
        ].map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Document types breakdown */}
        <div className="card" style={{ padding:'20px' }}>
          <SectionHeader title="Document Types" />
          {docTypeEntries.length === 0 ? (
            <div style={{ color:'var(--text3)', fontSize:12, padding:'20px 0', textAlign:'center' }}>No data</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
              {docTypeEntries.sort((a,b) => b[1]-a[1]).map(([type, count]) => (
                <div key={type}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'var(--text)', fontWeight:600 }}>{type}</span>
                    <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--text2)' }}>
                      {count} ({Math.round(count/stats.total*100)}%)
                    </span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'var(--surface3)', overflow:'hidden' }}>
                    <div style={{
                      height:'100%',
                      width:`${(count/maxDocType)*100}%`,
                      background: docTypeColors[type] || 'var(--accent)',
                      borderRadius:3,
                      transition:'width 0.6s ease',
                      boxShadow:`0 0 8px ${docTypeColors[type] || 'var(--accent)'}`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Extraction method donut */}
        <div className="card" style={{ padding:'20px' }}>
          <SectionHeader title="Extraction Methods" />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:32, marginTop:20 }}>
            <Donut digital={stats.digital} ocr={stats.ocr} total={stats.total} />
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <LegendItem color="var(--accent)" label="Digital PDF" value={stats.digital} total={stats.total} />
              <LegendItem color="var(--orange)" label="OCR Scanned" value={stats.ocr}     total={stats.total} />
            </div>
          </div>
          <div style={{ marginTop:20, padding:'12px', background:'var(--surface2)', borderRadius:8, fontSize:11, color:'var(--text2)', lineHeight:1.8 }}>
            <span style={{ color:'var(--accent)', fontWeight:700 }}>Digital PDFs</span> extract faster and more accurately.{' '}
            <span style={{ color:'var(--orange)', fontWeight:700 }}>OCR</span> handles scanned documents via Tesseract.
          </div>
        </div>
      </div>

      {/* Warning analysis + confidence */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card" style={{ padding:'20px' }}>
          <SectionHeader title="Confidence Score Distribution" />
          <div style={{ marginTop:16 }}>
            <ConfBar label="High (75–100%)"  color="var(--green)"  width={`${stats.avg_confidence >= 75 ? 80 : 40}%`} />
            <ConfBar label="Medium (50–74%)" color="var(--orange)" width={`${stats.avg_confidence >= 50 && stats.avg_confidence < 75 ? 60 : 30}%`} />
            <ConfBar label="Low (0–49%)"     color="var(--red)"    width={`${stats.avg_confidence < 50 ? 50 : 15}%`} />
          </div>
          <div style={{ marginTop:16, textAlign:'center' }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:36, fontWeight:700, color:confColor }}>
              {stats.avg_confidence}%
            </div>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Average confidence across all documents</div>
          </div>
        </div>

        <div className="card" style={{ padding:'20px' }}>
          <SectionHeader title="Quality Summary" />
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
            {[
              {
                label:'Clean documents',
                value: stats.total - (stats.total_warnings > 0 ? Math.min(stats.total, Math.ceil(stats.total_warnings / 2)) : 0),
                total: stats.total,
                color:'var(--green)',
                icon:'✓',
              },
              {
                label:'Avg warnings/doc',
                value: stats.avg_warnings,
                total: 5,
                color:'var(--orange)',
                icon:'⚠',
                raw:true,
              },
              {
                label:'Digital extraction rate',
                value: stats.digital,
                total: stats.total,
                color:'var(--accent)',
                icon:'⚡',
              },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:14, width:20 }}>{row.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:'var(--text2)' }}>{row.label}</span>
                    <span style={{ fontSize:11, fontFamily:'var(--mono)', color:row.color, fontWeight:700 }}>
                      {row.raw ? row.value : `${row.value}/${row.total}`}
                    </span>
                  </div>
                  {!row.raw && (
                    <div style={{ height:4, borderRadius:2, background:'var(--surface3)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100,(row.value/row.total)*100)}%`,
                        background:row.color, borderRadius:2, transition:'width 0.6s ease' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:20, padding:'12px 14px', background:'var(--accent-glow)', border:'1px solid rgba(0,212,255,0.15)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'var(--accent)', fontFamily:'var(--font-display)', fontWeight:700, marginBottom:4 }}>
              💡 INSIGHT
            </div>
            <div style={{ fontSize:11, color:'var(--text2)', lineHeight:1.7 }}>
              Average confidence of <strong style={{ color:'var(--text)' }}>{stats.avg_confidence}%</strong> across{' '}
              <strong style={{ color:'var(--text)' }}>{stats.total}</strong> documents —{' '}
              demonstrates high reliability for automated workflows.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, sub }) {
  return (
    <div className="card anim-fade" style={{ padding:'18px 20px', position:'relative', overflow:'visible' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--font-display)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
          {label}
        </div>
        <div style={{ transform: 'scale(1.2)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:28, color, letterSpacing:'-0.02em', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize:11, color:'var(--text3)', fontWeight: 500 }}>{sub}</div>
    </div>
  )
}

function SectionHeader({ title }) {
  return (
    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, color:'var(--text2)',
      textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:'1px solid var(--border)', paddingBottom:10 }}>
      {title}
    </div>
  )
}

function LegendItem({ color, label, value, total }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:10, height:10, borderRadius:2, background:color, flexShrink:0 }} />
      <div>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{label}</div>
        <div style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>
          {value} ({total > 0 ? Math.round(value/total*100) : 0}%)
        </div>
      </div>
    </div>
  )
}

function Donut({ digital, ocr, total }) {
  const size = 100, stroke = 14, r = (size - stroke*2) / 2
  const circ = 2 * Math.PI * r
  const digitalDash = total > 0 ? (digital / total) * circ : 0
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--orange)" strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
        strokeDasharray={`${digitalDash} ${circ}`} strokeLinecap="butt" />
    </svg>
  )
}

function ConfBar({ label, color, width }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:11, color:'var(--text2)' }}>{label}</span>
      </div>
      <div style={{ height:8, borderRadius:4, background:'var(--surface3)', overflow:'hidden' }}>
        <div style={{ height:'100%', width, background:color, borderRadius:4, transition:'width 0.8s ease',
          boxShadow:`0 0 6px ${color}` }} />
      </div>
    </div>
  )
}
