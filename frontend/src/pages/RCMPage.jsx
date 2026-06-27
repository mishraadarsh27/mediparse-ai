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
    tpa_name: '', diagnosis: '', notes: '',
    admission_date: '', treating_doctor: '', room_category: '', estimated_amount: ''
  })

  async function handleFileUpload(file) {
    if (!file) return false
    setUploading(true)
    toast?.('🧠 AI extracting document & diagnosis details...', 'info')
    let success = false
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
        patient_id: f.patient?.uhid || f.patient?.id || prev.patient_id,
        phone: f.patient?.contact || f.patient?.phone || prev.phone,
        email: f.patient?.email || (typeof f.patient?.contact === 'string' && f.patient.contact.includes('@') ? f.patient.contact : prev.email),
        age: f.patient?.age || prev.age,
        gender: f.patient?.gender || prev.gender,
        hospital: f.hospital?.name || prev.hospital,
        insurance_provider: f.insurance?.provider || prev.insurance_provider,
        policy_number: f.insurance?.policy_number || f.insurance?.policy_no || prev.policy_number,
        tpa_name: f.insurance?.tpa_name || prev.tpa_name,
        diagnosis: f.diagnosis?.primary || (f.diagnosis?.length ? f.diagnosis[0]?.condition : '') || prev.diagnosis,
        admission_date: f.dates?.admission_date || f.dates?.document_date || prev.admission_date,
        treating_doctor: f.hospital?.doctor || f.referring_doctor || prev.treating_doctor,
        room_category: f.hospital?.ward_type || prev.room_category,
        estimated_amount: f.billing?.total_amount ? String(f.billing.total_amount).replace(/[^0-9.]/g, '') : prev.estimated_amount,
      }))
      toast?.('Fields auto-filled successfully!', 'success')
      success = true
    } catch {
      toast?.('Failed to extract from document.', 'error')
    }
    setUploading(false)
    return success
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
          {/* Card 1: Total Volume */}
          <div className="card" style={{
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:24, padding:'20px 24px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(37,99,235,0.2))' }}>
                <rect width="44" height="44" rx="12" fill="url(#grad1)" fillOpacity="0.1" />
                <path d="M14 12V32C14 33.1046 14.8954 34 16 34H28C29.1046 34 30 33.1046 30 32V18L24 12H16C14.8954 12 14 12.8954 14 14Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 12V18H30" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="grad1" x1="0" y1="0" x2="44" y2="44"><stop stopColor="#2563EB"/><stop offset="1" stopColor="#3B82F6"/></linearGradient></defs>
              </svg>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 12 }}>↗ +12.5%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
              <div>
                <div style={{ fontSize:36, fontWeight:800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{stats.total_cases}</div>
                <div style={{ fontSize:11, fontWeight: 700, color: 'var(--text3)', marginTop:6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL VOLUME</div>
              </div>
              <svg width="80" height="40" viewBox="0 0 80 40">
                <path d="M0,35 L15,25 L30,30 L45,15 L60,20 L80,5" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M75,5 L80,5 L80,10" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Card 2: Active Revenue */}
          <div className="card" style={{
            background:'linear-gradient(180deg, #ecfeff 0%, #ffffff 100%)', border:'1px solid rgba(6, 182, 212, 0.2)',
            borderRadius:24, padding:'20px 24px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(6, 182, 212, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(13,148,136,0.2))' }}>
                <rect width="44" height="44" rx="12" fill="url(#grad2)" fillOpacity="0.1" />
                <path d="M26 12L14 26H24L22 36L34 22H24L26 12Z" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="grad2" x1="0" y1="0" x2="44" y2="44"><stop stopColor="#0D9488"/><stop offset="1" stopColor="#14B8A6"/></linearGradient></defs>
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--green)', background: '#ffffff', padding: '4px 10px', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }}></div>
                Live
              </div>
            </div>
            <div style={{ position: 'absolute', right: 20, bottom: -10, width: 100, height: 100 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <path d="M20,80 A40,40 0 1,1 80,80" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="8" strokeLinecap="round"/>
                <path d="M20,80 A40,40 0 0,1 80,20" fill="none" stroke="url(#blue-grad)" strokeWidth="8" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', top: '35%', left: '0', width: '100%', textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                {stats.open_cases}
              </div>
            </div>
            <div style={{ marginTop: 24, position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize:36, fontWeight:800, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1 }}>{stats.open_cases}</div>
              <div style={{ fontSize:11, fontWeight: 700, color: '#475569', marginTop:6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIVE REVENUE</div>
            </div>
          </div>

          {/* Card 3: Settled Claims */}
          <div className="card" style={{
            background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:24, padding:'20px 24px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(16,185,129,0.2))' }}>
                <rect width="44" height="44" rx="12" fill="url(#grad3)" fillOpacity="0.1" />
                <path d="M22 12L14 16V24C14 28.5 17.5 32.5 22 34C26.5 32.5 30 28.5 30 24V16L22 12Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 23L21.5 25.5L25 20.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="grad3" x1="0" y1="0" x2="44" y2="44"><stop stopColor="#10B981"/><stop offset="1" stopColor="#34D399"/></linearGradient></defs>
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)' }}>
                ✓ 98% Success
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
              <div>
                <div style={{ fontSize:36, fontWeight:800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{stats.closed_cases}</div>
                <div style={{ fontSize:11, fontWeight: 700, color: 'var(--text3)', marginTop:6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SETTLED CLAIMS</div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 8 }}>
                <div style={{ width: '90%', height: '100%', background: '#3b82f6', borderRadius: 3 }}></div>
              </div>
              <div style={{ width: '80%', height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                <div style={{ width: '60%', height: '100%', background: '#93c5fd', borderRadius: 3 }}></div>
              </div>
            </div>
          </div>

          {/* Card 4: Declined */}
          <div className="card" style={{
            background:'linear-gradient(180deg, #fef2f2 0%, #ffffff 100%)', border:'1px solid rgba(239, 68, 68, 0.2)',
            borderRadius:24, padding:'20px 24px', position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(220,38,38,0.2))' }}>
                <rect width="44" height="44" rx="12" fill="url(#grad4)" fillOpacity="0.1" />
                <circle cx="22" cy="22" r="10" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 15L29 29" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs><linearGradient id="grad4" x1="0" y1="0" x2="44" y2="44"><stop stopColor="#DC2626"/><stop offset="1" stopColor="#EF4444"/></linearGradient></defs>
              </svg>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', background: '#ffffff', padding: '4px 10px', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                -2% this week
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 }}>
              <div>
                <div style={{ fontSize:36, fontWeight:800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{stats.rejected_cases}</div>
                <div style={{ fontSize:11, fontWeight: 700, color: 'var(--text3)', marginTop:6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DECLINED</div>
              </div>
              <svg width="80" height="40" viewBox="0 0 80 40">
                <path d="M0,5 L20,15 L40,10 L60,30 L80,25" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M0,5 L20,15 L40,10 L60,30 L80,25 L80,40 L0,40 Z" fill="url(#red-grad)" stroke="none"/>
                <defs>
                  <linearGradient id="red-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(239, 68, 68, 0.2)" />
                    <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Wizard TPA Form */}
      {showForm && (
        <NewCaseWizard 
           onCancel={() => setShowForm(false)} 
           onSave={handleCreate} 
           uploading={uploading} 
           onUpload={handleFileUpload} 
           form={form} 
           setForm={setForm} 
        />
      )}

      {/* Cases List */}
      <div style={{
        background: 'var(--surface2)',
        borderRadius: 32, padding: 40, marginTop: 24, paddingBottom: 60,
        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.02), 0 10px 30px rgba(0,0,0,0.02)',
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        position: 'relative'
      }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--text3)' }}>Loading cases...</div>
        ) : cases.length === 0 ? (
          <div style={{ textAlign:'center', padding: 60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏥</div>
            <div style={{ color:'var(--text)', fontWeight:700, fontSize:18 }}>No RCM Cases Yet</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {cases.filter(c => {
              const s = globalSearch || ''
              return !s || 
                c.patient_name?.toLowerCase().includes(s.toLowerCase()) || 
                c.id?.toLowerCase().includes(s.toLowerCase()) ||
                c.hospital?.toLowerCase().includes(s.toLowerCase())
            }).map(c => {
              const col = STATUS_COLOR[c.status] || '#10b981'
              return (
                <div key={c.id} onClick={() => onOpenCase(c.id)} className="card" style={{
                  background: 'var(--surface)',
                  backdropFilter: 'var(--glass)',
                  border: '1px solid var(--border)',
                  borderRadius: 24, padding: '28px',
                  display: 'flex', cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.3s'
                }}>
                  {/* Left Side Icons / Border styling - optional */}
                  <div style={{ width: 44, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingRight: 20, marginRight: 24 }}>
                    <div style={{ padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, color: '#3b82f6' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v16z"></path></svg>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, color: '#8b5cf6' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, color: '#10b981' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, color: '#f59e0b' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{c.patient_name || 'Aman Kumar'}</div>
                          <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>Patient Record Card</div>
                        </div>
                        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop" style={{ width: 44, height: 44, borderRadius: 12, border: '2px solid var(--border)', objectFit: 'cover' }} alt="" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600 }}>
                          ID: <span style={{ color: '#06b6d4' }}>{c.id.substring(0,8).toUpperCase()}</span>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text2)', cursor: 'pointer' }}>
                          ›
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: 24, marginTop: 32, marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Hospital</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.hospital || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6, marginTop: 24 }}>Admission</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.diagnosis || 'Routine'}</div>
                      </div>
                      
                      <div style={{ paddingLeft: 24, borderLeft: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Provider</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{c.insurance_provider || 'HDFC ERGO General Insurance'}</div>
                        
                        <div style={{ marginTop: 24 }}>
                          <div style={{ height: 4, background: 'var(--surface3)', borderRadius: 2, position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.max(10, (c.stage||1)/8*100)}%`, background: '#10b981', borderRadius: 2 }}></div>
                            <div style={{ position: 'absolute', left: `${Math.max(10, (c.stage||1)/8*100)}%`, top: -4, width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #10b981' }}></div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 10, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase' }}>
                            <span>PRE-AUTH</span>
                            <span style={{color: 'var(--text)'}}>ADMISSION</span>
                            <span>CLAIM</span>
                            <span>PAYOUT</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ paddingLeft: 24, borderLeft: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Payout / Stage</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{c.stage >= 6 ? '$'+(Math.floor(Math.random()*800)+200) : `Stage ${c.stage||1}`}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Status</span>
                        <span style={{ color: col, fontWeight: 800, fontSize: 18, textTransform: 'lowercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.status.replace(/_/g, ' ')}
                          <div style={{display:'flex', gap:3, opacity: 0.8, alignItems: 'center'}}>
                            <div style={{width: 3, height: 14, background: col, borderRadius: 2, animation: 'pulse 1s infinite'}}></div>
                            <div style={{width: 3, height: 8, background: col, borderRadius: 2, animation: 'pulse 1s infinite 0.2s'}}></div>
                            <div style={{width: 3, height: 18, background: col, borderRadius: 2, animation: 'pulse 1s infinite 0.4s'}}></div>
                            <div style={{width: 3, height: 12, background: col, borderRadius: 2, animation: 'pulse 1s infinite 0.6s'}}></div>
                          </div>
                        </span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); onOpenCase(c.id); }} style={{
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(30, 58, 138, 0.8))',
                        border: '1px solid rgba(59, 130, 246, 0.5)',
                        color: '#fff', padding: '10px 24px', borderRadius: 12,
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                      }}>
                        Patient Admitted
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function NewCaseWizard({ onCancel, onSave, uploading, onUpload, form, setForm }) {
  const [step, setStep] = useState(1)

  const inp = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, width: '100%',
    outline: 'none', fontFamily: 'inherit'
  }

  const handleInsuranceSelect = (insurance) => {
    setForm(f => ({ ...f, insurance_provider: insurance }))
    setStep(2)
  }

  const doUpload = async (e) => {
    const ok = await onUpload(e.target.files?.[0])
    if (ok) setStep(3)
  }

  return (
    <div className="card anim-fade" style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:24, padding:32, marginBottom:28, boxShadow:'0 10px 40px rgba(0,0,0,0.1)', position:'relative' }}>
      
      {/* Wizard Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px 0', letterSpacing:'-0.02em' }}>Initialize New TPA Case</h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: step >= 1 ? 'var(--accent)' : 'var(--text3)' }}>1. Provider</span>
            <span style={{ color: 'var(--border)' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: step >= 2 ? 'var(--accent)' : 'var(--text3)' }}>2. AI Extraction</span>
            <span style={{ color: 'var(--border)' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: step >= 3 ? 'var(--accent)' : 'var(--text3)' }}>3. Review & Submit</span>
          </div>
        </div>
        <button onClick={onCancel} style={{ background:'transparent', border:'none', color:'var(--text3)', cursor:'pointer', fontSize: 24 }}>✕</button>
      </div>

      {step === 1 && (
        <div className="anim-fade">
          <h3 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 16 }}>Select Patient's Insurance / TPA</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {INSURANCE_PROVIDERS.concat(TPA_LIST).slice(0,10).map(p => (
               <button key={p} onClick={() => handleInsuranceSelect(p)} style={{
                 background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px',
                 color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left',
                 transition: '0.2s'
               }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                 {p}
               </button>
            ))}
            <button onClick={() => setStep(2)} style={{
                 background: 'transparent', border: '1px dashed var(--border)', borderRadius: 12, padding: '16px',
                 color: 'var(--text3)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textAlign: 'left'
            }}>
              Other / Enter Manually ↗
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="anim-fade" style={{ background: 'var(--surface2)', padding: 40, borderRadius: 16, border: '1px dashed var(--border)', textAlign: 'center' }}>
           <div style={{ fontSize: 40, marginBottom: 16 }}>📑</div>
           <h3 style={{ fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Upload Medical & Diagnosis Reports</h3>
           <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>MediParse AI will automatically parse the patient details and diagnosis.</p>
           
           <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
             <label style={{
                background: 'linear-gradient(135deg,#2563EB,#06B6D4)', color: '#fff',
                padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                cursor: uploading ? 'wait' : 'pointer', boxShadow: '0 8px 20px rgba(37,99,235,0.2)'
             }}>
                {uploading ? '⏳ Processing Document...' : 'Upload PDF/Images'}
                <input type="file" accept=".pdf,.png,.jpg" style={{display:'none'}} onChange={doUpload} disabled={uploading} />
             </label>
             {!uploading && (
               <button onClick={() => setStep(3)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Skip & Enter Manually
               </button>
             )}
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="anim-fade">
          <datalist id="insurances">{INSURANCE_PROVIDERS.map(p=><option key={p} value={p}/>)}</datalist>
          <datalist id="tpas">{TPA_LIST.map(p=><option key={p} value={p}/>)}</datalist>
          <form onSubmit={onSave}>
             <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16, marginBottom:16 }}>
              {[
                ['patient_name','Patient Name','text',true],
                ['patient_id','Patient ID / UHID','text',false],
                ['phone','Phone Number','tel',true],
                ['email','Email Address','email',true],
              ].map(([k,l,t,req]) => (
                <div key={k}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>{l}{req&&' *'}</label>
                  <input required={req} type={t} style={inp} value={form[k]}
                    onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 80px', gap:16, marginBottom:16 }}>
              {[
                ['hospital','Hospital Name',''],
                ['insurance_provider','Provider / TPA','insurances'],
                ['policy_number','Policy Number',''],
                ['tpa_name','TPA Code (Optional)','tpas'],
              ].map(([k,l,dl]) => (
                <div key={k}>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>{l}</label>
                  <input type="text" list={dl||undefined} style={inp} value={form[k]}
                    onChange={e => setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div>
                 <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>Age *</label>
                 <input required type="number" style={inp} value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} />
              </div>
            </div>

            {/* **NEW EXTENDED FIELDS** */}
            <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:16 }}>
               <div>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>Treating Doctor / Surgeon</label>
                  <input type="text" style={inp} value={form.treating_doctor} onChange={e=>setForm(f=>({...f,treating_doctor:e.target.value}))} />
               </div>
               <div>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>Room Category</label>
                  <input type="text" style={inp} placeholder="e.g. Single Private" value={form.room_category} onChange={e=>setForm(f=>({...f,room_category:e.target.value}))} />
               </div>
               <div>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>Date of Admission / Procedure</label>
                  <input type="text" style={inp} placeholder="DD/MM/YYYY" value={form.admission_date} onChange={e=>setForm(f=>({...f,admission_date:e.target.value}))} />
               </div>
               <div>
                  <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>Estimated Amount (₹) *</label>
                  <input required type="number" style={{...inp, color: 'var(--green)', fontWeight: 800}} value={form.estimated_amount} onChange={e=>setForm(f=>({...f,estimated_amount:e.target.value}))} />
               </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: 20, borderRadius: 16, marginBottom: 24, display: 'grid', gridTemplateColumns:'2fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize:12, color:'#10b981', display:'flex', alignItems: 'center', gap: 6, marginBottom:6, fontWeight: 800 }}>
                  <span style={{ fontSize:16 }}>⚡</span> Primary Diagnosis & Medical Condition
                </label>
                <input type="text" style={{...inp, borderColor: 'rgba(16, 185, 129, 0.3)', background: 'var(--surface)'}} placeholder="E.g. Acute Appendicitis..." value={form.diagnosis}
                  onChange={e => setForm(f=>({...f,diagnosis:e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'var(--text3)', display:'block', marginBottom:6, fontWeight: 600 }}>Gender</label>
                <select style={{...inp}} value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setStep(2)} style={{ background:'transparent', border:'1px solid var(--border)', color:'var(--text2)', padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                ← Back
              </button>
              <button type="submit" style={{
                background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff',
                border:'none', borderRadius:10, padding:'12px 32px',
                fontSize:15, fontWeight:800, cursor:'pointer', boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
              }}>
                🚀 Authenticate & Submit TPA Case
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
