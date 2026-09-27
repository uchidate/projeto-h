import { SITE_NAME } from '@/lib/constants/site'

const WIDTH = 720
const HEIGHT = 1280

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}

/** Desenha o cartão de resultado do quiz num canvas 720x1280 (proporção de story). */
function draw(ctx: CanvasRenderingContext2D, props: { title: string; score: number; total: number; points: number; streak: number; accent: string }) {
    const { title, score, total, points, streak, accent } = props

    const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
    bg.addColorStop(0, '#2a0f1e')
    bg.addColorStop(0.6, '#0d0b0f')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.fillStyle = accent
    ctx.font = '800 26px ui-monospace, Menlo, monospace'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`HALLYUHUB · QUIZ`, 56, 100)

    ctx.fillStyle = '#c8c8d4'
    ctx.font = '600 30px Arial, sans-serif'
    ctx.fillText('Meu resultado no quiz', 56, 640)

    ctx.fillStyle = '#f0f0f4'
    ctx.font = '700 96px Georgia, serif'
    wrapText(ctx, title, 56, 730, WIDTH - 112, 96)

    ctx.fillStyle = '#c8c8d4'
    ctx.font = '600 30px Arial, sans-serif'
    const pctText = `${score} de ${total} · ${points.toLocaleString('pt-BR')} pts`
    ctx.fillText(pctText, 56, 900)

    if (streak >= 3) {
        ctx.fillStyle = '#ffe14d'
        ctx.font = '700 30px Arial, sans-serif'
        ctx.fillText(`🔥 sequência de ${streak}`, 56, 950)
    }

    ctx.fillStyle = accent
    roundRect(ctx, 56, HEIGHT - 160, WIDTH - 112, 88, 8)
    ctx.fill()
    ctx.fillStyle = '#0d0b0f'
    ctx.font = '800 28px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Faça o seu em ${SITE_NAME.toLowerCase()}.com.br/quiz`, WIDTH / 2, HEIGHT - 105)
    ctx.textAlign = 'left'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(' ')
    let line = ''
    let cursorY = y
    for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, cursorY)
            line = word
            cursorY += lineHeight
        } else {
            line = test
        }
    }
    if (line) ctx.fillText(line, x, cursorY)
}

/** Gera o PNG do cartão de resultado. Retorna null se o navegador não suportar canvas. */
export async function generateShareCard(props: { title: string; score: number; total: number; points: number; streak: number; accent: string }): Promise<Blob | null> {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    draw(ctx, props)
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}
