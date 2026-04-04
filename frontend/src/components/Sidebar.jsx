const NAV_HOSPITAL = [
  { id: 'rcm',       icon: <div className="icon-3d lg icon-side icon-hosp float" />, label: 'RCM Cases' },
  { id: 'upload',    icon: <div className="icon-3d lg icon-side icon-upld float" />,  label: 'Upload Docs' },
  { id: 'documents', icon: <div className="icon-3d lg icon-side icon-docs float" />,  label: 'Documents' },
  { id: 'analytics', icon: <div className="icon-3d lg icon-side icon-data float" />,  label: 'Analytics' },
]

const NAV_TPA = [
  { id: 'rcm',       icon: <div className="icon-3d lg icon-stat icon-shld float" />,  label: 'Adjudication Queue' },
  { id: 'analytics', icon: <div className="icon-3d lg icon-stat icon-bolt float" />,  label: 'Claim Analytics' },
  { id: 'documents', icon: <div className="icon-3d lg icon-side icon-docs float" />,  label: 'Audit Logs' },
]

const ROLE_META = {
  hospital: { 
    label: 'Hospital Portal', 
    sub: 'Active Workspace',
    accent: '#2563EB', 
    glow: 'rgba(37, 99, 235, 0.4)',
    icon: <div className="icon-3d lg icon-side icon-hosp" /> 
  },
  tpa: { 
    label: 'TPA Auditor Portal', 
    sub: 'Compliance & Audit Suite',
    accent: '#0D9488', 
    glow: 'rgba(13, 148, 136, 0.4)',
    icon: <div className="icon-3d lg icon-stat icon-shld" style={{filter: 'hue-rotate(150deg)'}} /> 
  },
}

export default function Sidebar({ active, role, onNav, onSwitchRole }) {
  const nav  = role === 'tpa' ? NAV_TPA : NAV_HOSPITAL
  const meta = ROLE_META[role] || ROLE_META.hospital

  return (
    <aside style={{
      width: 320, 
      background: 'var(--sidebar-bg)', 
      backdropFilter: 'var(--glass)',
      WebkitBackdropFilter: 'var(--glass)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', 
      padding: '40px 24px',
      zIndex: 200,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: 'var(--shadow2)',
      overflow: 'hidden'
    }}>
      {/* Premium Branding Section */}
      <div style={{ marginBottom: 44, position: 'relative' }}>
         {/* Orbit Glow Effect */}
         <div style={{
           position:'absolute', top:-40, left:-40, width:120, height:120,
           background:`radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`,
           opacity:0.6, pointerEvents:'none', zIndex: -1
         }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ 
            width: 58, height: 58, borderRadius: 16, background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            border: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <img 
              src="/assets/premium_logo.png" 
              className="logo-clean anim-rotate-slow"
              style={{ width: '80%', height: '80%', objectFit: 'contain' }} 
              alt="Logo"
            />
          </div>
          <div>
            <div style={{ 
              fontWeight: 950, fontSize: 24, letterSpacing: '-0.05em', 
              color: 'var(--text)', fontFamily: 'var(--font-display)',
            }}>
              MediParse <span style={{ color: meta.accent }}>AI</span>
            </div>
            <div style={{ 
              fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)', 
              letterSpacing: '0.2em', fontWeight: 800, opacity: 0.8 
            }}>
              ENTERPRISE v2.0
            </div>
          </div>
        </div>

        {/* Dynamic Workspace Switcher */}
        <div style={{
          marginTop: 40,
          padding: '16px 20px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          transition: 'all 0.3s'
        }} className="card">
          <div style={{ 
            width: 44, height: 44, borderRadius: 14, 
            background: 'var(--surface3)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            fontSize: 24
          }}>
             {meta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 850, letterSpacing: '-0.01em' }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{meta.sub}</div>
          </div>
          <button 
            onClick={onSwitchRole} 
            className="metallic"
            style={{
              width: 38, height: 38, borderRadius: 10, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16
            }}
          >⇄</button>
        </div>
      </div>

      {/* Modern Navigation Menu */}
      <nav style={{ flex: 1 }}>
        <div style={{ 
          fontSize: 10, color: 'var(--text3)', fontWeight: 900, 
          letterSpacing: '0.3em', paddingLeft: 12, marginBottom: 20, 
          textTransform: 'uppercase', opacity: 0.6
        }}>
          Dashboard Menu
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nav.map(item => {
            const isActive = active === item.id || (active === 'detail' && item.id === 'documents') || (active === 'case-detail' && item.id === 'rcm')
            
            return (
              <button 
                key={item.id} 
                onClick={() => onNav(item.id)} 
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 20,
                  padding: '18px 20px', borderRadius: 20,
                  background: isActive ? 'var(--surface3)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text2)',
                  fontWeight: isActive ? 900 : 600, fontSize: 16,
                  border: '1px solid transparent',
                  borderColor: isActive ? 'var(--accent-glow2)' : 'transparent',
                  textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isActive ? `0 10px 25px ${meta.glow}44` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.transform = 'translateX(8px)'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}}
              >
                <div style={{ 
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  transition: '0.3s ease',
                  filter: isActive ? `drop-shadow(0 0 8px ${meta.accent})` : 'grayscale(0.4) opacity(0.8)'
                }}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
                
                {isActive && (
                  <div style={{ 
                    position: 'absolute', right: 20, width: 8, height: 8, 
                    borderRadius: '50%', background: meta.accent,
                    boxShadow: `0 0 15px ${meta.accent}`,
                  }} className="anim-pulse" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Ultra-Dynamic System Footer */}
      <div style={{ 
        paddingTop: 32, 
        borderTop: '1px solid var(--border)',
        marginTop: 24
      }}>
        <div style={{ 
          background: 'var(--surface2)', 
          padding: '20px', 
          borderRadius: 24,
          border: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
            <div style={{ 
              width: 12, height: 12, borderRadius: '50%', 
              background: 'var(--green)', 
              boxShadow: '0 0 15px var(--green), inset 0 0 5px #fff',
            }} className="glow-pulse" />
            <span style={{ 
              fontSize: 12, color: 'var(--green)', fontWeight: 900, 
              fontFamily: 'var(--mono)', letterSpacing: '0.08em' 
            }}>SYSTEM OPERATIONAL</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, lineHeight: 1.6 }}>
            MediParse AI Core Engine v2.0.4<br />
            <span style={{ opacity: 0.6 }}>Neural inference nodes active...</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
