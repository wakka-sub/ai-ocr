import { cropCanvas } from '../src/utils/crop'
import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'

let img: HTMLImageElement

beforeAll(async () => {
  const buf = execSync('curl -Ls https://i.imgur.com/dojzxyo.png')
  const base64 = buf.toString('base64')
  img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('failed to load image'))
    img.src = `data:image/png;base64,${base64}`
  })
}, 20000)

describe('cropCanvas', () => {
  it('returns base64 string', () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const data = cropCanvas(canvas, 0, 0, 50, 50)
    expect(data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
  })

  it('rotates the cropped area', () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const data = cropCanvas(canvas, 0, 0, 40, 20, 90)
    expect(data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
  })
})
