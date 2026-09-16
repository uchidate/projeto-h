import { type NextRequest, NextResponse } from 'next/server'

/**
 * Recebe as violações da Content Security Policy em modo report-only.
 *
 * O log vai para stdout, que o promtail recolhe para o Loki — mesmo caminho do
 * resto dos logs da aplicação, sem serviço novo e sem dependência externa.
 *
 * ── Por que há limite de taxa aqui ──────────────────────────────────────────
 *
 * Uma diretiva mal calibrada gera uma violação por recurso bloqueado, por
 * página, por visitante. Um único domínio de anúncio faltando na lista viraria
 * dezenas de milhares de linhas por hora — o disco enche, o Loki fica inútil e
 * o log de produção afunda junto. O endpoint que existe para revelar problema
 * não pode se tornar um.
 *
 * O limite é por processo e por diretiva violada: interessa saber QUE diretiva
 * falhou e em que ordem de grandeza, não registrar cada ocorrência.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JANELA_MS = 60_000
const MAXIMO_POR_JANELA = 5

const contagem = new Map<string, { n: number; ate: number }>()

function deveRegistrar(chave: string): { registrar: boolean; suprimidas: number } {
    const agora = Date.now()
    const atual = contagem.get(chave)

    if (!atual || agora > atual.ate) {
        // Ao virar a janela, informa quantas foram suprimidas na anterior: o
        // número importa para dimensionar o problema, mesmo sem as linhas.
        const suprimidas = atual && atual.n > MAXIMO_POR_JANELA ? atual.n - MAXIMO_POR_JANELA : 0
        contagem.set(chave, { n: 1, ate: agora + JANELA_MS })
        return { registrar: true, suprimidas }
    }

    atual.n += 1
    return { registrar: atual.n <= MAXIMO_POR_JANELA, suprimidas: 0 }
}

/**
 * Os dois formatos usam grafias DIFERENTES para os mesmos campos.
 *
 * `report-uri` (legado) manda kebab-case: `effective-directive`, `blocked-uri`.
 * A Reporting API do `report-to` manda camelCase: `effectiveDirective`,
 * `blockedURL`. A primeira versão só lia o kebab-case — e como os navegadores
 * atuais usam `report-to`, as 42 violações coletadas em uma semana chegaram
 * todas como `diretiva=desconhecida origem=desconhecido`.
 *
 * O endpoint parecia funcionar: respondia 204, escrevia no log, o alerta de
 * volume nunca disparou. Só não dizia nada — e como tudo caía na mesma chave,
 * o limite de taxa ainda suprimia o pouco que havia.
 */
type Violacao = {
    'violated-directive'?: string
    'effective-directive'?: string
    'blocked-uri'?: string
    'document-uri'?: string
    violatedDirective?: string
    effectiveDirective?: string
    blockedURL?: string
    documentURL?: string
}

export async function POST(req: NextRequest) {
    let corpo: unknown
    try {
        corpo = await req.json()
    } catch {
        // Corpo ilegível não é motivo para erro: o navegador não vai reenviar,
        // e devolver 4xx só polui a métrica de erro do proxy.
        return new NextResponse(null, { status: 204 })
    }

    // Dois formatos convivem: `report-uri` manda {"csp-report": {...}} e
    // `report-to` manda um array de relatórios. Aceitar só um perderia
    // metade dos navegadores.
    const relatorios: Violacao[] = Array.isArray(corpo)
        ? (corpo as { body?: Violacao }[]).map((r) => r.body ?? {})
        : [((corpo as { 'csp-report'?: Violacao })['csp-report'] ?? {}) as Violacao]

    for (const r of relatorios) {
        const diretiva =
            r['effective-directive'] || r.effectiveDirective ||
            r['violated-directive'] || r.violatedDirective || 'desconhecida'
        const bloqueado = r['blocked-uri'] || r.blockedURL || 'desconhecido'
        const pagina = r['document-uri'] || r.documentURL || '-'

        // A chave é diretiva + origem bloqueada, não a URL inteira: o que se
        // quer contar é "quantas origens distintas a política barraria", e
        // agrupar por página inflaria tudo sem acrescentar informação.
        let origem = bloqueado
        try {
            origem = new URL(bloqueado).origin
        } catch {
            /* valores como 'inline', 'eval' ou 'data' não são URL */
        }

        const { registrar, suprimidas } = deveRegistrar(`${diretiva}|${origem}`)
        if (suprimidas > 0) {
            console.warn(`[csp] ${suprimidas} violacoes suprimidas na janela anterior: ${diretiva} ${origem}`)
        }
        if (registrar) {
            console.warn(
                `[csp] violacao diretiva=${diretiva} origem=${origem} pagina=${pagina}`,
            )
        }
    }

    return new NextResponse(null, { status: 204 })
}
