import { WORDPRESS_API_FALLBACK } from '@/lib/constants/site'

/**
 * Valida a URL da API do WordPress antes de usá-la.
 *
 * O valor vem de variável de ambiente, ou seja, de arquivo — e o CodeQL aponta
 * isso em `js/file-access-to-http`: toda requisição de saída do site depende
 * dele. Um valor errado (typo, `.env` trocado, variável vazando de outro
 * ambiente) mandaria as chamadas, e os cabeçalhos que vão nelas, para outro
 * host. Validar aqui é barato e falha no lugar certo, em vez de silenciosamente
 * apontar para fora.
 */
function urlDaApiValida(valor: string | undefined): string {
    if (!valor) return WORDPRESS_API_FALLBACK
    let parsed: URL
    try {
        parsed = new URL(valor)
    } catch {
        console.error('[wp] WORDPRESS_API_URL não é uma URL válida; usando o padrão')
        return WORDPRESS_API_FALLBACK
    }
    const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname.endsWith('.local')
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local)) {
        console.error('[wp] WORDPRESS_API_URL precisa ser https (http só em host local); usando o padrão')
        return WORDPRESS_API_FALLBACK
    }
    return valor
}

export const WP_API_URL = urlDaApiValida(process.env.WORDPRESS_API_URL)

export const IS_BUILD =
    process.env.NEXT_PHASE === 'phase-production-build' && !process.env.WORDPRESS_API_URL

function positiveTimeout(value: string | undefined, fallback: number): number {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 1000 && parsed <= 120_000 ? parsed : fallback
}

// Falhe rápido na navegação pública; sitemap/build têm políticas próprias.
const WP_FETCH_TIMEOUT_PUBLICO_MS = positiveTimeout(process.env.WP_FETCH_TIMEOUT_MS, 10_000)

// Fase de build de produção. Diferente de IS_BUILD acima, que só é verdadeiro
// no caso degenerado de build SEM URL do WordPress — ali o objetivo é devolver
// vazio; aqui é saber que estamos construindo, com URL e tudo.
export const EM_BUILD_DE_PRODUCAO = process.env.NEXT_PHASE === 'phase-production-build'

/**
 * Prazo do fetch: generoso no build, curto na navegação pública.
 *
 * A linha acima sempre disse "sitemap/build têm políticas próprias" — mas a
 * política do build nunca existiu. Ele usava os mesmos 10s da navegação, e isso
 * o tornava frágil exatamente onde falhar é mais caro.
 *
 * ── Por que 10s é pouco NO BUILD ────────────────────────────────────────────
 *
 * O build roda 9 workers em paralelo contra o mesmo WordPress, pedindo respostas
 * grandes (`_embed=true` traz o post e tudo que ele referencia). A carga é do
 * próprio build. Sob ela, 10s estoura — e um único estouro em ~2.300 fetches
 * lança `WordPressIndisponivelError`, que aborta o build INTEIRO:
 *
 *   Export encountered an error on /(site)/productions/[slug]/page:
 *   /productions/o-retorno-do-juiz, exiting the build.
 *
 * Aconteceu duas vezes em ~10 builds em 2026-09-12. Medido: com
 * WP_FETCH_TIMEOUT_MS=45000 o mesmo build passou; com o padrão, falhou.
 *
 * ── Por que não basta a retentativa do client ───────────────────────────────
 *
 * A retentativa em ./client cobre o PEDIDO e os cabeçalhos. Mas o
 * `AbortSignal.timeout` vale para a resposta inteira, corpo incluído — e o
 * estouro observado foi na LEITURA DO CORPO, dentro do `response.json()` do
 * chamador, fora do alcance do laço:
 *
 *   WordPress API returned invalid JSON — …o-retorno-do-juiz…
 *   Error [TimeoutError]: The operation was aborted due to timeout
 *
 * Mover a leitura do corpo para dentro do laço exigiria trocar o contrato de
 * `fetchWordPress` e reescrever mocks em 11 arquivos de teste. O prazo maior
 * resolve o mesmo caso sem esse risco. As duas defesas se somam: a retentativa
 * para a falha que é momentânea, o prazo para a resposta que é só lenta.
 *
 * ── Por que ligado por padrão, ao contrário de WP_BUILD_FETCH_TTL_S ─────────
 *
 * Aquele troca frescor por velocidade, o que é decisão editorial. Este não
 * troca nada: no build não há visitante esperando, e o único custo é demorar
 * mais para declarar falha quando o WordPress está de fato fora. Desistir
 * rápido ali não protege ninguém — só perde o deploy.
 */
