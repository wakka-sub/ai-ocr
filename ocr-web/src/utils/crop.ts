export function cropCanvas(
  source: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0
) {
  const rad = (rotation * Math.PI) / 180
  const swap = Math.abs(rotation % 180) === 90
  const off = document.createElement('canvas')
  off.width = swap ? height : width
  off.height = swap ? width : height
  const ctx = off.getContext('2d')!
  ctx.translate(off.width / 2, off.height / 2)
  ctx.rotate(rad)
  ctx.drawImage(
    source,
    x,
    y,
    width,
    height,
    -width / 2,
    -height / 2,
    width,
    height
  )
  return off.toDataURL('image/png').split(',')[1]
}
