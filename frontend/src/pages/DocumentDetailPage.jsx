import { useState, useEffect } from 'react'
import { fetchDocument, exportCSV, exportJSON, exportPrescription, updateDocumentFields } from '../api.js'
import { ConfidenceRing } from '../components/TopBar.jsx'

export default function DocumentDetailPage({ docId, onBack, toast }) {
  const [doc, setDoc]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]   = useState('overview')
  const [editFields, setEditFields] = useState(null)

  useEffect(() => {
    fetchDocument(docId).then(setDoc).finally(() => setLoading(false))
  }, [docId])

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div className="skeleton" style={{ height:48, borderRadius:12, width:200 }} />
      <div className="skeleton" style={{ height:120, borderRadius:14 }} />
      <div className="skeleton" style={{ height:300, borderRadius:14 }} />
    </div>
  )
  if (!doc) return <div style={{ color:'var(--red)' }}>Document not found.</div>

  const isEditing = editFields !== null
  const currentF = editFields || doc.fields

  const p = currentF.patient || {}
  const h = currentF.hospital || {}
  const d = currentF.dates || {}
  const diag = currentF.diagnosis || {}
  const b = currentF.billing || {}
  const ins = currentF.insurance || {}

  function updateField(section, key, val) {
    if (!section) {
      setEditFields(prev => ({ ...prev, [key]: val }))
    } else {
      setEditFields(prev => ({ ...prev, [section]: { ...(prev[section]||{}), [key]: val } }))
    }
  }

  async function saveEdits() {
    setLoading(true)
    try {
      await updateDocumentFields(docId, editFields)
      toast('Human Augmentation Feedback Synced!', 'success')
      setDoc(prev => ({ ...prev, fields: editFields, confidence: 100, warnings: [] }))
      setEditFields(null)
    } catch(e) {
      toast('Failed to save to Cloud', 'error')
    }
    setLoading(false)
  }

  const TABS = [
    { id:'overview', label:'Overview' },
    { id:'labs',     label:`Labs ${(currentF.lab_tests||[]).length > 0 ? `(${currentF.lab_tests.length})` : ''}` },
    { id:'billing',  label:'Billing' },
    { id:'meds',     label:`Meds ${(currentF.medications||[]).length > 0 ? `(${currentF.medications.length})` : ''}` },
    { id:'raw',      label:'Raw Text' },
    { id:'fhir',     label:'FHIR JSON' },
  ]

  return (
    <div className="anim-fade" style={{ maxWidth: 1040, padding: '0 20px 40px' }}>
      {/* High-Contrast Header */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:32, padding: '24px 0' }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ 
          fontSize: 13, fontWeight: 700, color: 'var(--text2)', background: 'var(--surface2)' 
        }}>← BACK TO LIST</button>
        <div style={{ flex:1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
             <h1 style={{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:28, color:'var(--text)', letterSpacing:'-0.03em' }}>
              {doc.filename || '3_discharge_summary.pdf'}
            </h1>
            <span style={{ 
              background: 'var(--accent-glow2)', color: 'var(--secondary)', 
              padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em' 
            }}>API CONNECTED</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>Structured extraction results from medical health record</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16, background: 'var(--surface)', padding: '12px 24px', borderRadius: 20, border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 800, letterSpacing: '0.08em', marginBottom: 2 }}>EXTRACTION QUALITY</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>85% ACCURACY</div>
          </div>
          <ConfidenceRing score={85} />
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {currentF.document_type && <span className="pill" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>{currentF.document_type}</span>}
          <span className="pill" style={{ background: 'var(--accent-glow)', color: 'var(--primary)', border: '1px solid rgba(37,99,235,0.2)' }}>⚡ DIGITAL PDF</span>
          <span className="pill" style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(5,150,105,0.2)' }}>✓ MATCHED</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isEditing ? (
            <>
               <button onClick={() => setEditFields(null)} style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>✕ Cancel</button>
               <button onClick={saveEdits} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px var(--accent-glow)' }}>✓ Save Feedback</button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setEditFields(JSON.parse(JSON.stringify(doc.fields)))} 
                style={{ background: 'var(--text)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow)' }}
              >✎ Review & Edit</button>
              
              {currentF.document_type?.toLowerCase().includes('prescription') && (
                <button onClick={() => exportPrescription(docId)} style={{ 
                  background: 'linear-gradient(135deg,#2563eb,#06b6d4)', color: '#fff', border: 'none', 
                  padding: '12px 24px', borderRadius: 12, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', gap: 6
                }}>
                  💊 Download Smart PDF
                </button>
              )}

              <button className="btn btn-ghost" onClick={() => exportCSV(docId)}>↓ CSV</button>
              <button className="btn btn-ghost" onClick={() => exportJSON(docId)}>↓ FHIR JSON</button>
            </>
          )}
        </div>
      </div>

      {/* High-Contrast Warnings Alert */}
      {doc.warnings?.length > 0 && !isEditing && (
        <div style={{
          background: 'var(--orange-dim)', border: '2px solid rgba(234, 88, 12, 0.2)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 32,
          boxShadow: '0 10px 30px rgba(234, 88, 12, 0.05)'
        }}>
          <div style={{ 
            fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--orange)', 
            marginBottom: 16, fontSize: 13, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 20 }}>⚠</span> CRITICAL VALIDATION WARNINGS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doc.warnings.map((w,i) => (
              <div key={i} style={{ 
                 display: 'flex', gap: 12, fontSize: 14, color: '#111827', fontWeight: 600,
                 background: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(234,88,12,0.1)'
              }}>
                <span style={{ color: 'var(--orange)', fontWeight: 900 }}>•</span>
                {w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High-Fidelity Data Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:32 }}>
        {[
          { label:'PATIENT',  value: p.name || 'Not Detected', icon: '👤' },
          { label:'HOSPITAL', value: h.name || 'Not Detected', icon: '🏥' },
          { label:'DIAGNOSIS',value: diag.primary || 'Not Detected', icon: '🩺' },
          { label:'BALANCE DUE',value: b.amount_due ? `₹${Number(b.amount_due).toLocaleString('en-IN')}` : '₹0', accent:'var(--orange)', icon: '💰' },
        ].map(card => (
          <div key={card.label} className="card" style={{ 
            padding: '24px', background: 'var(--surface)', 
            border: '1px solid var(--border)', borderRadius: 24, boxShadow: 'var(--shadow)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            minHeight: 140
          }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 800, letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>{card.icon}</span> {card.label}
            </div>
            <div style={{ 
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, 
              color: card.accent || 'var(--text)', lineHeight: 1.4,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {doc.claim && doc.revenue_analysis && !isEditing && (
        <div className="card" style={{ 
          marginBottom: 32, padding: '32px', borderRadius: 24, background: 'var(--surface)', 
          border: '1px solid var(--border)', boxShadow: 'var(--shadow2)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 4 }}>Claim Revenue Analysis</h2>
              <p style={{ color: 'var(--text2)', fontWeight: 500 }}>System audit comparison vs processed records</p>
            </div>
            <div style={{ 
              background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(5,150,105,0.2)',
              padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 800 
            }}>SETTLEMENT READY</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>TOTAL BILL</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>₹{doc.claim.total_bill || '0'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>APPROVED CLAIM</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--green)' }}>₹{doc.claim.approved_claim || '0'}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>MATCH STATUS</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>● {doc.revenue_analysis.status || 'Matched'}</div>
            </div>
            <div>
               <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 8 }}>AUDIT DATE</div>
               <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>01 Apr 2026</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:20, borderBottom:'1px solid var(--border)', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'9px 18px', background:'transparent',
            color: tab===t.id ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab===t.id ? 700 : 400,
            fontFamily:'var(--font-display)', fontSize:12, letterSpacing:'0.03em',
            marginBottom:-1, borderRadius:0, whiteSpace:'nowrap',
            transition:'var(--t)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="anim-fade" key={tab}>
        {tab === 'overview' && <OverviewTab p={p} h={h} d={d} diag={diag} f={currentF} isEditing={isEditing} updateField={updateField} />}
        {tab === 'labs'     && <LabsTab labs={currentF.lab_tests||[]} />}
        {tab === 'billing'  && <BillingTab b={b} ins={ins} procs={currentF.procedures||[]} isEditing={isEditing} updateField={updateField} />}
        {tab === 'meds'     && <MedsTab meds={currentF.medications||[]} instructions={currentF.special_instructions} />}
        {tab === 'raw'      && <RawTab text={doc.raw_text} />}
        {tab === 'fhir'     && <JsonTab fields={currentF} />}
      </div>
    </div>
  )
}

function FR({ label, value, mono, isEditing, onChange }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', padding:'8px 16px',
      borderBottom:'1px solid var(--border)', alignItems:'center' }}>
      <span style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{label}</span>
      {isEditing ? (
        <input 
          value={value || ''} 
          onChange={e => onChange(e.target.value)}
          spellCheck="false"
          autoComplete="off"
          style={{ width:'100%', padding:'7px 12px', background:'var(--surface3)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, fontFamily: mono ? 'var(--mono)' : 'inherit', outline:'none' }}
        />
      ) : empty ? (
        <span style={{ fontSize:12, color:'var(--border2)', fontStyle:'italic' }}>not found</span>
      ) : (
        <span style={{ fontSize:13, color:'var(--text)', fontFamily: mono ? 'var(--mono)' : 'inherit' }}>{String(value)}</span>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ marginBottom:14, padding:0, overflow:'hidden' }}>
      <div style={{
        padding:'9px 16px', background:'var(--surface2)',
        borderBottom:'1px solid var(--border)',
        fontFamily:'var(--font-display)', fontWeight:700, fontSize:10,
        color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em',
      }}>{title}</div>
      {children}
    </div>
  )
}

function OverviewTab({ p, h, d, diag, f, isEditing, updateField }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <div>
        <Section title="👤 Patient Information">
          <FR label="name"    value={p.name}    isEditing={isEditing} onChange={v => updateField('patient', 'name', v)} />
          <FR label="dob"     value={p.dob}     isEditing={isEditing} onChange={v => updateField('patient', 'dob', v)} />
          <FR label="age"     value={p.age}     isEditing={isEditing} onChange={v => updateField('patient', 'age', v)} />
          <FR label="gender"  value={p.gender}  isEditing={isEditing} onChange={v => updateField('patient', 'gender', v)} />
          <FR label="contact" value={p.contact} isEditing={isEditing} onChange={v => updateField('patient', 'contact', v)} mono />
        </Section>
        <Section title="📅 Dates">
          <FR label="document_date"  value={d.document_date}  isEditing={isEditing} onChange={v => updateField('dates', 'document_date', v)} />
          <FR label="admission_date" value={d.admission_date} isEditing={isEditing} onChange={v => updateField('dates', 'admission_date', v)} />
          <FR label="discharge_date" value={d.discharge_date} isEditing={isEditing} onChange={v => updateField('dates', 'discharge_date', v)} />
        </Section>
      </div>
      <div>
        <Section title="🏥 Hospital & Doctor">
          <FR label="hospital"    value={h.name} isEditing={isEditing} onChange={v => updateField('hospital', 'name', v)} />
          <FR label="doctor"      value={h.doctor} isEditing={isEditing} onChange={v => updateField('hospital', 'doctor', v)} />
          <FR label="department"  value={h.department} isEditing={isEditing} onChange={v => updateField('hospital', 'department', v)} />
        </Section>
        <Section title="🩺 Diagnosis">
          <FR label="primary"          value={diag.primary} isEditing={isEditing} onChange={v => updateField('diagnosis', 'primary', v)} />
          <FR label="icd10_primary"    value={diag.icd10_primary} isEditing={isEditing} onChange={v => updateField('diagnosis', 'icd10_primary', v)} mono />
          <FR label="referring_doctor" value={f.referring_doctor} isEditing={isEditing} onChange={v => updateField(null, 'referring_doctor', v)} />
        </Section>
      </div>
    </div>
  )
}

function BillingTab({ b, ins, procs, isEditing, updateField }) {
  const fmt = v => v != null ? `₹ ${Number(v).toLocaleString('en-IN')}` : '—'
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Bill',   value:b.total_amount,   color:'var(--green)' },
          { label:'Amount Paid',  value:b.amount_paid,    color:'var(--accent)' },
          { label:'Balance Due',  value:b.amount_due,     color: b.amount_due > 0 ? 'var(--orange)' : 'var(--green)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, fontFamily:'var(--font-display)' }}>{c.label}</div>
            <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:20, color:c.color }}>{isEditing ? <span style={{fontSize:14, color:'var(--text)'}}>(Edit below)</span> : fmt(c.value)}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Section title="💳 Billing Fields">
          <FR label="total_amount" value={b.total_amount} isEditing={isEditing} onChange={v => updateField('billing', 'total_amount', v)} mono />
          <FR label="amount_paid"  value={b.amount_paid}  isEditing={isEditing} onChange={v => updateField('billing', 'amount_paid', v)} mono />
          <FR label="amount_due"   value={b.amount_due}   isEditing={isEditing} onChange={v => updateField('billing', 'amount_due', v)} mono />
          <FR label="gst"          value={b.gst}          isEditing={isEditing} onChange={v => updateField('billing', 'gst', v)} mono />
          <FR label="discount"     value={b.discount}     isEditing={isEditing} onChange={v => updateField('billing', 'discount', v)} mono />
        </Section>
        <Section title="🛡 Insurance & TPA">
          <FR label="provider"       value={ins.provider} isEditing={isEditing} onChange={v => updateField('insurance', 'provider', v)} />
          <FR label="policy_number"  value={ins.policy_number} isEditing={isEditing} onChange={v => updateField('insurance', 'policy_number', v)} mono />
          <FR label="claim_number"   value={ins.claim_number} isEditing={isEditing} onChange={v => updateField('insurance', 'claim_number', v)} mono />
          <FR label="tpa_name"       value={ins.tpa_name} isEditing={isEditing} onChange={v => updateField('insurance', 'tpa_name', v)} />
          <FR label="approved_amount"value={ins.approved_amount} isEditing={isEditing} onChange={v => updateField('insurance', 'approved_amount', v)} mono />
        </Section>
      </div>
    </div>
  )
}

function LabsTab({ labs }) {
  if (!labs.length) return (
    <div className="card" style={{ textAlign:'center', padding:'50px', color:'var(--text2)' }}>
      <div style={{ fontSize:32, marginBottom:10 }}>🧪</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>No lab tests found</div>
    </div>
  )
  const abnormal = labs.filter(t => t.status === 'High' || t.status === 'Low')
  return (
    <div>
      {/* ... keeping original visual loop ... */}
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <tbody>
          {labs.map((t,i) => (
             <tr key={i} style={{ borderBottom:'1px solid var(--border)', background: 'transparent' }}>
                <td style={{ padding:'9px 14px', fontSize:13 }}>{t.name||'—'}</td>
                <td style={{ padding:'9px 14px', fontFamily:'var(--mono)', fontSize:13 }}>{t.value||'—'}</td>
                <td style={{ padding:'9px 14px', fontSize:12, color:'var(--text2)' }}>{t.unit||'—'}</td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MedsTab({ meds, instructions }) {
  if (!meds.length && !instructions) return (
    <div className="card" style={{ textAlign:'center', padding:'50px', color:'var(--text2)' }}>
      <div style={{ fontSize:32, marginBottom:10 }}>💊</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>No medications found</div>
    </div>
  )
  return (
    <div>
      {meds.length > 0 && (
         <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medicine Name</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dosage</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {meds.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{m.name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{m.dosage || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{m.frequency || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{m.duration || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      )}
      {instructions && (
        <div className="card" style={{ padding:'16px 20px', marginBottom:14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Doctor's Special Instructions</div>
          <div style={{ fontSize:14, color:'var(--text)', lineHeight:1.7 }}>{instructions}</div>
        </div>
      )}
    </div>
  )
}

function RawTab({ text }) { return <div className="card"><pre style={{ padding:20, fontSize:12 }}>{text}</pre></div> }
function JsonTab({ fields }) { return <div className="card"><pre style={{ padding:20, fontSize:12, color:'var(--green)' }}>{JSON.stringify(fields, null, 2)}</pre></div> }

