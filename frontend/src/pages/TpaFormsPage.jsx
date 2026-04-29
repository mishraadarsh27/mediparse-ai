import React, { useState } from 'react'

const TPA_COMPANIES = [
  { id: 'star', name: 'Star Health & Allied Insurance', color: '#dc2626', code: 'STAR-01' },
  { id: 'hdfc', name: 'HDFC ERGO General Insurance', color: '#dc2626', code: 'HDFC-ER' },
  { id: 'icici', name: 'ICICI Lombard General', color: '#ea580c', code: 'ICICI-L' },
  { id: 'niva', name: 'Niva Bupa Health Insurance', color: '#16a34a', code: 'NIVA-BP' },
  { id: 'care', name: 'Care Health Insurance', color: '#0284c7', code: 'CARE-HI' },
  { id: 'mediassist', name: 'MediAssist TPA', color: '#2563eb', code: 'MA-TPA' },
  { id: 'fhpl', name: 'FHPL (Family Health Plan)', color: '#0891b2', code: 'FHPL-01' },
  { id: 'mdindia', name: 'MDIndia Health Insurance TPA', color: '#4f46e5', code: 'MDI-TPA' },
  { id: 'paramount', name: 'Paramount Health Services', color: '#7c3aed', code: 'PHS-TPA' },
]

export default function TpaFormsPage() {
  const [search, setSearch] = useState('')

  const filtered = TPA_COMPANIES.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="anim-fade" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
       
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            TPA Forms Library
          </h1>
          <p style={{ color: 'var(--text3)', margin: 0, fontSize: 15 }}>
            Official Pre-Authorization and Claim formats for all major providers.
          </p>
        </div>
        
        <div style={{ position: 'relative', width: 300 }}>
          <span style={{ position: 'absolute', left: 14, top: 12, opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search TPA company..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 40px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 12, color: 'var(--text)', fontSize: 14, outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {filtered.map(tpa => (
          <div key={tpa.id} className="card hover-pull" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 24, boxShadow: 'var(--shadow)',
            display: 'flex', flexDirection: 'column', gap: 20
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
               <div style={{ 
                 width: 48, height: 48, borderRadius: 12, 
                 background: `linear-gradient(135deg, ${tpa.color}22, ${tpa.color}11)`,
                 border: `1px solid ${tpa.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: tpa.color, fontWeight: 900, fontSize: 20
               }}>
                 {tpa.name.charAt(0)}
               </div>
               <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3, marginBottom: 4 }}>
                    {tpa.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                    ROUTING CODE: {tpa.code}
                  </div>
               </div>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Pre-Auth Form</span>
                 <a href={`https://www.google.com/search?q=${encodeURIComponent(tpa.name + ' official pre authorization form pdf')}`} target="_blank" rel="noreferrer" 
                    style={{ fontSize: 12, color: '#2563eb', fontWeight: 800, textDecoration: 'none', background: 'rgba(37,99,235,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    Find PDF ↗
                 </a>
               </div>
               <div style={{ height: 1, background: 'var(--border)' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Reimbursement Claim</span>
                 <a href={`https://www.google.com/search?q=${encodeURIComponent(tpa.name + ' official reimbursement claim form pdf')}`} target="_blank" rel="noreferrer" 
                    style={{ fontSize: 12, color: '#059669', fontWeight: 800, textDecoration: 'none', background: 'rgba(5,150,105,0.1)', padding: '4px 10px', borderRadius: 8 }}>
                    Find PDF ↗
                 </a>
               </div>
            </div>
            
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: 'var(--text3)' }}>
             No TPA companies matched your search.
          </div>
        )}
      </div>

    </div>
  )
}