const WP_FETCH_TIMEOUT_BUILD_MS = positiveTimeout(process.env.WP_BUILD_FETCH_TIMEOUT_MS, 45_000)

export const WP_FETCH_TIMEOUT_MS = EM_BUILD_DE_PRODUCAO
    ? Math.max(WP_FETCH_TIMEOUT_PUBLICO_MS, WP_FETCH_TIMEOUT_BUILD_MS)
    : WP_FETCH_TIMEOUT_PUBLICO_MS

const TTL_PADRAO_S = 21_600

/**
 * Piso de reuso do fetch-cache DURANTE o build. `0` desliga.
 *
 * ── O que isto resolve ──────────────────────────────────────────────────────
 *
 * Medido em 2026-09-12, dois builds seguidos do MESMO código:
 *
 *   fetch-cache frio    geração de 886 páginas estáticas em 71s
 *   fetch-cache quente  as mesmas 886 páginas em 3,8s
 *
 * 19x. Quer dizer que o custo da geração estática é quase todo REDE até o
 * WordPress, não renderização. E o Dockerfile já monta `.next/cache` como
 * cache do BuildKit, então o mecanismo de reuso entre builds existe.
 *
 * O que o anula é o `revalidate` de 600s do client: dois deploys nunca estão a
 * menos de 10 minutos um do outro, então toda entrada está vencida quando o
 * build seguinte começa, e ele rebusca os ~2.300 fetches inteiros.
 *
 * ── O que isto custa, e por que fica desligado por padrão ───────────────────
 *
 * Frescor do HTML pré-renderizado. Com o piso em N segundos, uma página pode
 * nascer com conteúdo de até N atrás. Duas coisas limitam o estrago, e as duas
 * já existem no projeto:
 *
 *   1. o ISR de runtime (600s) corrige a página 10 minutos após o primeiro
 *      acesso a ela;
 *   2. o webhook do WordPress (/api/revalidate) purga por tag na publicação.
 *
 * ── O que fica FORA do piso, e é o que torna 6h aceitável ───────────────────
 *
 * Notícia não envelhece aqui. Fetch marcado com a tag de coleção `posts` ou com
 * tag de item `post-<slug>` ignora o piso e mantém seu revalidate original —
 * ver `ehNoticia` em ./client.
 *
 * A assimetria é deliberada. O risco de conteúdo atrasado está concentrado em
 * /blog; o ganho está nos catálogos grandes, que são quase todo o build (4.127
 * productions e 3.412 artists publicados, contra 675 posts). Excluir notícia
 * custa pouco do benefício e remove a maior parte do custo editorial.
 *
 * Há um cenário que o ISR e o webhook não cobrem sozinhos e vale conhecer: se
 * algo foi publicado depois da entrada de cache que o build reaproveitou, o
 * deploy pode servir HTML mais ANTIGO do que o site mostrava antes dele. Cura
 * sozinho na primeira revalidação daquela página (5-30min, conforme a rota),
 * mas é regressão momentânea — e é por isso que notícia está fora.
 *
 * ── Padrão ──────────────────────────────────────────────────────────────────
 *
 * 21600 (6h), decidido em 2026-09-12: cobre o intervalo típico entre deploys
 * sem deixar conteúdo de ontem entrar. `WP_BUILD_FETCH_TTL_S=0` desliga.
 *
 * O piso nunca REDUZ um revalidate já maior, e nunca sobrepõe `false` — quem
 * pediu cache eterno continua com cache eterno.
 */
export const WP_BUILD_FETCH_TTL_S = (() => {
    const bruto = process.env.WP_BUILD_FETCH_TTL_S
    // Ausente ou vazio = usa o padrão. O ARG do Dockerfile chega como string
    // vazia quando ninguém o define, e `Number('')` é 0 — sem esta distinção, o
    // caminho normal do container CAIRIA no desligado e a otimização não
    // aconteceria. Foi exatamente assim que a economia de gates do #35 passou
    // dias inerte.
    if (bruto === undefined || bruto.trim() === '') return TTL_PADRAO_S
    const n = Number(bruto)
    // `0` explícito é o interruptor de desligar. Valor inválido cai no padrão em
    // vez de desligar calado.
    if (!Number.isFinite(n)) return TTL_PADRAO_S
    if (n <= 0) return 0
    // Teto de 7 dias: acima disso o pré-renderizado deixa de ser "levemente
    // atrasado" e passa a ser outra coisa.
    return Math.min(Math.floor(n), 604_800)
})()
