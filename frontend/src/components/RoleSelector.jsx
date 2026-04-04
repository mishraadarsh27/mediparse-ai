export default function RoleSelector({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 40px',
      fontFamily: 'var(--font)',
      position: 'relative',
      overflow: 'hidden',
      background: '#0B101E' 
    }}>
      {/* Premium Realistic Backdrop Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("/assets/role_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.85,
        filter: 'brightness(1.05) saturate(1.1)',
        zIndex: 1
      }} />
      
      {/* Theme-Aware Gradient Overlay for Readability */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, transparent 20%, rgba(11, 16, 30, 0.4) 100%)',
        zIndex: 2
      }} />

      {/* High-End Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 50, position: 'relative', zIndex: 10 }} className="anim-fade">
        <img 
          src="/assets/premium_logo.png" 
          className="logo-clean"
          style={{
            width: 200, height: 160,
            objectFit: 'contain',
            margin: '0 auto 10px',
            display: 'block'
          }} 
          alt="MediParse AI Logo"
        />
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.04em', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          MediParse AI
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.95)', marginTop: 8, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Next-Gen Revenue Cycle Management & Intelligence
        </p>
      </div>

      <div style={{ 
        fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 36, position: 'relative', zIndex: 10,
        textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 800 
      }}>
        Select Workspace Portal
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(320px, 440px) minmax(320px, 440px)', 
        gap: 40, width: '100%', justifyContent: 'center', 
        position: 'relative', zIndex: 10 
      }}>
        {/* Hospital Portal Card */}
        <button onClick={() => onSelect('hospital')} className="card" style={{
          background: 'rgba(255, 255, 255, 0.22)',
          backdropFilter: 'blur(50px) saturate(220%)',
          WebkitBackdropFilter: 'blur(50px) saturate(220%)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 36, padding: '54px 44px',
          cursor: 'pointer', textAlign: 'left',
          transition: 'var(--t)', color: '#fff',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        }}>
          <div style={{ 
            marginBottom: 28, padding: 18, 
            background: 'var(--accent-glow)', borderRadius: 24, 
            width: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}><div className="icon-3d lg icon-side icon-hosp float" /></div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Hospital Portal
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.7, marginBottom: 36, fontWeight: 500 }}>
            Unified clinical operations for patient intake, claims processing, and revenue reconciliation.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 44 }}>
            {['Submit Pre-Auth Docs', 'Patient Admission', 'Enhancement Requests', 'Discharge Settlements'].map(a => (
              <div key={a} style={{ fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, boxShadow: '0 0 10px var(--primary)' }} />
                {a}
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2563EB, #0ea5e9)', 
            borderRadius: 18, padding: '16px 24px', color: '#fff', 
            fontSize: 16, fontWeight: 800, textAlign: 'center',
            boxShadow: '0 12px 32px var(--accent-glow2)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            Launch Hospital Suite →
          </div>
        </button>

        {/* TPA Portal Card */}
        <button onClick={() => onSelect('tpa')} className="card" style={{
          background: 'rgba(5, 46, 22, 0.15)',
          backdropFilter: 'blur(50px) saturate(220%)',
          WebkitBackdropFilter: 'blur(50px) saturate(220%)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          borderRadius: 36, padding: '54px 44px',
          cursor: 'pointer', textAlign: 'left',
          transition: 'var(--t)', color: '#fff',
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
        }}>
          <div style={{ 
            marginBottom: 28, padding: 18, 
            background: 'var(--accent-glow2)', borderRadius: 24, 
            width: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}><div className="icon-3d lg icon-side icon-hosp float" style={{filter:'hue-rotate(140deg)'}} /></div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 14, letterSpacing: '-0.02em' }}>
            TPA Auditor Portal
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.7, marginBottom: 36, fontWeight: 500 }}>
            Enterprise adjudication portal for claim approvals, settlement logs, and financial auditing.
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 44 }}>
            {['Adjudication Engine', 'Approval Workflows', 'Settlement Logs', 'Claim Analytics'].map(a => (
              <div key={a} style={{ fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--secondary)', flexShrink: 0, boxShadow: '0 0 10px var(--secondary)' }} />
                {a}
              </div>
            ))}
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0D9488, #10B981)', 
            borderRadius: 18, padding: '16px 24px', color: '#fff', 
            fontSize: 16, fontWeight: 800, textAlign: 'center',
            boxShadow: '0 12px 32px rgba(13, 148, 136, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            Launch TPA Suite →
          </div>
        </button>
      </div>

      {/* Sync Status Info */}
      <div style={{
        marginTop: 54, padding: '16px 36px',
        background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 24, color: '#fff', fontSize: 13, fontWeight: 700,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', gap: 12,
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 10
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 15px var(--green)' }} className="anim-pulse" />
        Shared Enterprise Database Live · Supabase Sync Active
      </div>
    </div>
  )
}
