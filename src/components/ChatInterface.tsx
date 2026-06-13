'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import MessageList from './MessageList'
import InputArea from './InputArea'
import SettingsModal from './SettingsModal'
import { Conversation, Message, GROQ_MODELS, DEFAULT_SYSTEM_PROMPT } from '@/lib/types'
import { ProcessedFile } from '@/lib/fileProcessor'

const STORAGE_KEY = 'po-conversations'

const MAX_STORED_CHARS = 6000

function persistConversations(conversations: Conversation[]) {
  // Storage-safe copy: cap very long message bodies (e.g. extracted file text)
  const slim = (list: Conversation[]) =>
    list.map(c => ({
      ...c,
      messages: c.messages.map(m =>
        m.content.length > MAX_STORED_CHARS
          ? { ...m, content: m.content.slice(0, MAX_STORED_CHARS) + '\n\n[Content trimmed to fit local storage]' }
          : m
      ),
    }))

  let working = slim(conversations)
  while (true) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(working))
      return
    } catch {
      // Over quota: drop the oldest conversation (newest is at index 0) and retry.
      if (working.length <= 1) {
        try { localStorage.removeItem(STORAGE_KEY) } catch {}
        return
      }
      working = working.slice(0, -1)
    }
  }
}

function uid(): string {
  return crypto.randomUUID()
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState(GROQ_MODELS[0].id)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [attachments, setAttachments] = useState<ProcessedFile[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [groqKey, setGroqKey] = useState('')
  const streamRef = useRef('')

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed: Conversation[] = JSON.parse(raw)
        setConversations(parsed)
        if (parsed.length) setCurrentId(parsed[0].id)
      } catch {}
    }
    setGroqKey(localStorage.getItem('po-groq-key') ?? '')
  }, [])

  useEffect(() => {
    persistConversations(conversations)
  }, [conversations])

  const currentConv = conversations.find(c => c.id === currentId) ?? null

  const newConversation = useCallback(() => {
    const id = uid()
    const conv: Conversation = {
      id, title: 'New conversation', messages: [],
      model, createdAt: Date.now(), updatedAt: Date.now(),
    }
    setConversations(prev => [conv, ...prev])
    setCurrentId(id)
    setAttachments([])
  }, [model])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id)
      return next
    })
    setCurrentId(prev => {
      if (prev !== id) return prev
      return conversations.find(c => c.id !== id)?.id ?? null
    })
  }, [conversations])

  const saveApiKey = useCallback((key: string) => {
    setGroqKey(key)
    localStorage.setItem('po-groq-key', key)
  }, [])

  const streamChat = useCallback(async (
    messages: { role: string; content: string }[],
    selectedModel: string,
    onToken: (t: string) => void
  ) => {
    const key = groqKey || localStorage.getItem('po-groq-key') || ''
    if (!key) {
      throw new Error('No Groq API key. Click "Settings / API key" at the bottom of the sidebar and paste your gsk_... key.')
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
        max_tokens: 8192,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error?.message ?? `Groq error: HTTP ${response.status}`)
    }

    const reader = response.body!.getReader()
    const dec = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = dec.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const token: string = parsed.choices?.[0]?.delta?.content ?? ''
          if (token) onToken(token)
        } catch {}
      }
    }
  }, [groqKey])

  const sendMessage = useCallback(async (text: string, files: ProcessedFile[]) => {
    if (!text.trim() && files.length === 0) return

    let convId = currentId
    if (!convId) {
      const id = uid()
      const conv: Conversation = {
        id,
        title: text.slice(0, 60) || 'New conversation',
        messages: [],
        model,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setConversations(prev => [conv, ...prev])
      setCurrentId(id)
      convId = id
    }

    let fullContent = text
    if (files.length > 0) {
      const fileContext = files
        .map(f => f.isImage
          ? `\n\n[Image attached: ${f.name}]`
          : `\n\n---\nFile: ${f.name}\n\n${f.content}`)
        .join('')
      fullContent = text + fileContext
    }

    const userMsg: Message = {
      id: uid(), role: 'user', content: fullContent, timestamp: Date.now(),
      attachments: files.map(f => ({ name: f.name, type: f.type, size: f.size, isImage: f.isImage })),
    }
    const aiMsgId = uid()
    const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() }

    setConversations(prev => prev.map(c => {
      if (c.id !== convId) return c
      return {
        ...c,
        title: c.messages.length === 0 ? (text.slice(0, 60) || 'New conversation') : c.title,
        messages: [...c.messages, userMsg, aiMsg],
        updatedAt: Date.now(),
      }
    }))
    setAttachments([])
    setLoading(true)
    streamRef.current = ''

    try {
      const conv = conversations.find(c => c.id === convId)
      const history = [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        ...(conv?.messages ?? []).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: fullContent },
      ]

      await streamChat(history, model, (token) => {
        streamRef.current += token
        const snapshot = streamRef.current
        setConversations(prev => prev.map(c => {
          if (c.id !== convId) return c
          return {
            ...c,
            messages: c.messages.map(m =>
              m.id === aiMsgId ? { ...m, content: snapshot } : m
            ),
          }
        }))
      })
    } catch (err) {
      const errText = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c
        return {
          ...c,
          messages: c.messages.map(m =>
            m.id === aiMsgId ? { ...m, content: errText } : m
          ),
        }
      }))
    } finally {
      setLoading(false)
    }
  }, [currentId, conversations, model, streamChat])

  const optimizePrompt = useCallback(async (prompt: string): Promise<string> => {
    if (!prompt.trim()) return prompt
    let result = ''
    await streamChat(
      [
        {
          role: 'system',
          content: `You are an expert prompt engineer. Rewrite the user's prompt to be clearer, more specific, and more effective for AI models. Return ONLY the improved prompt — no explanation, no quotes, no preamble.`,
        },
        { role: 'user', content: prompt },
      ],
      'llama-3.1-8b-instant',
      (token) => { result += token }
    )
    return result.trim()
  }, [streamChat])

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar
        conversations={conversations}
        currentId={currentId}
        onSelect={setCurrentId}
        onNew={newConversation}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-gray-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm text-gray-400 truncate">
            {currentConv?.title ?? 'Prompt Optimiser'}
          </span>
        </div>

        <MessageList messages={currentConv?.messages ?? []} loading={loading} />

        <InputArea
          onSend={sendMessage}
          onOptimize={optimizePrompt}
          onNewFiles={(newFiles) => setAttachments(prev => [...prev, ...newFiles])}
          attachments={attachments}
          onRemoveAttachment={(i) => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
          loading={loading}
          model={model}
          onModelChange={setModel}
        />
      </div>

      {settingsOpen && (
        <SettingsModal
          apiKey={groqKey}
          onSave={saveApiKey}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
