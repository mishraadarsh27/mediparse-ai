import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const WORKFLOW = [
  { stage:1, key:'pre_auth',             label:'Pre-Authorization',    icon:'🔐', desc:'Documents submitted to TPA for initial approval' },
  { stage:2, key:'admission',            label:'Patient Admission',     icon:'🏥', desc:'Patient admitted, admission number generated' },
  { stage:3, key:'enhancement',          label:'Enhancement',           icon:'📈', desc:'Enhancement request if treatment cost increases' },
  { stage:4, key:'discharge_initiated',  label:'Discharge Intimation',  icon:'📋', desc:'Hospital informs TPA — discharge summary + final bill ready' },
  { stage:5, key:'discharge_approved',   label:'Discharge Approval',    icon:'✅', desc:'TPA approves discharge, copay & deductions calculated' },
  { stage:6, key:'payment',              label:'Payment & Discharge',   icon:'💳', desc:'Patient pays copay, hospital processes discharge' },
  { stage:7, key:'settlement',           label:'Settlement',            icon:'📄', desc:'TPA sends UTR + settlement letter' },
  { stage:8, key:'closed',               label:'Case Closed',           icon:'🎯', desc:'Finance entry done, case closed' },
]

const STATUS_COLOR = {
  pre_auth_pending:'#F59E0B', pre_auth_approved:'#10B981', rejected:'#EF4444',
  admitted:'#3B82F6', enhancement_requested:'#F97316', enhancement_approved:'#10B981',
  discharge_initiated:'#8B5CF6', discharge_approved:'#10B981', discharge_held:'#EF4444',
  payment_done:'#06B6D4', settled:'#10B981', closed:'#64748B',
}

const inp = {
  background:'var(--surface2)', border:'1px solid var(--border)',
  borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, width:'100%',
  outline:'none', fontFamily:'inherit', boxSizing:'border-box'
}

