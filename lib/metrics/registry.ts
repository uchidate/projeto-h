import { METRICS_PREFIX } from '@/lib/constants/identidade.mjs'
/**
 * Registro Prometheus da aplicação.
 *
 * Escopo deliberado: este endpoint expõe **apenas o que não tem outro dono**.
 * Disponibilidade externa é do blackbox, erros são do Sentry, recursos de host
 * são do node-exporter e cAdvisor, e o interno do Postgres é do
 * postgres-exporter. Duplicar qualquer um deles cria duas fontes de verdade
 * que divergem — e, quando divergem, ninguém sabe em qual acreditar.
 *
 * A lacuna que sobra, e que só a aplicação enxerga:
 *   1. o processo Node por dentro (event loop, heap, GC)
 *   2. a saúde do WordPress do ponto de vista de quem depende dele
 *   3. o inventário editorial (quantos artistas, produções, notícias)
 *   4. a confiabilidade da própria coleta
 */
import {
    Registry,
    Gauge,
    Histogram,
    collectDefaultMetrics,
    type Metric,
} from 'prom-client'

const PREFIXO = `${METRICS_PREFIX}_`

/**
 * Em desenvolvimento o Next recarrega módulos a cada edição. Sem este
 * singleton no globalThis, cada recarga tentaria registrar as mesmas métricas
 * de novo e o prom-client lançaria "A metric with the name ... has already been
 * registered", derrubando a rota.
 */
const global_ = globalThis as typeof globalThis & {
    __siteMetrics?: MetricasApp
}

export type MetricasApp = {
    registro: Registry
    buildInfo: Gauge<'version' | 'node_version' | 'commit'>
    cmsUp: Gauge<string>
    cmsDuracao: Histogram<'resultado'>
    conteudoItens: Gauge<'tipo'>
    conteudoIdadeSnapshot: Gauge<string>
    coletorSucesso: Gauge<'coletor'>
    coletorDuracao: Histogram<'coletor'>
}

function criar(): MetricasApp {
    const registro = new Registry()

    // Event loop lag, GC, heap e handles abertos. É o sinal mais honesto de
    // saturação num processo Node: latência alta com CPU baixa quase sempre
    // aparece aqui antes de aparecer no tempo de resposta.
    collectDefaultMetrics({ register: registro })

    const buildInfo = new Gauge({
        name: `${PREFIXO}build_info`,
        help: 'Identidade do build em execução. Valor sempre 1; a informação está nos labels.',
        labelNames: ['version', 'node_version', 'commit'] as const,
        registers: [registro],
    })

    const cmsUp = new Gauge({
        name: `${PREFIXO}cms_up`,
        help: '1 se o WordPress respondeu à última sondagem, 0 caso contrário.',
        registers: [registro],
    })

    // Histograma, não gauge: um gauge only mostra o último valor e esconde a
    // cauda. Os buckets cobrem de 50ms a 10s porque o timeout do cliente
    // WordPress é 10s — acima disso a requisição já falhou.
    const cmsDuracao = new Histogram({
        name: `${PREFIXO}cms_request_duration_seconds`,
        help: 'Duração das requisições ao WordPress feitas pelo coletor.',
        labelNames: ['resultado'] as const,
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        registers: [registro],
    })

    const conteudoItens = new Gauge({
        name: `${PREFIXO}content_items`,
        help: 'Itens publicados por tipo de conteúdo, segundo o WordPress.',
        labelNames: ['tipo'] as const,
        registers: [registro],
    })

    const conteudoIdadeSnapshot = new Gauge({
        name: `${PREFIXO}content_snapshot_age_seconds`,
        help: 'Idade da contagem de conteúdo servida. Sem isto, um número velho é indistinguível de um atual.',
        registers: [registro],
    })

    const coletorSucesso = new Gauge({
        name: `${PREFIXO}collector_success`,
        help: '1 se o coletor concluiu sem erro na última execução, 0 caso contrário.',
        labelNames: ['coletor'] as const,
        registers: [registro],
    })

    const coletorDuracao = new Histogram({
        name: `${PREFIXO}collector_duration_seconds`,
        help: 'Tempo de execução de cada coletor.',
        labelNames: ['coletor'] as const,
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10],
        registers: [registro],
    })

    return {
        registro,
        buildInfo,
        cmsUp,
        cmsDuracao,
        conteudoItens,
        conteudoIdadeSnapshot,
        coletorSucesso,
        coletorDuracao,
    }
}

export function metricas(): MetricasApp {
    global_.__siteMetrics ??= criar()
    return global_.__siteMetrics
}

/** Só para testes: descarta o singleton e zera o registro. */
export function reiniciarMetricas(): void {
    global_.__siteMetrics?.registro.clear()
    global_.__siteMetrics = undefined
}

export type { Metric }
