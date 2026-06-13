'use client'

import { Conversation } from '@/lib/types'
import { Settings, Plus, Trash2, MessageSquare } from 'lucide-react'

interface Props {
  conversations: Conversation[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  isOpen: boolean
  onSettings: () => void
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return new Date(ts).toLocaleDateString()
}

export default function Sidebar({
  conversations, currentId, onSelect, onNew, onDelete, isOpen, onSettings
}: Props) {
  if (!isOpen) return null

  return (
    <div className="flex flex-col w-64 shrink-0 bg-gray-900 border-r border-gray-800 h-screen">
      <div className="p-3 border-b border-gray-800">
        <button
          onClick={onNew}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-8 px-4">
            No conversations yet. Start by typing a message.
          </p>
        )}
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-start gap-2 mx-2 mb-0.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              conv.id === currentId
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate leading-tight">{conv.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{relativeTime(conv.updatedAt)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-500 hover:text-red-400 transition-all"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={onSettings}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings / API key
        </button>
      </div>
    </div>
  )
}
