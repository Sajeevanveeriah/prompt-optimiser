'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types'
import MessageBubble from './MessageBubble'

interface Props {
  messages: Message[]
  loading: boolean
}

export default function MessageList({ messages, loading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">Prompt Optimiser</h2>
        <p className="text-gray-500 text-sm max-w-sm">
          Chat with AI, upload any file, and hit <span className="text-yellow-400">⚡ Optimise</span> to rewrite your prompt before sending.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-6">
      <div className="max-w-3xl mx-auto px-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 py-2 px-4">
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
