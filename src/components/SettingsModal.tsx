'use client'

import { useState } from 'react'
import { X, ExternalLink, Eye, EyeOff } from 'lucide-react'

interface Props {
  apiKey: string
  onSave: (key: string) => void
  onClose: () => void
}

export default function SettingsModal({ apiKey, onSave, onClose }: Props) {
  const [key, setKey] = useState(apiKey)
  const [show, setShow] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Groq API Key
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Free at{' '}
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5"
              >
                console.groq.com <ExternalLink className="w-3 h-3" />
              </a>
              . If already set in <code className="text-gray-400">.env.local</code>, leave blank.
            </p>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-indigo-500 pr-10 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            Key stored in browser localStorage only. Sent only to your own API proxy.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(key.trim()); onClose() }}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
