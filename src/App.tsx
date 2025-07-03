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
}

const promptText =
  'You are a professional OCR assistant. Transcribe only the text that appears in the supplied image. Return plain UTF-8 with no extra markup.'

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [rects, setRects] = useState<Rect[]>([])
  const [drawing, setDrawing] = useState<Rect | null>(null)
  const [counter, setCounter] = useState(1)

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
    img.onload = () => setImage(img)
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
    setDrawing({ id: counter, x, y, width: 0, height: 0, rotation: 0 })
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
    const canvas = canvasRef.current!
    return cropCanvas(canvas, r.x, r.y, r.width, r.height, r.rotation)
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
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  }

  const retry = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
    try {
      return await fn()
    } catch (e) {
      if (retries === 0) throw e
      await new Promise((r) => setTimeout(r, (2 - retries) * 500 + 500))
      return retry(fn, retries - 1)
    }
  }

  const runOCR = async () => {
    const tasks = rects.map((r) => async () => {
      const base = cropBase64(r)
      const text = await retry(() => fetchOCR(base))
      setRects((prev) => prev.map((p) => (p.id === r.id ? { ...p, text } : p)))
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
    <div className="flex h-screen">
      <div
        className="flex-1 flex flex-col items-center justify-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFiles(e.dataTransfer.files)
        }}
      >
        {!image && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="mb-2"
          />
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onDoubleClick={removeRect}
          className="border"
        />
        <div className="mt-2 w-full max-h-40 overflow-x-auto flex space-x-2">
          {rects.map((r) => (
            <div key={r.id} className="flex flex-col items-center text-sm">
              <img
                src={`data:image/png;base64,${r.thumb}`}
                alt={`rect ${r.id}`}
                className="w-20 h-20 object-contain border"
              />
              <div className="mt-1 flex space-x-1">
                <button
                  className="bg-purple-500 text-white px-1 py-0.5 rounded text-xs"
                  onClick={() => rotateRect(r.id)}
                >
                  Rotate
                </button>
                <button
                  className="bg-red-500 text-white px-1 py-0.5 rounded text-xs"
                  onClick={() => removeRectById(r.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-64 border-l p-2 flex flex-col overflow-y-auto">
        <div className="mb-2 space-x-2">
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded"
            onClick={runOCR}
          >
            Run OCR
          </button>
          <button
            className="bg-green-500 text-white px-2 py-1 rounded"
            onClick={copyResults}
          >
            Copy Results
          </button>
          <button
            className="bg-gray-500 text-white px-2 py-1 rounded"
            onClick={() => setRects([])}
          >
            Clear Rects
          </button>
        </div>
        <div className="space-y-2">
          {rects.map((r) => (
            <div key={r.id} className="border p-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">#{r.id}</span>
                <button
                  className="bg-green-500 text-white px-1 py-0.5 rounded text-xs"
                  onClick={() => copyOne(r.text)}
                >
                  Copy
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm">{r.text}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
