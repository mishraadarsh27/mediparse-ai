const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

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

export const fetchDocuments = ()        => req('/api/documents')
export const fetchDocument  = (id)      => req(`/api/documents/${id}`)
export const fetchStats     = ()        => req('/api/stats')

export const deleteDocument = (id)      => req(`/api/documents/${id}`, { method: 'DELETE' })

export const updateDocumentFields = (id, fields) => req(`/api/documents/${id}/fields`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(fields)
})

async function _download(url, filename) {
  const res = await fetch(`${BASE}${url}`)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export const exportCSV  = (id) => _download(`/api/documents/${id}/export/csv`,  `mediparse_${id}.csv`)
export const exportJSON = (id) => _download(`/api/documents/${id}/export/json`, `mediparse_${id}.json`)
export const exportPrescription = (id) => _download(`/api/documents/${id}/export/prescription`, `Smart_Prescription_${id}.pdf`)

export const sendChatbotMessage = (message) => req('/api/chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
})
