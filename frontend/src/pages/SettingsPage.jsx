import React, { useState } from 'react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  
  // Dummy states for the UI
  const [autoExtract, setAutoExtract] = useState(true)
  const [tallySync, setTallySync] = useState(false)
  const [confidence, setConfidence] = useState(85)
  const [aiModel, setAiModel] = useState('gemini-1.5-pro')

  const TABS = [
    { id: 'profile', label: 'Admin Profile', icon: '👤' },
    { id: 'ai', label: 'AI Engine & OCR', icon: '🤖' },
    { id: 'integrations', label: 'Integrations & ERP', icon: '🔌' },
    { id: 'notifications', label: 'Alerts & Rules', icon: '🔔' }
  ]

  return (
    <div className="anim-fade" style={{ height: '100%', display: 'flex', gap: 32 }}>
      
      {/* Settings Navigation */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div className="card" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 24, padding: '24px 16px',
          boxShadow: 'var(--shadow)', position: 'sticky', top: 20
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', borderRadius: 16, border: 'none',
              background: activeTab === t.id ? 'var(--surface2)' : 'transparent',
              color: activeTab === t.id ? 'var(--text)' : 'var(--text2)',
              fontWeight: activeTab === t.id ? 800 : 600,
              fontSize: 15, cursor: 'pointer',
              transition: 'all 0.2s', textAlign: 'left', marginBottom: 8,
              boxShadow: activeTab === t.id ? 'inset 2px 0 0 var(--primary)' : 'none'
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div style={{ flex: 1, maxWidth: 900 }}>

        {activeTab === 'profile' && (
          <div className="card anim-fade">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>Admin Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: 32, alignItems: 'start' }}>
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=256&auto=format&fit=crop" style={{ width: 120, height: 120, borderRadius: 24, border: '2px solid var(--border)' }} alt="Profile" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Full Name</label>
                  <input type="text" defaultValue="Dr. Adarsh Kumar" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Email Address</label>
                  <input type="email" defaultValue="admin@mediparse.ai" style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }} />
                </div>
                <button style={{ width: 'max-content', padding: '12px 24px', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 10 }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="card anim-fade">
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>AI Engine & OCR Configurations</h2>
            <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 32 }}>Tweak the neural inference nodes to balance speed and accuracy.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Option block */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--surface2)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Auto-Extract on Upload</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Automatically trigger Gemini-OCR pipeline when a new PDF is dropped.</div>
                </div>
                {/* Custom Toggle */}
                <div onClick={() => setAutoExtract(!autoExtract)} style={{ width: 50, height: 28, background: autoExtract ? 'var(--green)' : 'var(--text3)', borderRadius: 30, position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                  <div style={{ width: 22, height: 22, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: autoExtract ? 25 : 3, transition: '0.3s' }} />
                </div>
              </div>

              {/* Slider block */}
              <div style={{ padding: '20px', background: 'var(--surface2)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Manual Review Confidence Threshold</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Flag extracted documents if AI confidence drops below this level.</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{confidence}%</div>
                </div>
                <input type="range" min="50" max="99" value={confidence} onChange={(e) => setConfidence(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)' }} />
              </div>

              <div style={{ padding: '20px', background: 'var(--surface2)', borderRadius: 16, border: '1px solid var(--border)' }}>
                 <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Preferred LLM Engine</div>
                 <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>
                   <option value="gemini-1.5-pro">Gemini 1.5 Pro (Highest Accuracy)</option>
                   <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fastest)</option>
                   <option value="gpt-4o">GPT-4o (Enterprise Connect)</option>
                 </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="card anim-fade">
             <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Integrations & ERP</h2>
             <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 32 }}>Connect MediParse AI to your hospital/TPA software suite.</p>

             <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--surface2)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <img src="https://static.thenounproject.com/png/5045610-200.png" style={{ width: 48, borderRadius: 8, filter: 'invert(0.5)' }} alt="Tally" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Tally ERP 9 Sync</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Automatically post settled claims directly to Tally Ledgers.</div>
                  </div>
                </div>
                <div onClick={() => setTallySync(!tallySync)} style={{ width: 50, height: 28, background: tallySync ? 'var(--green)' : 'var(--text3)', borderRadius: 30, position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                  <div style={{ width: 22, height: 22, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: tallySync ? 25 : 3, transition: '0.3s' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Hospital EHR Webhook URL</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input type="url" placeholder="https://api.hospital.com/v1/webhook" style={{ flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 15, fontWeight: 600 }} />
                  <button style={{ padding: '0 24px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>Test Connection</button>
                </div>
              </div>
             </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="card anim-fade">
             <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Alerts & Rules</h2>
             <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 32 }}>Manage what triggers an immediate administrative flag.</p>

             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               {['Email me when a claim over $10,000 is settled', 'Daily summary of unparsed documents', 'Alert if TPA rejects a Pre-Auth', 'New System Updates (MediParse AI)'].map((text, i) => (
                 <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'var(--surface2)', borderRadius: 16, border: '1px solid var(--border)', cursor: 'pointer' }}>
                   <input type="checkbox" defaultChecked={i !== 1} style={{ width: 20, height: 20, accentColor: 'var(--primary)' }} />
                   <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{text}</span>
                 </label>
               ))}
             </div>
          </div>
        )}

      </div>
    </div>
  )
}
