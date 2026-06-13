export interface ProcessedFile {
  name: string
  type: string
  size: number
  content: string
  isImage: boolean
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const isImage = file.type.startsWith('image/')
  let content = ''

  try {
    if (file.type === 'application/pdf' || ext === 'pdf') {
      content = await extractPDF(file)
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    ) {
      content = await extractDOCX(file)
    } else if (isImage) {
      content = await readDataURL(file)
    } else {
      content = await readText(file)
    }
  } catch (err) {
    content = `[Could not read file: ${err instanceof Error ? err.message : 'unknown error'}]`
  }

  return { name: file.name, type: file.type || ext, size: file.size, content, isImage }
}

async function extractPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((it) => 'str' in it ? (it as { str: string }).str : '').join(' ')
    pages.push(`[Page ${i}]\n${text}`)
  }
  return pages.join('\n\n')
}

async function extractDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buf = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return result.value
}

function readDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = (e) => res(e.target?.result as string)
    r.onerror = () => rej(new Error('FileReader failed'))
    r.readAsDataURL(file)
  })
}

function readText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = (e) => res(e.target?.result as string ?? '')
    r.onerror = () => rej(new Error('FileReader failed'))
    r.readAsText(file)
  })
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}
