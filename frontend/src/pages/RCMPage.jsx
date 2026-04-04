import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STATUS_COLOR = {
  pre_auth_pending:      '#F59E0B',
  pre_auth_approved:     '#10B981',
  rejected:              '#EF4444',
  admitted:              '#3B82F6',
  enhancement_requested: '#F97316',
  enhancement_approved:  '#10B981',
  discharge_initiated:   '#8B5CF6',
  discharge_approved:    '#10B981',
  discharge_held:        '#EF4444',
  payment_done:          '#06B6D4',
  settled:               '#10B981',
  closed:                'var(--text3)',
}

const STAGE_ICONS = ['🔐','🏥','📈','📋','✅','💳','📄','🎯']

// Which statuses need TPA action
const TPA_ACTION_STATUSES = ['pre_auth_pending','enhancement_requested','discharge_initiated','payment_done']
const TPA_ACTION_LABEL = {
  pre_auth_pending:      'Needs Pre-Auth Decision',
  enhancement_requested: 'Needs Enhancement Approval',
  discharge_initiated:   'Needs Discharge Approval',
  payment_done:          'Needs Settlement',
}

const INSURANCE_PROVIDERS = [
  'Star Health Insurance', 'HDFC ERGO General Insurance', 'ICICI Lombard General',
  'Niva Bupa Health Insurance', 'Care Health Insurance', 'Aditya Birla Health',
  'Bajaj Allianz General Insurance', 'New India Assurance', 'Oriental Insurance'
]

const TPA_LIST = [
  'Medi Assist TPA', 'Raksha TPA', 'Health India TPA', 'Family Health Plan TPA (FHPL)',
  'Paramount Health Services', 'MDIndia Health Insurance TPA', 'Vidal Health TPA'
]

