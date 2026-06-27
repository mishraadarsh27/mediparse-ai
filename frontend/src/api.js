// Base URL from environment variable or default to localhost
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Configuration constants
const EXPORT_FILENAMES = {
  csv: (id) => `mediparse_${id}.csv`,
  json: (id) => `mediparse_${id}.json`,
  prescription: (id) => `Smart_Prescription_${id}.pdf`
}

/**
 * Generic request handler for API calls
 * @param {string} path - API endpoint path
 * @param {object} opts - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
async function req(path, opts = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, opts)
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(err.detail || `Request failed: ${res.status}`)
    }
    
    return res.json()
  } catch (error) {
    console.error(`[API Error] ${path}:`, error)
    throw error
  }
}

// ============================================
// DOCUMENT UPLOAD APIs
// ============================================

export const uploadDocument = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return req('/api/upload', { method: 'POST', body: fd })
}

export const uploadBatch = (files) => {
  const fd = new FormData()
  files.forEach(f => fd.append('files', f))
  return req('/api/upload/batch', { method: 'POST', body: fd })
}

// ============================================
// DOCUMENT MANAGEMENT APIs
// ============================================

export const fetchDocuments = () => req('/api/documents')
export const fetchDocument = (id) => req(`/api/documents/${id}`)
export const fetchStats = () => req('/api/stats')
export const deleteDocument = (id) => req(`/api/documents/${id}`, { method: 'DELETE' })

export const updateDocumentFields = (id, fields) => req(`/api/documents/${id}/fields`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fields)
})

// ============================================
// EXPORT & DOWNLOAD APIs
// ============================================

/**
 * Helper function to download files from API
 * @param {string} url - API endpoint
 * @param {string} filename - Download filename
 */
async function _download(url, filename) {
  try {
    const res = await fetch(`${BASE}${url}`)
    
    if (!res.ok) {
      throw new Error(`Download failed: ${res.status}`)
    }
    
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (error) {
    console.error(`[Download Error] ${url}:`, error)
    throw error
  }
}

export const exportCSV = (id) => _download(
  `/api/documents/${id}/export/csv`, 
  EXPORT_FILENAMES.csv(id)
)

export const exportJSON = (id) => _download(
  `/api/documents/${id}/export/json`, 
  EXPORT_FILENAMES.json(id)
)

export const exportPrescription = (id) => _download(
  `/api/documents/${id}/export/prescription`, 
  EXPORT_FILENAMES.prescription(id)
)

// ============================================
// CHATBOT API
// ============================================

export const sendChatbotMessage = (message) => req('/api/chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
})