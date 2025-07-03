export function getCanvasPoint(
  e: Pick<PointerEvent, 'clientX' | 'clientY'>,
  rect: DOMRect,
  scale: number,
) {
  return {
    x: (e.clientX - rect.left) / scale,
    y: (e.clientY - rect.top) / scale,
  }
}
