/**
 * Consentimento de cookies — Consent Mode v2 do Google.
 *
 * O modelo é "negado por padrão": os scripts do Google (GA4 e AdSense) carregam
 * normalmente, mas sem gravar cookie nem usar dados pessoais enquanto o usuário
 * não decidir. Anúncios continuam servindo, só que não personalizados. Isso
 * atende LGPD e GDPR sem apagar a monetização nem a contagem de pageviews.
 *
 * No EEE/Reino Unido quem escreve os sinais é o CMP certificado do Google
 * (Funding Choices), que sobrepõe estes defaults via TCF. Aqui tratamos o
 * restante do mundo — na prática, o tráfego brasileiro.
 */

export const CONSENT_STORAGE_KEY = 'hh-consent-v1'
export const CONSENT_EVENT = 'hh:consent-change'

export type ConsentDecision = 'granted' | 'denied'

export type ConsentState = {
    decision: ConsentDecision
    /** ISO 8601 — a LGPD exige poder demonstrar quando o consentimento foi dado. */
    at: string
}

type StoredConsent = Partial<ConsentState>

/** Sinais do Consent Mode v2 controlados pela decisão do usuário. */
const SINAIS = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'] as const

function gtag(...args: unknown[]) {
    if (typeof window === 'undefined') return
    // O gtag pode ainda não existir (script lazy); a fila do dataLayer é
    // consumida quando ele carrega, então nenhum sinal se perde.
    if (typeof window.gtag === 'function') window.gtag(...args)
    else (window.dataLayer = window.dataLayer || []).push(args)
}

/**
 * Snapshot memoizado. useSyncExternalStore compara por identidade: devolver um
 * objeto novo a cada leitura faria o React renderizar em laço infinito.
 */
let cache: { bruto: string | null; valor: ConsentState | null } = { bruto: null, valor: null }
const inscritos = new Set<() => void>()

function notificar() {
    inscritos.forEach(fn => fn())
}

export function readConsent(): ConsentState | null {
    if (typeof window === 'undefined') return null
    try {
        const bruto = localStorage.getItem(CONSENT_STORAGE_KEY)
        if (bruto === cache.bruto) return cache.valor
        const valor = parseConsent(bruto)
        cache = { bruto, valor }
        return valor
    } catch {
        // localStorage bloqueado (modo privado, cookies desativados): sem
        // registro de consentimento, o padrão negado continua valendo.
        return null
    }
}

function parseConsent(bruto: string | null): ConsentState | null {
    if (!bruto) return null
    try {
        const salvo = JSON.parse(bruto) as StoredConsent
        if (salvo.decision !== 'granted' && salvo.decision !== 'denied') return null
        return { decision: salvo.decision, at: typeof salvo.at === 'string' ? salvo.at : '' }
    } catch {
        return null
    }
}

/** Fonte para useSyncExternalStore — ver readConsent sobre a memoização. */
export function subscribeConsent(onChange: () => void) {
    inscritos.add(onChange)
    // Outra aba pode mudar a decisão; o storage event não dispara na aba autora.
    window.addEventListener('storage', onChange)
    window.addEventListener(CONSENT_EVENT, onChange)
    return () => {
        inscritos.delete(onChange)
        window.removeEventListener('storage', onChange)
        window.removeEventListener(CONSENT_EVENT, onChange)
    }
}

/** No servidor ninguém consentiu ainda; o cliente reconcilia após a hidratação. */
export function getServerConsent(): ConsentState | null {
    return null
}

/** Repassa ao Google a decisão já armazenada, sem regravá-la. */
export function applyConsent(decision: ConsentDecision) {
    const sinais = Object.fromEntries(SINAIS.map(sinal => [sinal, decision]))
    gtag('consent', 'update', sinais)
}

/** Grava a decisão do usuário, avisa o Google e notifica a UI. */
export function saveConsent(decision: ConsentDecision): ConsentState {
    const estado: ConsentState = { decision, at: new Date().toISOString() }
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(estado))
    } catch {
        // Sem persistência o banner reaparece na próxima visita — preferível a
        // assumir um consentimento que não conseguimos registrar.
    }
    applyConsent(decision)
    notificar()
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: estado }))
    }
    return estado
}

