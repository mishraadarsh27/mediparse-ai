import { useState, useRef } from 'react'
import { uploadDocument, uploadBatch } from '../api.js'

const PIPELINE = [
  { icon:<div className="icon-3d sm icon-side icon-docs" />, label:'PDF Parsing',    desc:'pdfplumber + OCR fallback' },
  { icon:<div className="icon-3d sm icon-side icon-data" />, label:'Text Cleaning',  desc:'Layout & table extraction' },
  { icon:<div className="icon-3d sm icon-stat icon-bolt" />, label:'AI Analysis',     desc:'Structured data extraction' },
  { icon:<div className="icon-3d sm icon-stat icon-shld" />,  label:'Validation',      desc:'Schema & logic checks' },
  { icon:<div className="icon-3d sm icon-side icon-upld" />, label:'Secure Storage',  desc:'Encrypted Cloud Sync' },
]

export default function UploadPage({ onSuccess, toast }) {
  const [files, setFiles]     = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stageIdx, setStageIdx] = useState(-1)
  const [mode, setMode]       = useState('single') // 'single' | 'batch'
  const inputRef = useRef()

  function addFiles(incoming) {
    const pdfs = Array.from(incoming).filter(f => f.name.toLowerCase().endsWith('.pdf'))
    if (!pdfs.length) { toast('Only PDF files are supported', 'error'); return }
    if (mode === 'single') setFiles([pdfs[0]])
    else setFiles(prev => [...prev, ...pdfs].slice(0, 10))
  }

  function removeFile(i) { setFiles(f => f.filter((_,idx) => idx !== i)) }

  async function handleUpload() {
    if (!files.length) return
    setLoading(true); setStageIdx(0)

    const interval = setInterval(() => {
      setStageIdx(i => (i < PIPELINE.length - 1 ? i + 1 : i))
    }, 900)

    try {
      if (mode === 'single' || files.length === 1) {
        const res = await uploadDocument(files[0])
        clearInterval(interval); setStageIdx(PIPELINE.length)
        onSuccess(res)
      } else {
        const res = await uploadBatch(files)
        clearInterval(interval); setStageIdx(PIPELINE.length)
        const ok = res.results.filter(r => !r.error)
        toast(`Batch done — ${ok.length}/${files.length} successful`, ok.length === files.length ? 'success' : 'info')
        if (ok.length) onSuccess(ok[0])
      }
    } catch (e) {
      clearInterval(interval)
      toast(e.message || 'Upload failed', 'error')
    } finally {
      setLoading(false); setStageIdx(-1); setFiles([])
    }
  }

  return (
    <div className="anim-fade" style={{ maxWidth:860, margin:'0 auto', padding:'10px 0 40px' }}>
      <style>{`
        @keyframes floating {
          0% { transform: translateY(0px); filter: drop-shadow(0 4px 6px rgba(37,99,235,0.2)); }
          50% { transform: translateY(-10px); filter: drop-shadow(0 12px 12px rgba(37,99,235,0.4)); }
          100% { transform: translateY(0px); filter: drop-shadow(0 4px 6px rgba(37,99,235,0.2)); }
        }
        .icon-float { animation: floating 3s ease-in-out infinite; }
      `}</style>
      
      {/* Mode toggle */}
      <div style={{ display:'flex', gap:6, marginBottom:24, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:6, width:'fit-content', margin:'0 auto 30px' }}>
        {['single','batch'].map(m => (
          <button key={m} onClick={() => { setMode(m); setFiles([]) }} style={{
            padding:'8px 24px', borderRadius:8, fontSize:13, fontWeight:600,
            fontFamily:'var(--font-display)', letterSpacing:'0.03em',
            background: mode===m ? 'var(--primary)' : 'transparent',
            color: mode===m ? '#ffffff' : 'var(--text2)',
            boxShadow: mode===m ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
            transition:'all 0.3s ease',
          }}>
            {m === 'single' ? '⊡ Single File' : '⊞ Batch Upload'}
          </button>
        ))}
      </div>

      {/* Drop zone (Hero Section) */}
      <div className="card"
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => !files.length && inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--primary)' : files.length ? 'var(--green)' : 'var(--border2)'}`,
          borderRadius: 20,
          padding: files.length ? '40px' : '70px 40px',
          textAlign:'center',
          cursor: files.length ? 'default' : 'pointer',
          background: dragging ? 'var(--accent-glow)' : 'var(--card-bg)',
          transition:'all 0.3s ease',
          marginBottom:40,
          position:'relative',
          overflow:'hidden',
        }}
      >
        {dragging && (
          <div style={{ position:'absolute', inset:0, background:'var(--card-bg)', backdropFilter:'blur(8px)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, color:'var(--primary)', fontFamily:'var(--font-display)', fontWeight:700, zIndex:10
          }}>✨ Drop to Extract ✨</div>
        )}
        <input ref={inputRef} type="file" accept=".pdf" multiple={mode==='batch'}
          style={{ display:'none' }}
          onChange={e => addFiles(e.target.files)} />

        {files.length === 0 ? (
          <div>
            <div className="icon-float" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:90, height:90, background:'var(--accent-glow2)', borderRadius:24, marginBottom:20 }}>
              <div className="icon-3d lg icon-side icon-docs float" />
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:26, color:'var(--text)', letterSpacing:'-0.02em', marginBottom:8 }}>
              Drop your medical PDF here
            </div>
            <div style={{ color:'var(--text3)', fontSize:15, marginBottom:28 }}>
              or click to browse
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              {['Lab Report','Hospital Bill','Prescription','Discharge Summary'].map(t => (
                <span key={t} className="pill" style={{ background:'var(--surface2)', color:'var(--text2)', padding:'6px 14px', fontSize:12, fontWeight:500, border:'1px solid var(--border)' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:12, maxHeight:260, overflowY:'auto', padding:'4px' }}>
              {files.map((f,i) => (
                <div key={i} className="anim-fade" style={{
                  display:'flex', alignItems:'center', gap:16,
                  background:'var(--surface)', borderRadius:12,
                  padding:'16px 20px', border:'1px solid var(--border)',
                  boxShadow:'0 4px 12px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, background:'var(--green-dim)', borderRadius:10, color:'var(--green)', fontSize:20 }}>
                     ✓
                  </div>
                  <div style={{ flex:1, textAlign:'left', minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{f.name}</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>{(f.size/1024).toFixed(1)} KB</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeFile(i) }}
                    style={{ background:'var(--surface2)', color:'var(--text3)', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, border:'1px solid var(--border)', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='var(--red-dim)'; e.currentTarget.style.color='var(--red)'; e.currentTarget.style.borderColor='transparent' }}
                    onMouseLeave={e => { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='var(--border)' }}
                  >✕</button>
                </div>
              ))}
            </div>
            {mode === 'batch' && files.length < 10 && (
              <button className="btn btn-ghost" style={{ marginTop:20, fontSize:13 }}
                onClick={e => { e.stopPropagation(); inputRef.current.click() }}>
                + Add more PDFs
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pipeline progress */}
      {loading && (
        <div className="card anim-fade" style={{ padding:'28px 32px', marginBottom:30 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
             <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', fontFamily:'var(--font-display)' }}>Analyzing your report...</div>
             <div className="anim-pulse" style={{ fontSize:12, color:'var(--primary)', fontWeight:600, background:'var(--accent-glow2)', padding:'4px 12px', borderRadius:20 }}>AI Active</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {PIPELINE.map((step, i) => (
              <div key={i} style={{ flex:1, textAlign:'center' }}>
                <div style={{ display:'flex', alignItems:'center' }}>
                  {i > 0 && (
                    <div style={{ flex:1, height:3, background: i <= stageIdx ? 'var(--primary)' : 'var(--border)', transition:'background 0.4s ease' }} />
                  )}
                  <div style={{
                    width:44, height:44, borderRadius:'50%', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18,
                    background: i < stageIdx ? 'var(--green-dim)' : i === stageIdx ? 'var(--gradient)' : 'var(--surface2)',
                    color: i === stageIdx ? '#fff' : 'inherit',
                    border: `2px solid ${i < stageIdx ? 'var(--green)' : i === stageIdx ? 'transparent' : 'var(--border)'}`,
                    transition:'all 0.4s ease',
                    boxShadow: i === stageIdx ? '0 0 20px rgba(37,99,235,0.4)' : 'none',
                  }}>
                    {i < stageIdx ? '✓' : i === stageIdx ? (
                       <span className="anim-spin" style={{ fontSize:16 }}>◌</span>
                    ) : (
                       <span style={{ filter: i > stageIdx ? 'grayscale(1) opacity(0.5)' : 'none' }}>{step.icon}</span>
                    )}
                  </div>
                  {i < PIPELINE.length-1 && (
                    <div style={{ flex:1, height:3, background: i < stageIdx ? 'var(--primary)' : 'var(--border)', transition:'background 0.4s ease' }} />
                  )}
                </div>
                <div style={{ fontSize:11, color: i === stageIdx ? 'var(--primary)' : i < stageIdx ? 'var(--green)' : 'var(--text3)', marginTop:10, fontFamily:'var(--font-display)', fontWeight:600 }}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary CTA button */}
      <div style={{ textAlign:'center' }}>
        <button className="btn btn-primary" onClick={handleUpload}
          disabled={!files.length || loading}
          style={{ width:'100%', maxWidth:360, padding:'16px', fontSize:16, fontWeight:700, letterSpacing:'0.02em',  boxShadow:'0 12px 32px var(--accent-glow2)' }}>
          {loading
            ? <><span className="anim-spin" style={{ fontSize:18 }}>◌</span> Processing...</>
            : `✨ Extract & Analyze${files.length > 1 ? ` (${files.length})` : ''}`
          }
        </button>
      </div>

      {/* Feature cards Section */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:24, marginTop:60 }}>
        {[
          { icon:<div className="icon-3d sm icon-stat icon-bolt" />, title:'AI Extraction', body:'Extract 30+ medical and billing fields using AI', color:'var(--primary)' },
          { icon:<div className="icon-3d sm icon-stat icon-bolt" style={{filter:'hue-rotate(30deg)'}} />, title:'Ultra-Fast Processing', body:'Lightning speed inference using optimized AI models', color:'var(--orange)' },
          { icon:<div className="icon-3d sm icon-side icon-upld" />, title:'Cloud Sync', body:'Real-time storage and sync using secure cloud database', color:'var(--green)' },
        ].map(c => (
          <div key={c.title} className="card" style={{ padding:'28px 24px', textAlign:'left', borderTop:`3px solid ${c.color}` }}>
            <div style={{
              width:48, height:48, borderRadius:12, marginBottom:18,
              background:'var(--surface2)', 
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px solid var(--border)'
            }}>{c.icon}</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'var(--text)', marginBottom:8 }}>{c.title}</div>
            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
