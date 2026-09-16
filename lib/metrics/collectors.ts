/**
 * Coletores das métricas de aplicação.
 *
 * Princípio central: **a coleta nunca pode derrubar o scrape**. O Prometheus
 * raspa a cada 15s; se uma consulta ao WordPress demorar 10s, ela não pode
 * atrasar a resposta nem fazê-la falhar — um scrape que falha apaga TODAS as
 * séries daquele instante, inclusive as saudáveis, e o gráfico ganha um buraco
 * que parece queda da aplicação.
 *
 * Daí o desenho: contagem de conteúdo vem de um snapshot em memória, servido
 * imediatamente mesmo se estiver velho, e revalidado em segundo plano. A idade
 * do snapshot é exposta como métrica, então dado velho é visível em vez de
 * silencioso.
 *
 * Segundo princípio: **nunca emitir número inventado**. Se o WordPress não
 * responde, a série de conteúdo não é publicada com zero — zero significaria
 * "o acervo está vazio", que é uma afirmação falsa e alarmante. A ausência da
 * série, somada a `collector_success 0`, diz a verdade: não sabemos agora.
 */
import { WP_API_URL } from '@/lib/wordpress/config'
import { metricas } from './registry'

/** Tipos de conteúdo do WordPress que compõem o inventário editorial. */
const TIPOS_CONTEUDO = [
    { rotulo: 'artist', caminho: 'artist' },
    { rotulo: 'group', caminho: 'group' },
    { rotulo: 'agency', caminho: 'agency' },
    { rotulo: 'production', caminho: 'production' },
    { rotulo: 'company', caminho: 'company' },
    { rotulo: 'food', caminho: 'food' },
    { rotulo: 'post', caminho: 'posts' },
] as const

/**
 * Contagem é cara (uma requisição por tipo) e muda devagar — o acervo cresce
 * em posts por dia, não por segundo. Revalidar a cada 5 minutos dá dados
 * suficientemente frescos sem bater no WordPress a cada 15s.
 */
const TTL_SNAPSHOT_MS = 5 * 60 * 1000

/** Curto de propósito: o valor do dado cai a zero se ele atrasar o scrape. */
const TIMEOUT_CONTAGEM_MS = 4000
const TIMEOUT_SONDAGEM_MS = 3000

type Snapshot = {
    contagens: Map<string, number>
    emMs: number
    ok: boolean
}

const estado: {
    snapshot: Snapshot | null
    revalidando: Promise<void> | null
} = { snapshot: null, revalidando: null }

/** Só para testes. */
export function limparEstado(): void {
    estado.snapshot = null
    estado.revalidando = null
}

async function contarTipo(caminho: string): Promise<number | null> {
    // per_page=1 porque só interessa o cabeçalho X-WP-Total; trazer os itens
    // seria desperdiçar banda e tempo do WordPress.
    const url = `${WP_API_URL}/wp/v2/${caminho}?per_page=1&status=publish&_fields=id`
    const res = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_CONTAGEM_MS),
    })
    if (!res.ok) return null
    const total = Number(res.headers.get('X-WP-Total'))
    return Number.isSafeInteger(total) && total >= 0 ? total : null
}

async function montarSnapshot(): Promise<Snapshot> {
    const contagens = new Map<string, number>()
    // Em paralelo: sequencial multiplicaria a latência pelo número de tipos.
    const resultados = await Promise.allSettled(
        TIPOS_CONTEUDO.map(async (t) => [t.rotulo, await contarTipo(t.caminho)] as const),
    )
    let falhas = 0
    for (const r of resultados) {
        if (r.status === 'fulfilled' && r.value[1] !== null) {
            contagens.set(r.value[0], r.value[1])
        } else {
            falhas += 1
        }
    }
    return { contagens, emMs: Date.now(), ok: falhas === 0 }
}

function revalidarEmSegundoPlano(): void {
    if (estado.revalidando) return
    const m = metricas()
    const inicio = Date.now()
    estado.revalidando = montarSnapshot()
        .then((s) => {
            // Snapshot parcial não substitui um completo: preferir dados
            // ligeiramente velhos e íntegros a dados frescos e incompletos,
            // que apareceriam no gráfico como uma queda inexistente.
            if (s.ok || !estado.snapshot) estado.snapshot = s
            m.coletorSucesso.set({ coletor: 'conteudo' }, s.ok ? 1 : 0)
        })
        .catch(() => {
            m.coletorSucesso.set({ coletor: 'conteudo' }, 0)
        })
        .finally(() => {
            m.coletorDuracao.observe({ coletor: 'conteudo' }, (Date.now() - inicio) / 1000)
            estado.revalidando = null
        })
}

/**
 * Publica o inventário editorial.
 *
 * Serve o snapshot atual imediatamente (mesmo velho) e dispara revalidação em
 * segundo plano quando expirado — stale-while-revalidate. Só na primeiríssima
 * coleta, sem snapshot algum, ele espera.
 */
export async function coletarConteudo(): Promise<void> {
    const m = metricas()
    const agora = Date.now()
    const expirado = !estado.snapshot || agora - estado.snapshot.emMs > TTL_SNAPSHOT_MS

    if (!estado.snapshot) {
        revalidarEmSegundoPlano()
        await estado.revalidando
    } else if (expirado) {
        revalidarEmSegundoPlano()
    }

    const s = estado.snapshot
    if (!s) return // sem dado nenhum: nao publicar zero, que seria mentira

    m.conteudoItens.reset()
    for (const [tipo, valor] of s.contagens) {
        m.conteudoItens.set({ tipo }, valor)
    }
    m.conteudoIdadeSnapshot.set((Date.now() - s.emMs) / 1000)
}

/**
 * Sonda o WordPress do ponto de vista da aplicação.
 *
 * Complementa o blackbox, que mede de fora: aqui o caminho é o mesmo que as
 * páginas usam, então captura problemas de rede interna e de resolução de nome
 * que a sondagem externa não vê.
 */
export async function coletarCms(): Promise<void> {
    const m = metricas()
    const inicio = Date.now()
    let ok = false
    try {
        const res = await fetch(WP_API_URL, {
            cache: 'no-store',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(TIMEOUT_SONDAGEM_MS),
        })
        ok = res.ok
    } catch {
        ok = false
    }
    const seg = (Date.now() - inicio) / 1000
    m.cmsDuracao.observe({ resultado: ok ? 'sucesso' : 'falha' }, seg)
    m.cmsUp.set(ok ? 1 : 0)
    m.coletorSucesso.set({ coletor: 'cms' }, 1)
    m.coletorDuracao.observe({ coletor: 'cms' }, seg)
}

/** Identidade do build. Constante durante a vida do processo. */
export function coletarBuildInfo(): void {
    const m = metricas()
    m.buildInfo.reset()
    m.buildInfo.set(
        {
            version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'desconhecida',
            node_version: process.version,
            commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? 'desconhecido').slice(0, 12),
        },
        1,
    )
}

/** Executa todos os coletores. Falha de um não impede os outros. */
export async function coletarTudo(): Promise<void> {
    coletarBuildInfo()
    await Promise.allSettled([coletarCms(), coletarConteudo()])
}
