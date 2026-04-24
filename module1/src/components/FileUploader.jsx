import { useRef, useState } from 'react'
import { FileText, UploadCloud, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { cn } from '../lib/utils'

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isValidType = (file) => {
  const name = file.name.toLowerCase()
  return (
    name.endsWith('.pdf') ||
    name.endsWith('.docx') ||
    file.type === 'application/pdf' ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

export default function FileUploader({ onFileSelect, maxSizeMB = 10 }) {
  const inputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const validateAndSet = (file) => {
    if (!file) return

    if (!isValidType(file)) {
      setError('Please upload a PDF or DOCX file only.')
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    setError('')
    setSelectedFile(file)
    onFileSelect(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    onFileSelect(null)
  }

  if (selectedFile) {
    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf')
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg px-3 py-2 text-sm font-semibold', isPdf ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700')}>
              {isPdf ? 'PDF' : 'DOCX'}
            </div>
            <div>
              <p className="font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-sm text-slate-500">{formatBytes(selectedFile.size)}</p>
            </div>
          </div>
          <Button type="button" variant="ghost" onClick={clearFile} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <X className="h-4 w-4" /> Remove
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          validateAndSet(event.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition',
          isDragging
            ? 'border-sky-400 bg-sky-50'
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
        )}
      >
        <div className="mb-4 rounded-full bg-slate-100 p-3 text-slate-700">
          {isDragging ? <UploadCloud className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
        </div>
        <p className="text-lg font-semibold text-slate-900">Drag and drop your resume here</p>
        <p className="mt-1 text-sm text-slate-600">or click to browse your device</p>
        <p className="mt-4 text-xs text-slate-500">
          Accepted formats: PDF, DOCX · Max size: {maxSizeMB}MB
        </p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => validateAndSet(event.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  )
}
