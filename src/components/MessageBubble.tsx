'use client'

import React from 'react'
import { Message } from '@/lib/types'
import { fmtSize } from '@/lib/fileProcessor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Paperclip, Image as ImageIcon } from 'lucide-react'

interface Props { message: Message }

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const displayContent = isUser
    ? message.content.split('\n\n---\n')[0]
    : message.content

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col gap-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>

        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-300"
              >
                {att.isImage
                  ? <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  : <Paperclip className="w-3.5 h-3.5 text-gray-400" />}
                <span className="truncate max-w-[140px]">{att.name}</span>
                <span className="text-gray-500">{fmtSize(att.size)}</span>
              </div>
            ))}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{displayContent}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className } = props
                    const match = /language-(\w+)/.exec(className ?? '')
                    return match ? (
                      <SyntaxHighlighter
                        style={oneDark as { [key: string]: React.CSSProperties }}
                        language={match[1]}
                        PreTag="div"
                        className="!rounded-lg !text-xs !my-2"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) { return <>{children}</> },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {message.content === '' && (
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse rounded" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