function ActionPanel({ caseData, onAction, role }) {
  const { status } = caseData
  const [vals, setVals] = useState({})
  const set = (k,v) => setVals(p=>({...p,[k]:v}))
  const isHospital = role === 'hospital'

  const sections = {
    pre_auth_pending: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>TPA Decision on Pre-Authorization</h4>
        <input type="number" placeholder="Approved Amount (₹)" className="premium-inp"
          value={vals.approved_amount||''} onChange={e=>set('approved_amount',e.target.value)} />
        <input type="text" placeholder="Remarks (optional)" className="premium-inp"
          value={vals.remarks||''} onChange={e=>set('remarks',e.target.value)} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => onAction('approve-preauth',{approved_amount:Number(vals.approved_amount||0),remarks:vals.remarks||''})}
            className="premium-btn" style={{background: "#10B981"}}>✅ Approve</button>
          <button onClick={() => onAction('reject',{reason:vals.remarks||''})}
            className="premium-btn" style={{background: "#EF4444"}}>❌ Reject</button>
        </div>
      </div>
    ),
    pre_auth_approved: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>Admit Patient</h4>
        <p style={{ color:'var(--text2)', fontSize:13, margin:0 }}>Click below to confirm patient admission to the TPA.</p>
        <button onClick={() => onAction('admit', { diagnosis: '', ward: 'General' })}
          className="premium-btn" style={{background: "#3B82F6"}}>🏥 Confirm Admission</button>
      </div>
    ),
    admitted: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>Next Step</h4>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'0 0 8px' }}>Raise Enhancement (if cost increased)</p>
            <input type="number" placeholder="Provisional Bill (₹)" className="premium-inp"
              value={vals.provisional_bill||''} onChange={e=>set('provisional_bill',e.target.value)} />
            <input type="text" placeholder="Reason" className="premium-inp" style={{marginTop:8}}
              value={vals.enh_reason||''} onChange={e=>set('enh_reason',e.target.value)} />
            <label style={{ display:'block', marginTop:8, background:'var(--surface2)', border:'2px dashed var(--border)', padding:'24px 16px', borderRadius:16, transition:'all 0.3s', textAlign:'center', cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
              {vals.enh_docs ? `📄 ${vals.enh_docs.length} file(s) attached` : '📎 Attach Clinical Notes (PDF)'}
              <input type="file" multiple accept=".pdf" style={{display:'none'}} onChange={e=>set('enh_docs', Array.from(e.target.files))} />
            </label>
            <button onClick={() => onAction('enhancement',{provisional_bill:Number(vals.provisional_bill||0),reason:vals.enh_reason||'', documents: vals.enh_docs?.map(f=>f.name)||[]})}
              className="premium-btn" style={{background: "#F97316", marginTop:8, width:'100%'}}>📈 Raise Enhancement</button>
          </div>
          <div style={{ width:1, background:'var(--border)' }} />
          <div style={{ flex:1 }}>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'0 0 8px' }}>Or — Proceed to Discharge</p>
            <input type="number" placeholder="Final Bill Amount (₹)" className="premium-inp"
              value={vals.final_bill||''} onChange={e=>set('final_bill',e.target.value)} />
            <label style={{ display:'block', marginTop:8, background:'var(--surface2)', border:'2px dashed var(--border)', padding:'24px 16px', borderRadius:16, transition:'all 0.3s', textAlign:'center', cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
              {vals.docs ? `📄 ${vals.docs.length} file(s) attached` : '📎 Attach Final Bill & Summary (PDF)'}
              <input type="file" multiple accept=".pdf" style={{display:'none'}} onChange={e=>set('docs', Array.from(e.target.files))} />
            </label>
            <button onClick={() => onAction('discharge-intimation',{final_bill:Number(vals.final_bill||0), documents: vals.docs?.map(f=>f.name)||[]})}
              className="premium-btn" style={{background: "#8B5CF6", marginTop:8, width:'100%'}}>📋 Send Discharge Intimation</button>
          </div>
        </div>
      </div>
    ),
    enhancement_requested: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>TPA Enhancement Decision</h4>
        
        <div style={{ padding:'12px', background:'rgba(249,115,22,0.1)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10 }}>
          <div style={{ fontSize:11, color:'#F97316', marginBottom:6, fontWeight:700 }}>Hospital's Request details</div>
          <div style={{ fontSize:13, color:'var(--text)', display:'flex', justifyContent:'space-between' }}>
            <span>Provisional Bill Requested:</span>
            <span style={{fontWeight:700, fontFamily:'var(--mono)'}}>₹{caseData.enhancement?.provisional_bill}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>
            Reason: {caseData.enhancement?.reason || 'None provided'}
          </div>
          {caseData.enhancement?.documents?.length > 0 && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(249,115,22,0.2)' }}>
              <div style={{ fontSize:11, color:'#F97316', marginBottom:4 }}>Attached Documents</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {caseData.enhancement.documents.map(d=><span key={d} style={{background:'rgba(249,115,22,0.15)', color:'#FDBA74', padding:'4px 8px', borderRadius:4, fontSize:11}}>📄 {d}</span>)}
              </div>
            </div>
          )}
        </div>

        <input type="number" placeholder="Approve Amount (₹)" className="premium-inp"
          value={vals.approved_amount||''} onChange={e=>set('approved_amount',e.target.value)} />
        <button onClick={() => onAction('approve-enhancement',{approved_amount:Number(vals.approved_amount||0)})}
          className="premium-btn" style={{background: "#10B981"}}>✅ Approve Enhancement</button>
      </div>
    ),
    enhancement_approved: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>Next Step</h4>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ flex:1 }}>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'0 0 8px' }}>Raise Another Enhancement</p>
            <input type="number" placeholder="Provisional Bill (₹)" className="premium-inp"
              value={vals.provisional_bill||''} onChange={e=>set('provisional_bill',e.target.value)} />
            <input type="text" placeholder="Reason" className="premium-inp" style={{marginTop:8}}
              value={vals.enh_reason||''} onChange={e=>set('enh_reason',e.target.value)} />
            <label style={{ display:'block', marginTop:8, background:'var(--surface2)', border:'2px dashed var(--border)', padding:'24px 16px', borderRadius:16, transition:'all 0.3s', textAlign:'center', cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
              {vals.enh_docs ? `📄 ${vals.enh_docs.length} file(s) attached` : '📎 Attach Clinical Notes (PDF)'}
              <input type="file" multiple accept=".pdf" style={{display:'none'}} onChange={e=>set('enh_docs', Array.from(e.target.files))} />
            </label>
            <button onClick={() => onAction('enhancement',{provisional_bill:Number(vals.provisional_bill||0),reason:vals.enh_reason||'', documents: vals.enh_docs?.map(f=>f.name)||[]})}
              className="premium-btn" style={{background: "#F97316", marginTop:8, width:'100%'}}>📈 Raise Enhancement</button>
          </div>
          <div style={{ width:1, background:'var(--border)' }} />
          <div style={{ flex:1 }}>
            <p style={{ color:'var(--text2)', fontSize:13, margin:'0 0 8px' }}>Or — Proceed to Discharge</p>
            <input type="number" placeholder="Final Bill Amount (₹)" className="premium-inp"
              value={vals.final_bill||''} onChange={e=>set('final_bill',e.target.value)} />
            <label style={{ display:'block', marginTop:8, background:'var(--surface2)', border:'2px dashed var(--border)', padding:'24px 16px', borderRadius:16, transition:'all 0.3s', textAlign:'center', cursor:'pointer', fontSize:12, color:'var(--text2)' }}>
              {vals.docs ? `📄 ${vals.docs.length} file(s) attached` : '📎 Attach Final Bill & Summary (PDF)'}
              <input type="file" multiple accept=".pdf" style={{display:'none'}} onChange={e=>set('docs', Array.from(e.target.files))} />
            </label>
            <button onClick={() => onAction('discharge-intimation',{final_bill:Number(vals.final_bill||0), documents: vals.docs?.map(f=>f.name)||[]})}
              className="premium-btn" style={{background: "#8B5CF6", marginTop:8, width:'100%'}}>📋 Send Discharge Intimation</button>
          </div>
        </div>
      </div>
    ),
    discharge_initiated: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>TPA Discharge Decision</h4>
        
        <div style={{ padding:'12px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:10 }}>
          <div style={{ fontSize:11, color:'#C084FC', marginBottom:6, fontWeight:700 }}>Hospital's Initial Final Bill</div>
          <div style={{ fontSize:13, color:'var(--text)', display:'flex', justifyContent:'space-between' }}>
            <span>Final Bill Sent:</span>
            <span style={{fontWeight:700, fontFamily:'var(--mono)'}}>₹{caseData.discharge?.final_bill}</span>
          </div>
          {caseData.discharge?.documents?.length > 0 && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ fontSize:11, color:'#C084FC', marginBottom:4 }}>Attached Documents</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {caseData.discharge.documents.map(d=><span key={d} style={{background:'rgba(139,92,246,0.15)', color:'#D8B4FE', padding:'4px 8px', borderRadius:4, fontSize:11}}>📄 {d}</span>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input type="number" placeholder="Copay (₹)" className="premium-inp"
            value={vals.copay||''} onChange={e=>set('copay',e.target.value)} />
          <input type="number" placeholder="Deductions (₹)" className="premium-inp"
            value={vals.deductions||''} onChange={e=>set('deductions',e.target.value)} />
        </div>
        <input type="text" placeholder="Deduction Reason / Notes" className="premium-inp" style={{marginBottom:8}}
            value={vals.deduction_remarks||''} onChange={e=>set('deduction_remarks',e.target.value)} />
        <input type="text" placeholder="Hold Reason (if holding)" className="premium-inp" style={{marginBottom:8}} 
            value={vals.hold_reason||''} onChange={e=>set('hold_reason',e.target.value)} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => onAction('discharge-approval',{copay:Number(vals.copay||0),deductions:Number(vals.deductions||0), remarks: vals.deduction_remarks||''})}
            className="premium-btn" style={{background: "#10B981"}}>✅ Approve Discharge</button>
          <button onClick={() => onAction('discharge-hold',{reason:vals.hold_reason||'Under Review'})}
            className="premium-btn" style={{background: "#EF4444"}}>⏸ Hold</button>
        </div>
      </div>
    ),
    discharge_held: isHospital ? (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'#EF4444', margin:0 }}>Discharge On Hold by TPA</h4>
        <div style={{ padding:'12px', background:'rgba(239, 68, 68, 0.1)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:10 }}>
          <div style={{ fontSize:13, color:'#FCA5A5' }}>
            Reason: {caseData.discharge?.hold_reason || 'Under TPA Review'}
          </div>
        </div>
        <p style={{ color:'var(--text2)', fontSize:13, margin:0 }}>
          TPA is reviewing the claim. To avoid patient delay, you can collect the full bill as a deposit (Self-Pay) and discharge the patient immediately.
        </p>
        <button onClick={() => onAction('convert-self-pay')}
          className="premium-btn" style={{background: "#F59E0B", width:'100%'}}>💵 Convert to Self-Pay & Discharge</button>
      </div>
    ) : (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'#EF4444', margin:0 }}>Discharge On Hold</h4>
        <div style={{ padding:'12px', background:'rgba(239, 68, 68, 0.1)', border:'1px solid rgba(239, 68, 68, 0.2)', borderRadius:10, marginBottom:8 }}>
          <div style={{ fontSize:13, color:'#FCA5A5' }}>
            Hold Reason: {caseData.discharge?.hold_reason || 'Under Review'}
          </div>
        </div>
        <p style={{ color:'var(--text2)', fontSize:13, margin:0 }}>Review hospital documents and finalize discharge approval.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input type="number" placeholder="Copay (₹)" className="premium-inp"
            value={vals.copay||''} onChange={e=>set('copay',e.target.value)} />
          <input type="number" placeholder="Deductions (₹)" className="premium-inp"
            value={vals.deductions||''} onChange={e=>set('deductions',e.target.value)} />
        </div>
        <input type="text" placeholder="Deduction Reason / Notes" className="premium-inp" style={{marginBottom:8}}
            value={vals.deduction_remarks||''} onChange={e=>set('deduction_remarks',e.target.value)} />
        <button onClick={() => onAction('discharge-approval',{copay:Number(vals.copay||0),deductions:Number(vals.deductions||0), remarks: vals.deduction_remarks||''})}
          className="premium-btn" style={{background: "#10B981", width:'100%'}}>✅ Approve Discharge</button>
      </div>
    ),
    discharge_approved: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>Process Payment & Discharge</h4>
        <p style={{ color:'var(--text2)', fontSize:13, margin:0 }}>
          Patient pays Copay + Deductions. Click to confirm payment received and discharge patient.
        </p>
        <button onClick={() => onAction('payment',{})}
          className="premium-btn" style={{background: "#06B6D4"}}>💳 Confirm Payment & Discharge</button>
      </div>
    ),
    payment_done: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <h4 style={{ color:'var(--text)', margin:0 }}>Record TPA Settlement</h4>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input type="text" placeholder="UTR Number" className="premium-inp"
            value={vals.utr_number||''} onChange={e=>set('utr_number',e.target.value)} />
          <input type="date" className="premium-inp"
            value={vals.utr_date||''} onChange={e=>set('utr_date',e.target.value)} />
          <input type="number" placeholder="TDS (₹)" className="premium-inp"
            value={vals.tds||''} onChange={e=>set('tds',e.target.value)} />
          <input type="number" placeholder="Final Paid Amount (₹)" className="premium-inp"
            value={vals.final_paid||''} onChange={e=>set('final_paid',e.target.value)} />
        </div>
        <input type="text" placeholder="Settlement Remarks (e.g. why short payment?)" className="premium-inp" style={{marginTop:10}}
            value={vals.sett_remarks||''} onChange={e=>set('sett_remarks',e.target.value)} />
        <button onClick={() => onAction('settlement',{utr_number:vals.utr_number||'',utr_date:vals.utr_date||'',tds:Number(vals.tds||0),final_paid:Number(vals.final_paid||0), remarks: vals.sett_remarks||''})}
          className="premium-btn" style={{background: "#10B981"}}>📄 Record Settlement</button>
      </div>
    ),
    settled: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ padding:'16px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10 }}>
          <h4 style={{ color:'#10B981', margin:'0 0 10px' }}>✅ Settlement Verified</h4>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
            <div style={{ color:'var(--text2)' }}>TPA Final Payment:</div>
            <div style={{ color:'var(--text)', fontWeight:700, textAlign:'right' }}>₹{caseData.settlement?.final_paid?.toLocaleString('en-IN')}</div>
            <div style={{ color:'var(--text2)' }}>TDS Withheld:</div>
            <div style={{ color:'var(--text)', fontWeight:700, textAlign:'right' }}>₹{caseData.settlement?.tds?.toLocaleString('en-IN')}</div>
            <div style={{ color:'var(--text2)' }}>Patient Collection:</div>
            <div style={{ color:'var(--text)', fontWeight:700, textAlign:'right' }}>₹{caseData.payment?.patient_paid?.toLocaleString('en-IN')}</div>
            <div style={{ gridColumn:'span 2', borderTop:'1px solid rgba(255,255,255,0.05)', margin:'8px 0', paddingTop:8, display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'var(--text2)' }}>Total Recovered:</span>
                <span style={{ color:'#10B981', fontWeight:800 }}>₹{( (caseData.settlement?.final_paid||0) + (caseData.settlement?.tds||0) + (caseData.payment?.patient_paid||0) ).toLocaleString('en-IN')}</span>
            </div>
          </div>
          {caseData.summary?.revenue_loss > 0 && (
            <div style={{ marginTop:10, fontSize:12, color:'#EF4444', background:'rgba(239,68,68,0.1)', padding:'8px 12px', borderRadius:8 }}>
              ⚠️ Revenue Gap: <b>₹{caseData.summary.revenue_loss.toLocaleString('en-IN')}</b>
              <div style={{ opacity:0.8, fontSize:11, marginTop:2 }}>Reason: {caseData.settlement?.remarks || 'Short payment by TPA'}</div>
            </div>
          )}
        </div>
        
        <h4 style={{ color:'var(--text)', margin:'12px 0 0' }}>Finance — Final Closure</h4>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <input type="text" placeholder="Bill No." className="premium-inp"
            value={vals.bill_no||''} onChange={e=>set('bill_no',e.target.value)} />
          <input type="text" placeholder="Account Entry / Ledger Code" className="premium-inp"
            value={vals.account_entry||''} onChange={e=>set('account_entry',e.target.value)} />
        </div>
        <button onClick={() => onAction('close',{bill_no:vals.bill_no||'',account_entry:vals.account_entry||''})}
          className="premium-btn" style={{background: "#10B981"}}>🎯 Close Case</button>
      </div>
    ),
    closed: (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ padding:'16px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10 }}>
          <h4 style={{ color:'#10B981', margin:'0 0 10px' }}>🎯 Case Fully Closed</h4>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
            <div style={{ color:'var(--text2)' }}>Hospital Bill No:</div>
            <div style={{ color:'var(--text)', fontWeight:700, textAlign:'right' }}>{caseData.settlement?.bill_no}</div>
            <div style={{ color:'var(--text2)' }}>Accounting Ref:</div>
            <div style={{ color:'var(--text)', fontWeight:700, textAlign:'right' }}>{caseData.settlement?.account_entry}</div>
            <div style={{ color:'var(--text2)' }}>Final Recovery:</div>
            <div style={{ color:'#10B981', fontWeight:800, textAlign:'right' }}>₹{( (caseData.settlement?.final_paid||0) + (caseData.settlement?.tds||0) + (caseData.payment?.patient_paid||0) ).toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style={{ padding:'16px', background:'rgba(100,116,139,0.1)', borderRadius:10, color:'var(--text2)', fontSize:13, textAlign:'center' }}>
          This case is archived. No further actions required.
        </div>
      </div>
    ),
    rejected: (
      <div style={{ padding:'16px', background:'rgba(239,68,68,0.1)', borderRadius:10, color:'#EF4444', fontSize:14 }}>
        ❌ This case was rejected by the TPA.
      </div>
    ),
  }

  return sections[status] || null
}

