import React, { useState, useEffect } from 'react'

const Modal = ({ title, content, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000, 
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
    animation: 'fadeUp 0.3s ease'
  }}>
    <div style={{
      width: '100%', maxWidth: 520, background: 'rgba(10, 15, 25, 0.95)',
      padding: 40, borderRadius: 40, border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 50px 100px rgba(0,0,0,0.6)', position: 'relative'
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
      <h2 style={{ color: '#00D4FF', fontSize: 22, fontWeight: 900, marginBottom: 20 }}>{title}</h2>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.8 }}>{content}</div>
    </div>
  </div>
)

export default function LoginPage({ onLogin, defaultRole, onBack }) {
  const [role] = useState(defaultRole || 'hospital')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null)
  const [isFocused, setIsFocused] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const isHosp = role === 'hospital'
  const accent = isHosp ? '#2563EB' : '#00D4FF'
  const themeGlow = isHosp ? 'rgba(37, 99, 235, 0.5)' : 'rgba(0, 212, 255, 0.5)'

  useEffect(() => {
    const handleMouse = (e) => {
      setTilt({ 
        x: (window.innerWidth / 2 - e.pageX) / 50, 
        y: (window.innerHeight / 2 - e.pageY) / 50 
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { onLogin(role); setLoading(false); }, 1500)
  }

  const bgImg = isHosp 
    ? "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=2000"
    : "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=2000"

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', background: '#020617', overflow: 'hidden', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background with Higher Opacity for Glass Contrast */}
      <div style={{
        position: 'absolute', inset: -60,
        background: `url("${bgImg}") center center / cover no-repeat`,
        transform: `translate(${tilt.x * 1.5}px, ${tilt.y * 1.5}px)`,
        opacity: 0.6, zIndex: 1, 
        transition: 'transform 0.1s linear'
      }} />

      {/* Nebula Glow Parallax */}
      <div style={{
        position: 'absolute', inset: -100, 
        background: `radial-gradient(circle at 50% 50%, ${themeGlow} 0%, transparent 60%)`,
        transform: `translate(${tilt.x * 3}px, ${tilt.y * 3}px)`,
        zIndex: 2, opacity: 0.65,
        animation: 'pulseGlow 8s infinite alternate ease-in-out'
      }} />
      
      {/* Grid Overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px', zIndex: 3 }} />

      {/* Extreme Glass Main Form */}
      <div style={{ width: '100%', maxWidth: 440, padding: 24, zIndex: 10, animation: 'fadeUp 0.8s ease' }}>
        
        <form 
          onSubmit={handleLogin} 
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            // EXTREME GLASS: Extremely Low Alpha (0.04) and Higher Blur (40px)
            background: 'rgba(255, 255, 255, 0.04)', 
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            border: '2px solid rgba(255, 255, 255, 0.12)', 
            borderRadius: 54,
            padding: '60px 44px', 
            boxShadow: `0 30px 100px rgba(0,0,0,0.8), ${isFocused ? `0 0 50px ${themeGlow}` : 'none'}`,
            position: 'relative', transition: 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}
        >
          {/* Back Action */}
          <button type="button" onClick={onBack} style={{ position: 'absolute', top: 32, left: 32, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>

          {/* High Fidelity Header */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ marginBottom: 16 }}>
              {isHosp ? (
                <svg width="60" height="60" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 15px ${accent})` }}>
                  <path d="M50 15 L50 85 M15 50 L85 50" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
                  <path d="M25 50 L40 50 L45 35 L55 65 L60 50 L75 50" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="68" height="68" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 15px ${accent})` }}>
                  <path d="M50 15 L80 25 V50 C80 70 50 85 50 85 C50 85 20 70 20 50 V25 L50 15Z" fill="none" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
                  <circle cx="50" cy="42" r="8" stroke={accent} strokeWidth="5" fill="none" />
                  <path d="M50 50 L50 62 L55 62 L58 58 L62 62 L65 59" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Bold Clear Headlines */}
            <h1 style={{ 
              fontSize: 34, fontWeight: 950, color: '#fff', margin: 0, letterSpacing: '-0.02em', 
              textShadow: '0 4px 10px rgba(0,0,0,0.6)' 
            }}>
              MediParse <span style={{ color: accent }}>AI</span>
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 900, marginTop: 10, 
              letterSpacing: '0.3em', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.4)' 
            }}>
              {isHosp ? 'Provider Intelligence Node' : 'Audit Control Gateway'}
            </p>
          </div>

          {/* Form Fields: Clear Visibility Inputs */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
             {!isHosp && (
               <div className="anim-fade" style={{animationDelay: '0.1s'}}>
                 <label style={{ color: '#fff', fontSize: 11, fontWeight: 950, marginBottom: 12, display: 'block', letterSpacing: '0.15em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>TPA CLIENT NODE</label>
                 <input required placeholder="TPA-X-09..." style={inputStyle(accent)} />
               </div>
             )}
             <div className="anim-fade" style={{animationDelay: '0.2s'}}>
               <label style={{ color: '#fff', fontSize: 11, fontWeight: 950, marginBottom: 12, display: 'block', letterSpacing: '0.15em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{isHosp ? 'HOSPITAL UNIQUE CODE' : 'AUDITOR LICENCE KEY'}</label>
               <input required placeholder={isHosp ? "HSP-1080-..." : "ID-453-ZZZ..."} style={inputStyle(accent)} />
             </div>
             <div className="anim-fade" style={{animationDelay: '0.3s'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label style={{ color: '#fff', fontSize: 11, fontWeight: 950, letterSpacing: '0.15em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>SECURITY CODE</label>
                  {!isHosp && <button type="button" style={{ background: 'none', border: 'none', color: accent, fontSize: 10, fontWeight: 900, cursor: 'pointer', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>RESET TOKEN?</button>}
                </div>
               <input required type="password" placeholder="••••••••" style={inputStyle(accent)} />
             </div>

             <button type="submit" disabled={loading} style={{
                marginTop: 12, padding: '24px', borderRadius: 24, border: 'none', 
                background: `linear-gradient(135deg, ${accent}, #1e40af)`,
                color: '#fff', fontSize: 16, fontWeight: 950, cursor: 'pointer', 
                boxShadow: `0 20px 40px ${themeGlow}`, transition: '0.4s cubic-bezier(0.19, 1, 0.22, 1)',
                textTransform: 'uppercase', letterSpacing: '0.1em'
             }}
             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 30px 60px ${themeGlow}`; }}
             onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 20px 40px ${themeGlow}`; }}
             >{loading ? 'Securing Portal Sync...' : 'Initialize Interface —'}</button>
          </div>

          <div style={{ marginTop: 32 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.1em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>SECURED AES-256 ENCRYPTED CHANNEL</span>
          </div>
        </form>

        <div style={{ marginTop: 44, display: 'flex', gap: 32, justifyContent: 'center' }}>
          <button onClick={() => setModal({ title: 'Enterprise Technical Support', content: 'MediParse AI support is active. For direct technician assistance, contact support@mediparse.ai. System log ID: 8828-SYNC.' })} style={footerBtnStyle}>Emergency Support</button>
          <button onClick={() => setModal({ title: 'System Compliance Policy', content: 'Adjudication Node v2.0. Protected by E2EE protocols. Unauthorized access attempts are automatically logged.' })} style={footerBtnStyle}>Terms of Service</button>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow { from { opacity: 0.4; } to { opacity: 0.8; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {modal && <Modal title={modal.title} content={modal.content} onClose={() => setModal(null)} />}
    </div>
  )
}

const inputStyle = (accent) => ({
  width: '100%', padding: '22px 24px', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)',
  borderRadius: 22, outline: 'none', color: '#fff', fontSize: 15, transition: '0.4s', fontWeight: 700,
  boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
})

const footerBtnStyle = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: '0.3s' }
