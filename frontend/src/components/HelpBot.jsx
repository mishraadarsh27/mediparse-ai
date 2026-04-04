import { useState, useRef, useEffect } from 'react'
import { sendChatbotMessage } from '../api'

export default function HelpBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([
    { role: 'bot', text: 'Namaste! I am HELPBOT. I can help you with medical queries, insurance details, and MediParse AI. How can I help today?' }
  ])
  const [loading, setLoading] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  // Hide tooltip after some time
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  const send = async () => {
    if (!message.trim() || loading) return
    const userMsg = message
    setMessage('')
    setChat(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await sendChatbotMessage(userMsg)
      setChat(prev => [...prev, { role: 'bot', text: res.reply }])
    } catch (err) {
      setChat(prev => [...prev, { role: 'bot', text: '⚠️ Connection Error. Please check if backend is running.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 2000 }}>
      
      {/* "HELP!" Pop-up Tooltip */}
      {showTooltip && !isOpen && (
        <div className="anim-pop" style={{
          position: 'absolute', bottom: 85, right: 10,
          background: 'var(--accent)', color: '#000',
          padding: '6px 12px', borderRadius: '12px 12px 0 12px',
          fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
          boxShadow: '0 4px 15px rgba(0,212,255,0.4)',
          pointerEvents: 'none'
        }}>
          HELP! ✨
        </div>
      )}

      {/* Bot Chat Window */}
      {isOpen && (
        <div className="anim-fade" style={{
          position: 'absolute', bottom: 90, right: 0,
          width: 380, height: 500,
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '20px', 
            background: 'linear-gradient(90deg, var(--accent-glow), transparent)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: 10, 
                background: 'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: '0 0 15px var(--accent-glow)'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.05em', color: 'var(--text)' }}>HELPBOT AI</div>
                <div style={{ fontSize: 10, color: '#00e5a0', fontWeight: 700 }}>● ONLINE</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 16, width: 30, height: 30, borderRadius: '50%' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(0,0,0,0.02)' }}>
            {chat.map((c, i) => (
              <div key={i} style={{
                alignSelf: c.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: c.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                fontSize: 13, lineHeight: 1.6,
                background: c.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                color: c.role === 'user' ? '#000' : 'var(--text)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: c.role === 'user' ? 'none' : '1px solid var(--border)'
              }}>
                {c.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'var(--surface2)', padding: '10px 15px', borderRadius: 12, display:'flex', gap:4 }}>
                <div className="dot-pulse" style={{ width:6, height:6, background:'var(--text3)', borderRadius:'50%' }} />
                <div className="dot-pulse" style={{ width:6, height:6, background:'var(--text3)', borderRadius:'50%', animationDelay:'0.2s' }} />
                <div className="dot-pulse" style={{ width:6, height:6, background:'var(--text3)', borderRadius:'50%', animationDelay:'0.4s' }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: 20, background: 'var(--sidebar-bg)', borderTop: '1px solid var(--border)' }}>
            <div style={{ 
              display: 'flex', gap: 10, background: 'var(--surface2)', 
              padding: '6px', borderRadius: 16, border: '1px solid var(--border)' 
            }}>
              <input 
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type in English or Hindi..."
                style={{
                  flex: 1, background: 'none', border: 'none',
                  padding: '8px 12px', color: 'var(--text)', fontSize: 13, outline: 'none'
                }}
              />
              <button 
                onClick={send}
                disabled={loading}
                style={{
                  background: 'var(--accent)', border: 'none', borderRadius: 12,
                  width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--accent-glow)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: 18 }}>🚀</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating 3D Bot Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 70, height: 70, borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--accent), #00d4ff)',
          border: 'none',
          boxShadow: '0 10px 30px rgba(0, 212, 255, 0.5), inset 0 0 15px rgba(255,255,255,0.3)',
          cursor: 'pointer',
          fontSize: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="bot-button-3d"
      >
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent)',
          pointerEvents: 'none'
        }} />
        {isOpen ? '✕' : '🤖'}
      </button>
      
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8) translateY(10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .anim-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        .dot-pulse {
          animation: pulse 1.4s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .bot-button-3d:hover {
          transform: translateY(-5px) scale(1.05);
          box-shadow: 0 15px 40px rgba(0, 212, 255, 0.6);
        }
      `}</style>
    </div>
  )
}
