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

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

const TOAST_DURATION_MS = 3500
const TOAST_POSITION = { bottom: 24, right: 24 }
const MAIN_PADDING = { padding: '28px 32px' }

// Page route constants
const PAGES = {
  UPLOAD: 'upload',
  DOCUMENTS: 'documents',
  DETAIL: 'detail',
  ANALYTICS: 'analytics',
  FORMS: 'forms',
  RCM: 'rcm',
  CASE_DETAIL: 'case-detail',
  SETTINGS: 'settings'
}

export default function App() {
  const [sessionRole, setSessionRole] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [page, setPage] = useState(PAGES.RCM)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCaseId, setSelectedCaseId] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toasts, setToasts] = useState([])
  const [search, setSearch] = useState('')

  // ============================================
  // TOAST NOTIFICATION SYSTEM
  // ============================================

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), TOAST_DURATION_MS)
  }, [])

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================

  function openDetail(id) {
    setSelectedId(id)
    setPage(PAGES.DETAIL)
  }

  function openCase(id) {
    setSelectedCaseId(id)
    setPage(PAGES.CASE_DETAIL)
  }

  function onUploadSuccess(doc) {
    setRefreshKey(k => k + 1)
    toast(`"${doc.filename}" processed — ${doc.confidence}% confidence`)
    openDetail(doc.id)
  }

  const handleNav = useCallback((p) => {
    setPage(p)
    if (p !== PAGES.DETAIL) setSelectedId(null)
    if (p !== PAGES.CASE_DETAIL) setSelectedCaseId(null)
  }, [])

  // ============================================
  // AUTHENTICATION FLOW
  // ============================================

  // 1. Initial State: No role selected -> Show Role Selection Gateway
  if (!sessionRole && !selectedRole) {
    return <RoleSelector onSelect={setSelectedRole} />
  }

  // 2. Role selected but not logged in -> Show Login Page for that specific role
  if (!sessionRole && selectedRole) {
    return (
      <LoginPage 
        defaultRole={selectedRole} 
        onLogin={r => { setSessionRole(r); setPage(PAGES.RCM) }} 
        onBack={() => setSelectedRole(null)} 
      />
    )
  }

  // ============================================
  // MAIN DASHBOARD (Authenticated)
  // ============================================

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
        
        <main style={{ flex: 1, overflow: 'auto', ...MAIN_PADDING }}>
          <div className="page-transition" key={`${page}-${selectedId||''}-${selectedCaseId||''}`}>
            {page === PAGES.UPLOAD && <UploadPage onSuccess={onUploadSuccess} toast={toast} />}
            {page === PAGES.DOCUMENTS && <DocumentsPage key={refreshKey} onOpen={openDetail} toast={toast} search={search} />}
            {page === PAGES.DETAIL && selectedId && <DocumentDetailPage docId={selectedId} onBack={() => setPage(PAGES.DOCUMENTS)} toast={toast} />}
            {page === PAGES.ANALYTICS && <AnalyticsPage key={refreshKey} onNav={handleNav} />}
            {page === PAGES.FORMS && <TpaFormsPage />}
            {page === PAGES.RCM && <RCMPage role={sessionRole} onOpenCase={openCase} toast={toast} search={search} />}
            {page === PAGES.CASE_DETAIL && selectedCaseId && <CaseDetailPage caseId={selectedCaseId} role={sessionRole} onBack={() => setPage(PAGES.RCM)} toast={toast} />}
            {page === PAGES.SETTINGS && <SettingsPage />}
          </div>
        </main>
      </div>

      <HelpBot />
      
      {/* Toast Notifications */}
      <div style={{ 
        position: 'fixed', 
        bottom: TOAST_POSITION.bottom, 
        right: TOAST_POSITION.right, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 8, 
        zIndex: 1000 
      }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} />)}
      </div>
    </div>
  )
}