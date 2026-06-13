export type Role = 'user' | 'assistant' | 'system'

export interface FileAttachment {
  name: string
  type: string
  size: number
  isImage: boolean
}

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: number
  attachments?: FileAttachment[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: number
  updatedAt: number
}

export interface GroqModel {
  id: string
  name: string
  description: string
}

export const GROQ_MODELS: GroqModel[] = [
  { id: 'llama-3.1-8b-instant',    name: 'Llama 3.1 8B',  description: 'Fast, efficient' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Most capable' },
  { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B',  description: 'Long context 32K' },
  { id: 'gemma2-9b-it',            name: 'Gemma 2 9B',    description: 'Google open model' },
]

export const DEFAULT_SYSTEM_PROMPT =
  `You are a helpful, accurate, and thorough AI assistant. When users share documents, analyse them carefully and give detailed, relevant responses. Use markdown formatting for clarity.`
