'use client'

import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react'
import { ProcessedFile, processFile, fmtSize } from '@/lib/fileProcessor'
import { GROQ_MODELS } from '@/lib/types'
import { Paperclip, Send, Zap, X, Loader2, Image as ImageIcon } from 'lucide-react'

interface Props {
  onSend: (text: string, files: ProcessedFile[]) => void
  onOptimize: (prompt: string) => Promise<string>
  onNewFiles: (files: ProcessedFile[]) => void
  attachments: ProcessedFile[]
  onRemoveAttachment: (index: number) => void
  loading: boolean
  model: string
  onModelChange: (m: string) => void
}

export default function InputArea({
  onSend, onOptimize, onNewFiles, attachments, onRemoveAttachment,
  loading, model, onModelChange
}: Props) {
  const [text, setText] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    adjustHeight()
  }

  const handleSend = useCallback(() => {
    if (loading || optimizing || processingFiles) return
    if (!text.trim() && attachments.length === 0) return
    onSend(text, attachments)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [text, attachments, loading, optimizing, processingFiles, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleOptimize = useCallback(async () => {
    if (!text.trim() || optimizing || loading) return
    setOptimizing(true)
    try {
      const optimized = await onOptimize(text)
      if (optimized) {
        setText(optimized)
        setTimeout(adjustHeight, 0)
      }
    } finally {
      setOptimizing(false)
    }
  }, [text, optimizing, loading, onOptimize])

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setProcessingFiles(true)
    try {
      const processed = await Promise.all(files.map(processFile))
      onNewFiles(processed)
    } finally {
      setProcessingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const busy = loading || optimizing || processingFiles

  return (
    <div className="border-t border-gray-800 bg-gray-950 p-4 shrink-0">
      <div className="max-w-3xl mx-auto">

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {attachments.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300"
              >
                {f.isImage
                  ? <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  : <Paperclip className="w-3.5 h-3.5 text-gray-400" />}
                <span className="truncate max-w-[120px]">{f.name}</span>
                <span className="text-gray-500">{fmtSize(f.size)}</span>
                <button
                  onClick={() => onRemoveAttachment(i)}
                  className="text-gray-500 hover:text-red-400 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden focus-within:border-gray-500 transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Prompt Optimiser… (Shift+Enter for new line)"
            disabled={busy}
            rows={1}
            className="w-full bg-transparent px-4 pt-3.5 pb-1 text-sm text-gray-100 placeholder-gray-600 resize-none outline-none min-h-[44px] max-h-60 disabled:opacity-60"
          />

          <div className="flex items-center justify-between px-3 py-2 gap-2">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                title="Attach any file — no size limit"
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {processingFiles
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Paperclip className="w-4 h-4" />}
              </button>

              <button
                onClick={handleOptimize}
                disabled={busy || !text.trim()}
                title="Rewrite prompt with AI"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-yellow-400 hover:text-yellow-300 hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {optimizing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Zap className="w-3.5 h-3.5" />}
                Optimise
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={e => onModelChange(e.target.value)}
                disabled={busy}
                className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-2 py-1.5 outline-none hover:border-gray-500 transition-colors disabled:opacity-40"
              >
                {GROQ_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <button
                onClick={handleSend}
                disabled={busy || (!text.trim() && attachments.length === 0)}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                title="Send (Enter)"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-700 text-center mt-2">
          Powered by Groq · PDF, DOCX, TXT, CSV, images and more · No file size limit
        </p>
      </div>
    </div>
  )
}
