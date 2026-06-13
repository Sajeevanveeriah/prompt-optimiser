# Prompt Optimiser

AI chat interface with prompt optimisation and unlimited file uploads. Powered by Groq (free).

## Features
- ChatGPT/Claude-style UI with conversation history
- Streaming responses
- Upload any file type — PDF, DOCX, TXT, CSV, JSON, images, code, etc. — with no size limit (processed in browser)
- ⚡ One-click prompt optimiser rewrites your prompt before sending
- Multiple Groq models: Llama 3.1 8B, Llama 3.3 70B, Mixtral 8x7B, Gemma 2 9B
- Conversation history in localStorage

## Setup

### 1. Groq API key (free)
Sign up at https://console.groq.com — no credit card needed. Free tier: 14,400 requests/day.

### 2. Install and run
npm install
cp .env.example .env.local
# Add GROQ_API_KEY=gsk_... to .env.local
npm run dev

Open http://localhost:3000

### 3. Deploy to Vercel (free)
Push to GitHub, import at vercel.com/new, add GROQ_API_KEY as environment variable, deploy.
Auto-deploys on every push.

## File processing
All files are extracted in the browser — no upload size limit on the server side.
- PDF: text extracted with PDF.js
- DOCX: text extracted with mammoth.js
- All other files: read as plain text
