import { useState, useEffect } from 'react'
import { fetchDocuments, deleteDocument } from '../api.js'
import { ConfidenceRing } from '../components/TopBar.jsx'

const DOC_TYPES = ['All','Lab Report','Hospital Bill','Discharge Summary','Prescription','Insurance Form','Other']

export default function DocumentsPage({ onOpen, toast, search: globalSearch }) {
  const [docs, setDocs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetchDocuments().then(setDocs).finally(() => setLoading(false))
  }, [])

  async function handleDelete(e, id, name) {
    e.stopPropagation()
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteDocument(id)
      setDocs(d => d.filter(x => x.id !== id))
      toast(`"${name}" deleted`, 'info')
    } catch { toast('Delete failed', 'error') }
  }

  const filtered = docs.filter(d => {
    const s = globalSearch || ''
    const matchSearch = !s ||
      d.filename.toLowerCase().includes(s.toLowerCase()) ||
      (d.patient_name||'').toLowerCase().includes(s.toLowerCase())
    const matchFilter = filter === 'All' || d.document_type === filter
    return matchSearch && matchFilter
  })

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height:80, borderRadius:14 }} />
      ))}
    </div>
  )

  return (
    <div className="anim-fade">
      {/* Toolbar */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap', justifyContent:'flex-end' }}>
        <div style={{ display:'flex', gap:4, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:4, overflowX:'auto' }}>
          {DOC_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding:'5px 12px', borderRadius:7, fontSize:11, fontWeight:600,
              fontFamily:'var(--font-display)', whiteSpace:'nowrap',
              background: filter===t ? 'var(--accent)' : 'transparent',
              color: filter===t ? 'var(--bg)' : 'var(--text2)',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        <span className="pill pill-gray">⊞ {docs.length} total</span>
        <span className="pill pill-green">✓ {docs.filter(d => d.warning_count===0).length} clean</span>
        <span className="pill pill-orange">⚠ {docs.filter(d => d.warning_count>0).length} with warnings</span>
        <span className="pill pill-cyan">⚡ {docs.filter(d => d.extraction_method==='digital').length} digital</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px', color:'var(--text2)' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700 }}>
            {docs.length === 0 ? 'No documents yet' : 'No results found'}
          </div>
          <div style={{ fontSize:12, marginTop:4, color:'var(--text3)' }}>
            {docs.length === 0 ? 'Upload a PDF to get started' : 'Try a different search or filter'}
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map((doc, i) => (
            <DocRow key={doc.id} doc={doc} index={i} onOpen={onOpen} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function DocRow({ doc, index, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const warnCount = doc.warning_count || 0

  return (
    <div
      className="anim-fade"
      style={{
        animationDelay: `${index * 0.04}s`,
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius:14,
        display:'flex', alignItems:'center', gap:16,
        padding:'16px 20px',
        cursor:'pointer',
        transition:'all 0.15s ease',
      }}
      onClick={() => onOpen(doc.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div style={{
        width:44, height:44, borderRadius:12,
        background:'var(--surface3)', border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:20, flexShrink:0,
      }}>
        {doc.document_type === 'Lab Report' ? '🧪' :
         doc.document_type === 'Hospital Bill' ? '🏥' :
         doc.document_type === 'Discharge Summary' ? '📋' :
         doc.document_type === 'Prescription' ? '💊' : '📄'}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, marginBottom:3,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {doc.filename}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {doc.patient_name && <span style={{ fontSize:11, color:'var(--text2)' }}>👤 {doc.patient_name}</span>}
          <span style={{ fontSize:11, color:'var(--text3)' }}>
            {new Date(doc.uploaded_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
          </span>
        </div>
      </div>

      {/* Pills */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <span className={`pill ${doc.document_type === 'Lab Report' ? 'pill-purple' : doc.document_type === 'Hospital Bill' ? 'pill-orange' : 'pill-gray'}`}>
          {doc.document_type || 'Other'}
        </span>
        <span className={`pill ${doc.extraction_method === 'digital' ? 'pill-cyan' : 'pill-orange'}`}>
          {doc.extraction_method === 'digital' ? '⚡ Digital' : '🔍 OCR'}
        </span>
        {warnCount > 0
          ? <span className="pill pill-orange">⚠ {warnCount}</span>
          : <span className="pill pill-green">✓ Clean</span>
        }
        <ConfidenceRing score={doc.confidence || 0} />
        <button
          className="btn btn-danger"
          style={{ padding:'5px 10px', fontSize:11 }}
          onClick={e => onDelete(e, doc.id, doc.filename)}
        >🗑</button>
      </div>
    </div>
  )
}
