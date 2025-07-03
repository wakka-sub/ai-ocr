import { describe, it, expect } from 'vitest'
import { getCanvasPoint } from '../src/utils/pointer'

describe('getCanvasPoint', () => {
  it('calculates coordinates with scale', () => {
    const rect = { left: 10, top: 20 } as DOMRect
    const point = getCanvasPoint(
      { clientX: 30, clientY: 60 } as PointerEvent,
      rect,
      2,
    )
    expect(point).toEqual({ x: 10, y: 20 })
  })
})