function btn(color) {
  return {
    background: color, color: '#fff', border: 'none', borderRadius: 8,
    padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
  }
}

// Actions available to HOSPITAL only
const HOSPITAL_STATUSES = ['pre_auth_approved','admitted','enhancement_approved','discharge_held','discharge_approved','settled']
// Actions available to TPA only  
const TPA_STATUSES = ['pre_auth_pending','enhancement_requested','discharge_initiated','discharge_held','payment_done']

export default function CaseDetailPage({ caseId, role, onBack, toast }) {
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchCase() {
    try {
      const r = await fetch(`${API}/api/rcm/cases/${caseId}`)
      if (!r.ok) throw new Error()
      setCaseData(await r.json())
    } catch {
      toast?.('Failed to load case', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchCase() }, [caseId])

  async function handleAction(action, payload = {}) {
    try {
      const r = await fetch(`${API}/api/rcm/cases/${caseId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) {
        const err = await r.json()
        toast?.(err.detail || 'Action failed', 'error')
        return
      }
      const updated = await r.json()
      setCaseData(updated)
      toast?.(`Updated: ${updated.summary?.status_label || updated.status}`, 'success')
    } catch {
      toast?.('Network error', 'error')
    }
  }

  if (loading) return <div style={{ textAlign:'center', padding:80, color:'var(--text3)' }}>Loading case...</div>
  if (!caseData) return <div style={{ textAlign:'center', padding:80, color:'#EF4444' }}>Case not found</div>

  const { summary } = caseData
  const stageColor = STATUS_COLOR[caseData.status] || '#64748B'
  const isHospital = role === 'hospital'
  const isTPA      = role === 'tpa'

  // Check if current status is actionable by this role
  const canHospitalAct = HOSPITAL_STATUSES.includes(caseData.status)
  const canTPAAct      = TPA_STATUSES.includes(caseData.status)
  const myTurn         = isHospital ? canHospitalAct : canTPAAct
  const waitingFor     = isHospital ? 'TPA' : 'Hospital'

  const roleColor = isHospital ? '#3B82F6' : '#8B5CF6'

  return (
    <div>
      {/* Back + Header */}
      <button onClick={onBack} className="premium-btn" style={{
        background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', color:'var(--text)',
        borderRadius:8, padding:'10px 16px', marginBottom:20, fontSize:13, letterSpacing:0,
        boxShadow: 'none', display:'inline-flex'
      }}>← Back to Cases</button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)', margin:0 }}>
            {caseData.patient_name}
          </h1>
          <div style={{ color:'var(--text3)', fontSize:13, marginTop:4, display:'flex', gap:12 }}>
            <span>Case #{caseData.id}</span>
            {caseData.hospital && <span>· {caseData.hospital}</span>}
            {caseData.tpa_name && <span>· TPA: {caseData.tpa_name}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={fetchCase} style={{
            background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)',
            borderRadius:10, padding:'8px 14px', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6,
            marginRight: 10
          }}>
            ↻ Sync
          </button>
          <div style={{
            background:`${roleColor}20`, color:roleColor,
            border:`1px solid ${roleColor}44`, borderRadius:20,
            padding:'6px 14px', fontSize:12, fontWeight:700
          }}>
            {isHospital ? '🏥 Hospital View' : '🏦 TPA View'}
          </div>
          <div style={{
            background:`${stageColor}22`, color:stageColor,
            border:`1px solid ${stageColor}44`, borderRadius:20,
            padding:'8px 18px', fontSize:13, fontWeight:700
          }}>
            Stage {caseData.stage}/8 · {summary?.status_label}
          </div>
        </div>
      </div>

      {/* Workflow Progress Timeline */}
      <div style={{
        background:'var(--card-bg)', border:'1px solid var(--border)',
        borderRadius:24, padding:'32px 32px 48px', marginBottom:24,
        boxShadow: 'var(--shadow)'
      }}>
        <div style={{ fontSize:13, color:'var(--text3)', fontWeight:800, marginBottom:36, letterSpacing:'0.08em', textTransform:'uppercase' }}>
          Workflow Progress
        </div>
        <div style={{ display:'flex', gap:0, alignItems:'center' }}>
          {WORKFLOW.map((step, i) => {
            const done   = caseData.stage > step.stage
            const active = caseData.stage === step.stage
            const color  = caseData.status === 'rejected' && active
              ? '#EF4444'
              : done ? '#10B981' : active ? stageColor : 'var(--border)'
            return (
              <div key={step.stage} style={{ display:'flex', alignItems:'center', flex:1 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
                  <div className={active ? 'glow-pulse' : ''} style={{
                    width:56, height:56, borderRadius:'50%',
                    background: done ? 'linear-gradient(135deg, #10B981, #059669)' : active ? `linear-gradient(135deg, ${stageColor}, ${stageColor}99)` : 'var(--surface2)',
                    border: active ? `3px solid ${color}` : `2px solid ${done ? '#059669' : 'var(--border)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:26, transition:'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: active ? `0 0 24px ${stageColor}88, inset 0 0 10px rgba(255,255,255,0.4)` : done ? '0 4px 12px rgba(16,185,129,0.3)' : 'inset 0 4px 8px rgba(0,0,0,0.05)',
                    transform: active ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    {done ? <span style={{ color:'#fff', fontWeight:'bold' }}>✓</span> : step.icon}
                  </div>
                  <div style={{
                    fontSize:12, marginTop:16, textAlign:'center', width:90,
                    color: active ? 'var(--text)' : done ? '#10B981' : 'var(--text3)',
                    fontWeight: active ? 800 : done ? 700 : 600,
                    lineHeight: 1.3
                  }}>
                    {step.label}
                  </div>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div style={{
                    flex:1, height:4, marginBottom:32, marginLeft:-4, marginRight:-4,
                    background: done ? 'linear-gradient(90deg, #10B981, #34D399)' : 'var(--surface3)',
                    borderRadius: 2, zIndex:1,
                    boxShadow: done ? '0 0 8px rgba(16,185,129,0.4)' : 'none'
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="case-workflow-grid">
        {/* Left: Action Panel + Details */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Action Panel */}
          <div className="vision-panel" style={{ padding: 24, marginBottom: 8 }}>
            <div style={{ fontSize:13, color:'var(--text3)', fontWeight:700, marginBottom:16,
            letterSpacing:'0.06em', textTransform:'uppercase' }}>Next Action</div>

          {/* Show waiting message if it's not this role's turn */}
          {!myTurn && caseData.status !== 'closed' && caseData.status !== 'rejected' && (
            <div className="vision-pill" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'rgba(255,255,255,0.45)' }}>
              <div>
                <div style={{ color:'#1e293b', fontWeight:700, fontSize:22, marginBottom: 4 }}>Waiting for {waitingFor}</div>
                <div style={{ color:'#0369a1', fontSize:14, fontWeight:500 }}>
                  Current status: <b>{summary?.status_label}</b>
                </div>
              </div>
              <div style={{ fontSize: 64, filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))', transform: 'scale(1.2)' }}>⏳</div>
            </div>
          )}

          {/* Show action panel only if it's my turn */}
          {(myTurn || caseData.status === 'closed' || caseData.status === 'rejected') && (
            <ActionPanel caseData={caseData} onAction={handleAction} role={role} />
          )}
          </div>

          {/* Case Info */}
          <div className="vision-panel" style={{ padding: 24, marginBottom: 8 }}>
            <div style={{ fontSize:13, color:'var(--text3)', fontWeight:600, marginBottom:16,
              letterSpacing:'0.06em', textTransform:'uppercase' }}>Patient & Insurance Details</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                ['Patient', caseData.patient_name],
                ['Patient ID', caseData.patient_id || '—'],
                ['Age / Gender', `${caseData.age || '—'} / ${caseData.gender || '—'}`],
                ['Diagnosis', caseData.diagnosis || '—'],
                ['Hospital', caseData.hospital || '—'],
                ['Insurance', caseData.insurance_provider || '—'],
                ['Policy No.', caseData.policy_number || '—'],
                ['TPA', caseData.tpa_name || '—'],
              ].map(([l,v]) => (
                <div key={l} className="vision-pill">
                  <div className="vision-text-secondary">{l}</div>
                  <div className="vision-text-primary">{v}</div>
                </div>
              ))}
            </div>

            {/* Admission info */}
            {caseData.admission?.admission_number && (
              <div className="vision-pill" style={{ marginTop:12, background:'rgba(186, 230, 253, 0.4)', border:'1px solid rgba(125, 211, 252, 0.5)' }}>
                <div className="vision-text-secondary" style={{ color:'#0284c7' }}>Admission Number</div>
                <div className="vision-text-primary" style={{ fontSize:16, fontFamily:'var(--mono)' }}>
                  {caseData.admission.admission_number}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Financial Summary */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="anim-fade" style={{
            background: 'linear-gradient(145deg, var(--card-bg), var(--surface2))', 
            border:'1px solid var(--border)',
            borderRadius:24, padding:32,
            boxShadow: '0 12px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
            position: 'relative', overflow: 'hidden'
          }}>
            {/* Glossy overlay sheen */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'40%', background:'linear-gradient(180deg, rgba(255,255,255,0.08), transparent)', pointerEvents:'none' }} />

            <div style={{ fontSize:14, color:'var(--accent)', fontWeight:800, marginBottom:24,
              letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:8 }}>
              <span>💰</span> Financial Summary
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label:'Pre-Auth Approved', value: summary?.pre_auth_amount, color:'#10B981' },
                { label:'Enhancement',        value: summary?.enhancement_amount, color:'#F97316' },
                { label:'Final Hospital Bill',value: summary?.final_bill, color:'var(--text)', big:true },
                { label:'Copay (Patient)',    value: summary?.copay, color:'#F59E0B' },
                { label:'TPA Deductions',     value: summary?.deductions, color:'#EF4444' },
                { label:'TPA Payable',        value: summary?.tpa_payable, color:'#3B82F6', bold:true },
                { label:'Patient Paid',       value: summary?.patient_paid, color:'#06B6D4' },
                { label:'Final TPA Settled',  value: summary?.final_settled, color:'#10B981', ultimate:true },
              ].map(row => {
                if(row.label === 'Final TPA Settled') return (
                  <div key={row.label} style={{ marginTop:8, paddingTop:24, borderTop:'2px dashed var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:16, color:'var(--text2)', fontWeight:700 }}>{row.label}</span>
                    <span style={{
                      fontSize: 28, fontWeight: 900,
                      background: 'linear-gradient(90deg, #10B981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      fontFamily: 'var(--mono)', textShadow: '0 4px 12px rgba(16,185,129,0.2)'
                    }}>
                      {row.value ? `₹${row.value.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                );

                if(row.label === 'Final Hospital Bill') return (
                  <div key={row.label} style={{ background:'var(--surface2)', padding:'16px', borderRadius:16, display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--border)', margin:'8px 0' }}>
                    <span style={{ fontSize:15, color:'var(--text)', fontWeight:700 }}>{row.label}</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--mono)' }}>
                      {row.value ? `₹${row.value.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                );

                return (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px' }}>
                    <span style={{ fontSize:14, color:'var(--text2)', fontWeight: row.bold ? 700 : 500 }}>{row.label}</span>
                    <span style={{
                      fontSize: 15, fontWeight: row.bold ? 800 : 600,
                      color: row.value ? row.color : 'var(--text3)',
                      fontFamily: 'var(--mono)'
                    }}>
                      {row.value ? `₹${row.value.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Deductions and remarks alerts */}
            {caseData.discharge?.remarks && summary?.deductions > 0 && (
              <div style={{ marginTop:16, padding:'12px', background:'rgba(239,68,68,0.05)', borderRadius:12, border:'1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ fontSize:12, color:'#EF4444', fontWeight:700 }}>DEDUCTION REASON:</span>
                <p style={{ fontSize:12, color:'var(--text2)', margin:'4px 0 0' }}>{caseData.discharge.remarks}</p>
              </div>
            )}
            
            {caseData.settlement?.remarks && summary?.final_settled > 0 && (
              <div style={{ marginTop:12, padding:'12px', background:'var(--surface2)', borderRadius:12, border:'1px dashed var(--border2)' }}>
                <span style={{ fontSize:12, color:'var(--text2)', fontWeight:700 }}>SETTLEMENT NOTES:</span>
                <p style={{ fontSize:12, color:'var(--text)', margin:'4px 0 0' }}>{caseData.settlement.remarks}</p>
              </div>
            )}

            {summary?.revenue_loss >= 0 && (caseData.status === 'settled' || caseData.status === 'closed') && (
              <div style={{
                marginTop:24, padding:'20px',
                background: summary.revenue_loss > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.05)',
                border: summary.revenue_loss > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)',
                borderRadius:16, display:'flex', justifyContent:'space-between', alignItems:'center'
              }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color: summary.revenue_loss > 0 ? '#EF4444' : '#10B981', letterSpacing:'0.05em' }}>
                    {summary.revenue_loss > 0 ? '⚠️ REVENUE GAP' : '✅ FULL RECOVERY'}
                  </div>
                  {summary.revenue_loss > 0 && <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>Unrecovered amount</div>}
                </div>
                <div style={{ fontSize:24, fontWeight:900, color: summary.revenue_loss > 0 ? '#EF4444' : '#10B981', fontFamily:'var(--mono)' }}>
                  ₹{summary.revenue_loss.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* UTR Details */}
            {caseData.settlement?.utr_number && (
              <div style={{ marginTop:24, padding:'20px', background:'var(--surface2)',
                border:'1px solid var(--border)', borderRadius:16 }}>
                <div style={{ fontSize:12, color:'var(--text3)', fontWeight:800, marginBottom:16, textTransform:'uppercase' }}>Payment Reconciliation</div>
                
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'var(--text2)' }}>TPA Share (Expected):</span>
                    <span style={{ color:'var(--text)', fontWeight:700, fontFamily:'var(--mono)' }}>₹{summary?.tpa_payable?.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'var(--text2)' }}>UTR Payment (Received):</span>
                    <span style={{ color:'#10B981', fontWeight:800, fontFamily:'var(--mono)' }}>+ ₹{caseData.settlement.final_paid?.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:'var(--text2)' }}>TDS (Tax Credit):</span>
                    <span style={{ color:'#3B82F6', fontWeight:800, fontFamily:'var(--mono)' }}>+ ₹{caseData.settlement.tds?.toLocaleString('en-IN')}</span>
                  </div>

                  <div style={{ height:1, background:'var(--border)', margin:'6px 0' }} />

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
                    <span style={{ color:'var(--text)', fontWeight:700 }}>Short Payment:</span>
                    <span style={{ 
                      color: (summary?.tpa_payable - (caseData.settlement.final_paid + caseData.settlement.tds)) > 0 ? '#EF4444' : '#10B981', 
                      fontWeight:900, fontFamily:'var(--mono)' 
                    }}>
                       ₹{Math.max(0, summary?.tpa_payable - (caseData.settlement.final_paid + caseData.settlement.tds)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop:16, paddingTop:16, borderTop:'1px dashed var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, letterSpacing:'0.05em' }}>UTR NUMBER</div>
                    <div style={{ fontSize:14, color:'var(--text)', fontWeight:800, fontFamily:'var(--mono)' }}>{caseData.settlement.utr_number}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, letterSpacing:'0.05em' }}>DATE</div>
                    <div style={{ fontSize:14, color:'var(--text)', fontWeight:700 }}>{caseData.settlement.utr_date}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
