'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Spinner } from './ui'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  folder?: string
  label?: string
}

export default function ImageUpload({ value, onChange, folder = 'lost-found', label = 'Upload Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange(data.url)
      toast.success('Image uploaded!')
    } catch (err) {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img src={value} alt="Uploaded" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <button type="button" onClick={() => onChange(undefined)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition group"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner />
              <p className="text-sm text-gray-500">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition">
                <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Click or drag to upload</p>
                <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                <Upload className="w-4 h-4" /> Choose file
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}
    </div>
  )
}