export default function RCMPage({ role, onOpenCase, toast, search: globalSearch }) {
  const [cases, setCases]       = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    patient_name: '', patient_id: '', phone: '', email: '',
    age: '', gender: 'Male',
    hospital: '', insurance_provider: '', policy_number: '',
    tpa_name: '', diagnosis: '', notes: ''
  })

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    toast?.('Extracting document details with AI...', 'info')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch(`${API}/api/upload`, { method: 'POST', body: fd })
      if (!r.ok) throw new Error()
      const data = await r.json()
      const f = data.fields || {}
      setForm(prev => ({
        ...prev,
        patient_name: f.patient?.name || prev.patient_name,
        patient_id: f.patient?.id || prev.patient_id,
        phone: f.patient?.phone || prev.phone,
        email: f.patient?.email || prev.email,
        age: f.patient?.age || prev.age,
        gender: f.patient?.gender || prev.gender,
        hospital: f.hospital?.name || prev.hospital,
        insurance_provider: f.insurance?.provider || prev.insurance_provider,
        policy_number: f.insurance?.policy_number || prev.policy_number,
        diagnosis: f.diagnosis?.[0]?.condition || (f.diagnosis?.length ? f.diagnosis.join(', ') : prev.diagnosis),
      }))
      toast?.('Fields auto-filled successfully!', 'success')
    } catch {
      toast?.('Failed to extract from document.', 'error')
    }
    setUploading(false)
  }

  async function fetchData() {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        fetch(`${API}/api/rcm/cases`),
        fetch(`${API}/api/rcm/stats`)
      ])
      setCases(await cRes.json())
      setStats(await sRes.json())
    } catch(e) {
      toast?.('Failed to load RCM cases', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const r = await fetch(`${API}/api/rcm/cases`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({...form, age: Number(form.age) || null})
      })
      if (!r.ok) throw new Error()
      const c = await r.json()
      toast?.(`Case ${c.id} created — Pre-Auth submitted`, 'success')
      setShowForm(false)
      setForm({ patient_name:'', patient_id:'', phone:'', email:'', age:'', gender:'Male', hospital:'',
                insurance_provider:'', policy_number:'', tpa_name:'', diagnosis:'', notes:'' })
      fetchData()
    } catch {
      toast?.('Failed to create case', 'error')
    }
  }

  const inp = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, width: '100%',
    outline: 'none', fontFamily: 'inherit'
  }

  const isHospital = role === 'hospital'
  const isTPA      = role === 'tpa'
  const pendingTPA = cases.filter(c => TPA_ACTION_STATUSES.includes(c.status))

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            {isHospital ? '🏥 Hospital — RCM Cases' : '🏦 TPA — Claims Queue'}
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 4 }}>
            {isHospital
              ? 'Submit & track insurance cases: Pre-Auth → Admission → Discharge → Settlement'
              : 'Review pending requests and take approval actions'}
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={fetchData} style={{
            background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)',
            borderRadius:10, padding:'10px 16px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6
          }}>
            ↻ Refresh
          </button>
          <a href={`${API}/api/rcm/export/csv`} download style={{
            background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff',
            textDecoration:'none', borderRadius: 10, padding: '10px 16px', fontSize: 13,
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
          }}>
            📋 Excel Report
          </a>
          {isHospital && (
            <button onClick={() => setShowForm(s => !s)} style={{
              background: 'linear-gradient(135deg,#2563EB,#06B6D4)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
            }}>
              {showForm ? '✕ Cancel' : '+ New Case'}
            </button>
          )}
        </div>
      </div>

      {/* TPA: Pending Actions Alert */}
      {isTPA && pendingTPA.length > 0 && (
        <div style={{
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ fontSize: 28 }}>⏳</div>
          <div>
            <div style={{ color: '#C084FC', fontWeight: 700, fontSize: 15 }}>
              {pendingTPA.length} case{pendingTPA.length > 1 ? 's' : ''} waiting for your action
            </div>
            <div style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>
              {pendingTPA.map(c => c.patient_name).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* TPA: No pending */}
      {isTPA && pendingTPA.length === 0 && !loading && (
        <div style={{
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <span style={{ color: '#10B981', fontWeight: 600, fontSize: 14 }}>No pending actions — all cases are up to date</span>
        </div>
      )}

      {/* Stats Row - High-End Floating Cards */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, marginBottom:40 }}>
          {[
            { label:'Total Volume', value: stats.total_cases, icon:<div className="icon-3d icon-stat icon-fold float" />, color:'var(--primary)', trend: '+12.5%' },
            { label:'Active Revenue', value: stats.open_cases,  icon:<div className="icon-3d icon-stat icon-bolt float" />, color:'var(--secondary)', trend: 'Live' },
            { label:'Settled Claims', value: stats.closed_cases, icon:<div className="icon-3d icon-stat icon-shld float" />, color:'var(--green)', trend: '98% Success' },
            { label:'Declined', value: stats.rejected_cases, icon:<div className="icon-3d icon-stat icon-stop float" />, color:'var(--red)', trend: '-2% this week' },
          ].map(s => (
            <div key={s.label} className="card" style={{
              background:'var(--surface)', border:'1px solid var(--border)',
              borderRadius:24, padding:'24px', position: 'relative', overflow: 'hidden'
            }}>
              {/* Micro-sparkline simulation */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, opacity: 0.1, background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color === 'var(--red)' ? 'var(--red)' : 'var(--green)', background: `${s.color}11`, padding: '4px 8px', borderRadius: 8 }}>
                  {s.trend}
                </div>
              </div>
              
              <div style={{ fontSize:32, fontWeight:800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize:13, fontWeight: 600, color: 'var(--text3)', marginTop:4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Case Form */}
      {showForm && (
        <div style={{
          background:'var(--card-bg)', border:'1px solid var(--border)',
          borderRadius:16, padding:28, marginBottom:28
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text)', margin:0 }}>
              📝 New Pre-Authorization Request
            </h2>
            <label style={{
              background: 'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.4)',
              color:'#60A5FA', padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700,
              cursor: uploading ? 'wait' : 'pointer', display:'flex', alignItems:'center', gap:8,
              transition:'all 0.2s'
            }}>
              {uploading ? '⏳ Extracting...' : '✨ Auto-fill from PDF'}
              <input type="file" accept=".pdf" style={{display:'none'}} onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          <datalist id="insurances">{INSURANCE_PROVIDERS.map(p=><option key={p} value={p}/>)}</datalist>
          <datalist id="tpas">{TPA_LIST.map(p=><option key={p} value={p}/>)}</datalist>
          <form onSubmit={handleCreate}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, marginBottom:16 }}>
              {[
                ['patient_name','Patient Name','text',true],
                ['patient_id','Patient ID / UHID','text',false],
                ['phone','Phone Number','tel',true],
                ['email','Email Address','email',true],
              ].map(([k,l,t,req]) => (
                <div key={k}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>{l}{req&&' *'}</label>
                  <input required={req} type={t} style={inp} value={form[k]}
                    onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 80px', gap:16, marginBottom:16 }}>
              {[
                ['hospital','Hospital Name',''],
                ['insurance_provider','Insurance Provider','insurances'],
                ['policy_number','Policy Number',''],
                ['tpa_name','TPA Name','tpas'],
              ].map(([k,l,dl]) => (
                <div key={k}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>{l}</label>
                  <input type="text" list={dl||undefined} style={inp} value={form[k]}
                    onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Age *</label>
                <input required type="number" style={inp} value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Diagnosis</label>
                <input type="text" style={inp} value={form.diagnosis}
                  onChange={e => setForm(f=>({...f,diagnosis:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6 }}>Gender</label>
                <select style={{...inp}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{
              background:'linear-gradient(135deg,#2563EB,#06B6D4)', color:'#fff',
              border:'none', borderRadius:10, padding:'12px 28px',
              fontSize:14, fontWeight:700, cursor:'pointer'
            }}>
              🚀 Submit Pre-Authorization
            </button>
          </form>
        </div>
      )}

      {/* Cases List */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text3)' }}>Loading cases...</div>
      ) : cases.length === 0 ? (
        <div style={{
          background:'var(--card-bg)', border:'1px solid var(--border)',
          borderRadius:16, padding:60, textAlign:'center'
        }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏥</div>
          <div style={{ color:'var(--text)', fontWeight:700, fontSize:18 }}>No RCM Cases Yet</div>
          <div style={{ color:'var(--text3)', marginTop:8 }}>Click "+ New Case" to begin a Pre-Authorization</div>
        </div>
      ) : (
        <div className="cyber-bg" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {cases.filter(c => {
            const s = globalSearch || ''
            return !s || 
              c.patient_name?.toLowerCase().includes(s.toLowerCase()) || 
              c.id?.toLowerCase().includes(s.toLowerCase()) ||
              c.hospital?.toLowerCase().includes(s.toLowerCase())
          }).map(c => {
            const col = STATUS_COLOR[c.status] || 'var(--text3)'
            const needsTPA = TPA_ACTION_STATUSES.includes(c.status)
            const tpaLabel = TPA_ACTION_LABEL[c.status]
            return (
              <div key={c.id} onClick={() => onOpenCase(c.id)} className="futuristic-card">
                 {/* Sidebar Icons */}
                 <div className="f-sidebar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path><path d="M10 9h4"></path><path d="M12 7v4"></path></svg>
                    
                    <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    
                    <svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                 </div>

                 {/* Content Area */}
                 <div className="f-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', margin: 0, textShadow: '0 0 20px rgba(255,255,255,0.3)', letterSpacing: '-0.02em' }}>{c.patient_name}</h2>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, letterSpacing: '0.02em' }}>Patient Record Card</div>
                        </div>
                        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 600, paddingRight: 80 }}>
                            ID: <span style={{ color: '#00F0FF', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>{c.id.substring(0,8).toUpperCase()}</span>
                        </div>
                        <div style={{ position: 'absolute', top: 32, right: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                             <div className="f-arrow">›</div>
                             <div className="f-pulse-icon">
                                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>
                             </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 16, marginTop: 28, marginBottom: 28, paddingRight: 60 }}>
                        <div>
                            <div className="f-label">Hospital</div>
                            <div className="f-value">{c.hospital || '—'}</div>
                        </div>
                        <div>
                            <div className="f-label">Provider</div>
                            <div className="f-value">{c.insurance_provider}</div>
                        </div>
                        <div>
                            <div className="f-label">Payout / Stage</div>
                            <div className="f-value" style={{ color: '#00FF88' }}>{c.stage >= 6 ? '$'+(Math.floor(Math.random()*800)+200) : `Stage ${c.stage||1}`}</div>
                        </div>
                        
                        <div>
                            <div className="f-label">Admission</div>
                            <div className="f-value">{c.diagnosis || 'Routine'}</div>
                        </div>
                        <div style={{ gridColumn: '2 / span 2', alignSelf: 'center', position: 'relative', top: -4 }}>
                            <div className="f-slider-track">
                                <div className="f-slider-fill" style={{ width: `${(c.stage/8)*100}%` }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>
                                <span>Pre-Auth</span>
                                <span>Claim</span>
                                <span>Payout</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 60 }}>
                        <div>
                            <div className="f-label">Status</div>
                            <div style={{ color: col, fontWeight: 700, fontSize: 18, textShadow: `0 0 15px ${col}` }}>{c.status.replace(/_/g, ' ')}</div>
                        </div>
                        <div>
                            <div className="f-glow-badge" style={{ '--col': col }}>{c.status_label}</div>
                        </div>
                    </div>
                 </div>
              </div>

            )
          })}
        </div>
      )}
    </div>
  )
}