/** Revogação: apaga o registro, volta ao estado negado e reabre o banner. */
export function resetConsent() {
    try {
        localStorage.removeItem(CONSENT_STORAGE_KEY)
    } catch {
        // idem readConsent
    }
    applyConsent('denied')
    notificar()
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }))
    }
}

/* -------------------------------------------------------------------------
 * Quem pergunta: o CMP do Google ou o banner local
 *
 * O Funding Choices define window.__tcfapi em TODO visitante, inclusive fora do
 * EEE — lá ele responde gdprApplies=false e não exibe mensagem nenhuma. Ou
 * seja, a mera presença do __tcfapi não significa que o Google vai perguntar;
 * tratá-la assim deixaria o tráfego brasileiro sem pedido de consentimento
 * algum. O que decide é gdprApplies, lido pelo addEventListener do TCF v2.
 * ---------------------------------------------------------------------- */

type Tcfapi = (
    comando: string,
    versao: number,
    callback: (dados: { gdprApplies?: boolean } | null, sucesso: boolean) => void,
) => void

function tcfapi(): Tcfapi | null {
    if (typeof window === 'undefined') return null
    const api = (window as unknown as { __tcfapi?: unknown }).__tcfapi
    return typeof api === 'function' ? (api as Tcfapi) : null
}

/** Só é verdade quando o CMP do Google confirma que o GDPR se aplica a este visitante. */
export function hasCertifiedCmp(): boolean {
    return cmpAssume === true
}

/* -------------------------------------------------------------------------
 * Store do banner
 *
 * O banner depende de fontes externas ao React: a decisão no localStorage e a
 * resposta do CMP do Google. Ambas viram um único snapshot primitivo, para que
 * o componente seja só uma leitura — sem setState em efeito e sem estado
 * duplicado que possa divergir.
 * ---------------------------------------------------------------------- */

export type BannerState = 'perguntar' | 'oculto'

/**
 * Janela para o CMP se manifestar. O adsbygoogle.js entra com atraso e o
 * Funding Choices vem depois dele; até a resposta chegar, o banner fica calado
 * para não piscar na cara de quem o Google vai perguntar de qualquer jeito.
 * Esgotada a janela — sem AdSense, com bloqueador, ou fora do EEE — quem
 * pergunta é o banner local.
 */
const JANELA_CMP_MS = 4000
const INTERVALO_CMP_MS = 200

/** null enquanto indefinido; true = o Google assume; false = a decisão é nossa. */
let cmpAssume: boolean | null = null

export function getBannerState(): BannerState {
    if (typeof window === 'undefined') return 'oculto'
    if (cmpAssume !== false) return 'oculto'
    return readConsent() ? 'oculto' : 'perguntar'
}

/** Durante o SSR nada foi decidido e o CMP não respondeu; nada a mostrar ainda. */
export function getServerBannerState(): BannerState {
    return 'oculto'
}

export function subscribeBanner(onChange: () => void) {
    const cancelarConsent = subscribeConsent(onChange)

    const resolver = (assume: boolean) => {
        if (cmpAssume !== null) return
        cmpAssume = assume
        notificar()
    }

    const perguntarAoTcf = (api: Tcfapi) => {
        // addEventListener em vez de getTCData: o CMP pode ainda não ter os
        // dados prontos na primeira chamada, e o evento chega quando tiver.
        try {
            api('addEventListener', 2, (dados, sucesso) => {
                if (sucesso && dados) resolver(dados.gdprApplies === true)
            })
        } catch {
            resolver(false)
        }
    }

    const inicio = Date.now()
    const api = tcfapi()
    if (api) perguntarAoTcf(api)

    const sonda = window.setInterval(() => {
        if (cmpAssume !== null) {
            clearInterval(sonda)
            return
        }
        const encontrada = tcfapi()
        if (encontrada) {
            perguntarAoTcf(encontrada)
            return
        }
        if (Date.now() - inicio > JANELA_CMP_MS) {
            clearInterval(sonda)
            resolver(false)
        }
    }, INTERVALO_CMP_MS)

    return () => {
        clearInterval(sonda)
        cancelarConsent()
    }
}

/** Só para testes: devolve o store ao estado anterior a qualquer resposta do CMP. */
export function __resetCmpParaTeste() {
    cmpAssume = null
}
