const API_BASE_URL = import.meta.env.VITE_RESUME_API_URL || '/api'

export async function parseResume(file) {
  if (!file) {
    throw new Error('Please select a PDF or DOCX resume first.')
  }

  const formData = new FormData()
  formData.append('file', file)

  // The backend expects multipart form upload so it can extract text from PDF or DOCX files.
  const response = await fetch(`${API_BASE_URL}/parse-resume`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    let message = 'Resume parsing failed. Please try again.'
    try {
      const data = await response.json()
        message = data?.detail || message
    } catch {
      // no-op fallback
    }
    throw new Error(message)
  }

  return response.json()
}
