/**
 * Endpoint de métricas Prometheus.
 *
 * Exposto na internet pública — o Prometheus raspa pelo domínio de produção —,
 * então é protegido por Bearer token — o mesmo arquivo que o Prometheus já usa
 * em `authorization.credentials_file`.
 *
 * Sem token configurado o endpoint responde 503 em vez de servir aberto: falhar
 * fechado é a única opção segura, já que as métricas revelam inventário,
 * versões e comportamento interno da aplicação.
 */
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { metricas } from '@/lib/metrics/registry'
import { coletarTudo } from '@/lib/metrics/collectors'

// process.memoryUsage e o registro em memória exigem runtime Node; no edge
// nada disso existe.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Comparação em tempo constante.
 *
 * `a === b` retorna assim que encontra o primeiro byte diferente, e a diferença
 * de tempo entre "errou no primeiro caractere" e "errou no último" é
 * mensurável pela rede. Com tentativas suficientes, isso permite descobrir o
 * token byte a byte.
 */
function tokenConfere(recebido: string, esperado: string): boolean {
    const a = Buffer.from(recebido)
    const b = Buffer.from(esperado)
    // timingSafeEqual exige mesmo tamanho; comparar o tamanho antes vaza apenas
    // o comprimento, que não é segredo útil.
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
}

function semCache(headers: Record<string, string> = {}): Record<string, string> {
    return { 'Cache-Control': 'no-store, max-age=0', ...headers }
}

export async function GET(request: Request) {
    const esperado = process.env.METRICS_TOKEN

    if (!esperado) {
        // Sem segredo configurado não há como autenticar: fecha.
        return new NextResponse('metrics endpoint not configured\n', {
            status: 503,
            headers: semCache({ 'Content-Type': 'text/plain; charset=utf-8' }),
        })
    }

    const cabecalho = request.headers.get('authorization') ?? ''
    const recebido = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : ''

    if (!recebido || !tokenConfere(recebido, esperado)) {
        return new NextResponse('unauthorized\n', {
            status: 401,
            headers: semCache({
                'Content-Type': 'text/plain; charset=utf-8',
                'WWW-Authenticate': 'Bearer',
            }),
        })
    }

    const m = metricas()
    try {
        await coletarTudo()
    } catch {
        // Coleta parcial ainda vale: melhor entregar as séries que existem do
        // que falhar o scrape inteiro e abrir um buraco no gráfico.
    }

    const corpo = await m.registro.metrics()
    return new NextResponse(corpo, {
        status: 200,
        headers: semCache({ 'Content-Type': m.registro.contentType }),
    })
}
