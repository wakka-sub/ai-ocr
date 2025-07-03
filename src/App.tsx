import { useRef, useState, useEffect, useCallback } from 'react'
import './App.css'
import { cropCanvas } from './utils/crop'

interface Rect {
  id: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  thumb: string
  text?: string
  loading?: boolean
}

const promptText =
  'You are a professional OCR assistant. Transcribe only the text that appears in the supplied image. Return plain UTF-8 with no extra markup.'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [drawing, setDrawing] = useState<Rect | null>(null)
  const [counter, setCounter] = useState(1)
  const [running, setRunning] = useState(false)
  const [dragging, setDragging] = useState(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')!
    canvas.width = image.width
    canvas.height = image.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
    const all = drawing ? [...rects, drawing] : rects
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.font = '16px sans-serif'
    ctx.fillStyle = 'red'
    all.forEach((r) => {
      ctx.strokeRect(r.x, r.y, r.width, r.height)
      ctx.fillText(String(r.id), r.x + 4, r.y + 16)
    })
  }, [image, rects, drawing])

  // redraw when image or rectangles change
  useEffect(() => {
    draw()
  }, [draw])

  const loadFile = (file: File) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      const off = document.createElement('canvas')
      off.width = img.width
      off.height = img.height
      off.getContext('2d')!.drawImage(img, 0, 0)
      baseCanvasRef.current = off
    }
    img.src = URL.createObjectURL(file)
    setRects([])
    setCounter(1)
  }

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return
    loadFile(files[0])
  }

  const startDraw = (e: React.MouseEvent) => {
    if (!image) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrawing({
      id: counter,
      x,
      y,
      width: 0,
      height: 0,
      rotation: 0,
      thumb: '',
    })
  }

  const moveDraw = (e: React.MouseEvent) => {
    if (!drawing) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrawing({ ...drawing, width: x - drawing.x, height: y - drawing.y })
  }

  const endDraw = () => {
    if (!drawing) return
    const finalized = {
      ...drawing,
      width: Math.abs(drawing.width),
      height: Math.abs(drawing.height),
      x: Math.min(drawing.x, drawing.x + drawing.width),
      y: Math.min(drawing.y, drawing.y + drawing.height),
      rotation: 0,
    }
    const thumb = cropBase64(finalized)
    setRects([...rects, { ...finalized, thumb }])
    setCounter(counter + 1)
    setDrawing(null)
  }

  const removeRect = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setRects((prev) =>
      prev.filter(
        (r) =>
          !(x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height),
      ),
    )
  }

  const rotateRect = (id: number) => {
    setRects((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const rotated = { ...r, rotation: (r.rotation + 90) % 360 }
        return { ...rotated, thumb: cropBase64(rotated) }
      }),
    )
  }

  const removeRectById = (id: number) => {
    setRects((prev) => prev.filter((r) => r.id !== id))
  }

  const cropBase64 = (r: {
    x: number
    y: number
    width: number
    height: number
    rotation: number
  }) => {
    if (!baseCanvasRef.current) return ''
    return cropCanvas(
      baseCanvasRef.current,
      r.x,
      r.y,
      r.width,
      r.height,
      r.rotation,
    )
  }

  const fetchOCR = async (imgData: string): Promise<string> => {
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            { inline_data: { mime_type: 'image/png', data: imgData } },
          ],
        },
      ],
      generationConfig: { temperature: 0.0, topP: 0.9, topK: 40 },
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_APIKEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`) as Error & { status?: number }
        err.status = res.status
        throw err
      }
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  }

  const retry = async <T,>(fn: () => Promise<T>, attempt = 0): Promise<T> => {
    try {
      return await fn()
    } catch (e) {
      const status = (e as { status?: number } | undefined)?.status
      const base = status === 429 ? 2000 : 1000
      const delay = base * Math.pow(2, attempt)
      await new Promise((r) => setTimeout(r, delay))
      return retry(fn, attempt + 1)
    }
  }

  const runOCR = async () => {
    setRunning(true)
    const targets = rects.filter((r) => !r.text && !r.loading)
    setRects((prev) =>
      prev.map((r) => (targets.includes(r) ? { ...r, loading: true } : r)),
    )
    const tasks = targets.map((r) => async () => {
      const base = cropBase64(r)
      const text = await retry(() => fetchOCR(base))
      setRects((prev) =>
        prev.map((p) => (p.id === r.id ? { ...p, text, loading: false } : p)),
      )
    })
    let index = 0
    const workers = Array.from(
      { length: Math.min(5, tasks.length) },
      async () => {
        while (index < tasks.length) {
          const current = tasks[index++]
          await current()
        }
      },
    )
    await Promise.all(workers)
    setRunning(false)
  }

  const runOne = async (id: number) => {
    const target = rects.find((r) => r.id === id)
    if (!target) return
    setRects((prev) =>
      prev.map((r) => (r.id === id ? { ...r, loading: true } : r)),
    )
    const base = cropBase64(target)
    const text = await retry(() => fetchOCR(base))
    setRects((prev) =>
      prev.map((r) => (r.id === id ? { ...r, text, loading: false } : r)),
    )
  }

  const copyResults = async () => {
    const txt = rects.map((r) => r.text || '').join('\n')
    await navigator.clipboard.writeText(txt)
  }

  const copyOne = async (text?: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-on-primary p-4 shadow-elevation-2 md-headlineSmall">
        AI OCR Web App
      </header>
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        <div
          className="flex-1 flex flex-col items-center p-4 space-y-4 rounded-md shadow-elevation-1 overflow-auto drop-zone"
          data-drag={dragging || undefined}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            handleFiles(e.dataTransfer.files)
            setDragging(false)
          }}
        >
          {!image && (
            <label className="w-64 h-32 flex flex-col items-center justify-center drop-zone cursor-pointer">
              <span>Drop image or click to upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
            </label>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onDoubleClick={removeRect}
            className="border border-outline rounded-md shadow-elevation-1 flex-none transition-std"
          />
          {rects.length === 0 && image && (
            <p className="text-bodyMedium text-on-surface-variant">Drag to select regions.</p>
          )}
          {image && (
            <div className="mt-4 flex flex-wrap gap-4 w-full">
              {rects.length === 0 && (
                <p className="text-on-surface-variant text-bodyMedium">No selections yet.</p>
              )}
              {rects.map((r) => (
                <div key={r.id} className="flex flex-col items-center md-labelLarge animate-fadeIn">
                  <img
                    src={`data:image/png;base64,${r.thumb}`}
                    alt={`rect ${r.id}`}
                    className="w-20 h-20 object-contain border border-outline rounded-md shadow-elevation-1 transition-transform hover:scale-105"
                  />
                  <div className="mt-1 flex space-x-2">
                    <button
                      className="filled-btn md-labelLarge focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center"
                      onClick={() => rotateRect(r.id)}
                    >
                      <span className="material-symbols-rounded text-base">rotate_right</span>
                    </button>
                    <button
                      className="bg-danger text-on-primary px-1.5 py-0.5 rounded-md md-labelLarge focus:outline-none focus:ring-2 focus:ring-danger state-layer state-hover state-pressed transition-std flex items-center justify-center"
                      onClick={() => removeRectById(r.id)}
                    >
                      <span className="material-symbols-rounded text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-80 flex-none p-4 bg-surface rounded-md shadow-elevation-2 flex flex-col overflow-y-auto">
          <div className="mb-4 space-x-3 items-center flex">
            <button
              className="filled-btn md-labelLarge focus:outline-none focus:ring-2 focus:ring-primary flex items-center"
              onClick={runOCR}
            >
              <span className="material-symbols-rounded mr-1 text-base">play_arrow</span>
              Run OCR
            </button>
            <button
              className="outlined-btn md-labelLarge text-primary focus:outline-none focus:ring-2 focus:ring-primary flex items-center"
              onClick={copyResults}
            >
              <span className="material-symbols-rounded mr-1 text-base">content_copy</span>
              Copy Results
            </button>
            <button
              className="text-btn md-labelLarge focus:outline-none focus:ring-2 focus:ring-primary flex items-center"
              onClick={() => setRects([])}
            >
              <span className="material-symbols-rounded mr-1 text-base">delete_sweep</span>
              Clear Rects
            </button>
            {running && (
              <span className="ml-2 flex items-center text-bodyMedium text-primary">
                <svg
                  className="w-4 h-4 mr-1 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Running...
              </span>
            )}
          </div>
          <div className="space-y-4">
            {rects.length === 0 && (
              <p className="text-on-surface-variant text-bodyMedium">No regions yet.</p>
            )}
            {rects.map((r) => (
              <div key={r.id} className="border border-outline rounded-md p-2 bg-surface-container-low shadow-elevation-1 animate-fadeIn">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">#{r.id}</span>
                  <div className="space-x-2">
                    <button
                      className="filled-btn md-labelLarge focus:outline-none focus:ring-2 focus:ring-primary flex items-center justify-center"
                      onClick={() => runOne(r.id)}
                    >
                      <span className="material-symbols-rounded text-base">play_arrow</span>
                    </button>
                    <button
                      className="bg-success text-on-primary px-1.5 py-0.5 rounded-md md-labelLarge focus:outline-none focus:ring-2 focus:ring-success state-layer state-hover state-pressed transition-std flex items-center justify-center"
                      onClick={() => copyOne(r.text)}
                    >
                      <span className="material-symbols-rounded text-base">content_copy</span>
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap break-all text-bodyMedium">
                  {r.loading ? '...running...' : r.text}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
