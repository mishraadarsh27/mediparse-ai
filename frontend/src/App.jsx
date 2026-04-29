import { useState, useCallback } from 'react'
import RoleSelector from './components/RoleSelector.jsx'
import LoginPage from './components/LoginPage.jsx'
import Sidebar from './components/Sidebar.jsx'
import TopBar, { Toast } from "./components/TopBar.jsx"
import UploadPage from './pages/UploadPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import DocumentDetailPage from './pages/DocumentDetailPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import RCMPage from './pages/RCMPage.jsx'
import CaseDetailPage from './pages/CaseDetailPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import TpaFormsPage from './pages/TpaFormsPage.jsx'
import HelpBot from './components/HelpBot.jsx'

export default function App() {
  const [sessionRole, setSessionRole] = useState(null) // final authenticated role
  const [selectedRole, setSelectedRole] = useState(null) // role chosen but not yet logged in
  const [page, setPage]             = useState('rcm')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toasts, setToasts]         = useState([])
  const [search, setSearch]         = useState('')

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  function openDetail(id)  { setSelectedId(id); setPage('detail') }
  function openCase(id)    { setSelectedCaseId(id); setPage('case-detail') }
  function onUploadSuccess(doc) {
    setRefreshKey(k => k + 1)
    toast(`"${doc.filename}" processed — ${doc.confidence}% confidence`)
    openDetail(doc.id)
  }

  const handleNav = useCallback((p) => {
    setPage(p)
    if (p !== 'detail')      setSelectedId(null)
    if (p !== 'case-detail') setSelectedCaseId(null)
  }, [])

  // 1. Initial State: No role selected -> Show Role Selection Gateway
  if (!sessionRole && !selectedRole) {
    return <RoleSelector onSelect={setSelectedRole} />
  }

  // 2. Role selected but not logged in -> Show Login Page for that specific role
  if (!sessionRole && selectedRole) {
    return (
      <LoginPage 
        defaultRole={selectedRole} 
        onLogin={r => { setSessionRole(r); setPage('rcm') }} 
        onBack={() => setSelectedRole(null)} 
      />
    )
  }

  // 3. User authenticated -> Show Dashboard
  return (
    <div className="cyber-monitor-glass">
      <Sidebar
        active={page}
        role={sessionRole}
        onNav={handleNav}
        onSwitchRole={() => {
          setSessionRole(null)
          setSelectedRole(null)
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 2 }}>
        <TopBar page={page} role={sessionRole} onSearch={setSearch} />
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          <div className="page-transition" key={`${page}-${selectedId||''}-${selectedCaseId||''}`}>
  
          {page === 'upload'      && <UploadPage onSuccess={onUploadSuccess} toast={toast} />}
          {page === 'documents'   && <DocumentsPage key={refreshKey} onOpen={openDetail} toast={toast} search={search} />}
          {page === 'detail'      && selectedId && <DocumentDetailPage docId={selectedId} onBack={() => setPage('documents')} toast={toast} />}
          {page === 'analytics'   && <AnalyticsPage key={refreshKey} onNav={handleNav} />}
          {page === 'forms'       && <TpaFormsPage />}
          {page === 'rcm'         && <RCMPage role={sessionRole} onOpenCase={openCase} toast={toast} search={search} />}
          {page === 'case-detail' && selectedCaseId && <CaseDetailPage caseId={selectedCaseId} role={sessionRole} onBack={() => setPage('rcm')} toast={toast} />}
          {page === 'settings'    && <SettingsPage />}
          
        
          </div>
        </main>
      </div>
      <HelpBot />
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}
