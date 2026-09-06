export function drawDebugInformation(context: CanvasRenderingContext2D, money: number): void {
  context.save()

  try {
    context.fillStyle = '#0f172a'
    context.font = '16px monospace'
    context.textAlign = 'left'
    context.textBaseline = 'alphabetic'
    context.fillText(`Money: ${money}`, 16, 28)
  } finally {
    context.restore()
  }
}
