import { intlLocale } from '@/lib/i18n/format'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Normaliza datas do ACF (YYYYMMDD) e ISO para objeto Date */
export function parseAcfDate(date: string | Date): Date {
    if (date instanceof Date) return date
    const normalized = /^\d{8}$/.test(date)
        ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
        : date

    // Datas editoriais sem horário devem permanecer no dia local, sem deslocamento UTC.
    const dateOnly = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateOnly) {
        const [, year, month, day] = dateOnly
        return new Date(Number(year), Number(month) - 1, Number(day))
    }
    return new Date(normalized)
}

/** Normaliza data ACF (YYYYMMDD) para YYYY-MM-DD — formato exigido pelo schema.org (Date). */
export function toIsoDateString(date?: string): string | undefined {
    if (!date) return undefined
    if (/^\d{8}$/.test(date)) return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
    return undefined
}

export function formatDate(date: string | Date, locale = intlLocale()): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(parseAcfDate(date))
}

export function formatDateTime(date: string | Date, locale = intlLocale()): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parseAcfDate(date))
}

export function formatDateShort(date: string | Date, locale = intlLocale()): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parseAcfDate(date))
}

/**
 * Remove tags de HTML, repetindo até o resultado estabilizar.
 *
 * Com `<[^>]*>` a repetição é, na prática, uma passada só: a regex consome até
 * o primeiro `>`, então tag aninhada não se reconstrói — medido, a segunda
 * passada nunca muda nada. O laço está aqui por dois motivos honestos: é o que
 * o CodeQL pede em `js/incomplete-multi-character-sanitization`, e protege o
 * dia em que alguém trocar a regex por uma que deixe resto.
 *
 * Isto NÃO é sanitizador de HTML. Serve para extrair texto (resumo, título,
 * sitemap). Conteúdo que volta ao DOM como HTML precisa de sanitizador de
 * verdade.
 */
export function removeTags(html: string): string {
    let anterior = html
    for (;;) {
        const atual = anterior.replace(/<[^>]*>/g, '')
        if (atual === anterior) return atual
        anterior = atual
    }
}

export function stripHtml(html: string): string {
    return decodeHtmlEntities(removeTags(html))
}

function decodeHtmlEntities(value: string): string {
    const named: Record<string, string> = {
        amp: '&',
        apos: "'",
        gt: '>',
        hellip: '…',
        laquo: '«',
        ldquo: '“',
        lsquo: '‘',
        lt: '<',
        nbsp: ' ',
        quot: '"',
        raquo: '»',
        rdquo: '”',
        rsquo: '’',
    }

    return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
        if (code[0] !== '#') return named[code.toLowerCase()] ?? entity
        const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10
        const number = parseInt(code.slice(radix === 16 ? 2 : 1), radix)
        return Number.isFinite(number) ? String.fromCodePoint(number) : entity
    })
}

/** Extrai imagem destacada — usa featured_image_url direto (preferencial) ou _embedded como fallback */
export function getWPImage(
    embedded: { 'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }> } | undefined,
    featuredImageUrl?: string | null,
    altText?: string,
): { src: string; alt: string } | null {
    if (featuredImageUrl) return { src: featuredImageUrl, alt: altText ?? '' }
    const media = embedded?.['wp:featuredmedia']?.[0]
    if (!media?.source_url) return null
    return { src: media.source_url, alt: media.alt_text ?? '' }
}

/** Extrai termos (categorias/tags) do _embedded */
export function getWPTerms(
    embedded: { 'wp:term'?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>> } | undefined,
    taxonomy: string,
) {
    return embedded?.['wp:term']?.flat().filter(t => t.taxonomy === taxonomy) ?? []
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

export function truncate(text: string, max: number): string {
    if (text.length <= max) return text
    return `${text.slice(0, max).trimEnd()}…`
}

export function formatDatePt(date: string | Date, locale = intlLocale()): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(parseAcfDate(date))
}

export function getYear(date?: string | Date): number | null {
    if (!date) return null
    const parsed = parseAcfDate(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear()
}

export function getAge(date?: string | Date, today = new Date()): number | null {
    if (!date) return null
    const birthDate = parseAcfDate(date)
    if (Number.isNaN(birthDate.getTime()) || birthDate > today) return null

    let age = today.getFullYear() - birthDate.getFullYear()
    const birthdayPending =
        today.getMonth() < birthDate.getMonth()
        || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
    if (birthdayPending) age--
    return age
}

export type SocialNetwork = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'spotify'

const SOCIAL_NETWORK_CONFIG: Record<SocialNetwork, { hostnamePattern: RegExp; buildFromHandle: (handle: string) => string }> = {
    instagram: { hostnamePattern: /(^|\.)instagram\.com$/i, buildFromHandle: handle => `https://www.instagram.com/${handle}/` },
    x: { hostnamePattern: /(^|\.)((x|twitter)\.com)$/i, buildFromHandle: handle => `https://x.com/${handle}` },
    youtube: { hostnamePattern: /(^|\.)((youtube\.com)|(youtu\.be))$/i, buildFromHandle: handle => `https://www.youtube.com/@${handle}` },
    tiktok: { hostnamePattern: /(^|\.)tiktok\.com$/i, buildFromHandle: handle => `https://www.tiktok.com/@${handle}` },
    // Spotify não usa @handle — o valor cru (quando não é URL) é tratado como artist ID.
    spotify: { hostnamePattern: /(^|\.)open\.spotify\.com$/i, buildFromHandle: id => `https://open.spotify.com/artist/${id}` },
}

/**
 * Normaliza um campo social do ACF pra uma URL válida e completa — aceita tanto
 * uma URL já completa (valida o hostname esperado, devolve como veio) quanto um
 * handle/ID cru (constrói a URL). Nunca reprefixará uma URL que já é completa
 * (bug corrigido em 2026-07-05: buildSameAsUrls, removido, gerava
 * "https://x.com/https://x.com/BTS_twt" ao prefixar incondicionalmente).
 */
export function getSocialUrl(value: string | undefined, network: SocialNetwork): string | null {
    const raw = value?.trim()
    if (!raw) return null
    const { hostnamePattern, buildFromHandle } = SOCIAL_NETWORK_CONFIG[network]

    if (/^https?:\/\//i.test(raw)) {
        try {
            const url = new URL(raw)
            return hostnamePattern.test(url.hostname) ? url.toString() : null
        } catch {
            return null
        }
    }

    const handle = raw.replace(/^@/, '').replace(/^\/+|\/+$/g, '')
    if (!/^[A-Za-z0-9._-]+$/.test(handle)) return null
    return buildFromHandle(handle)
}

export function readingTime(html: string): number {
    const words = stripHtml(html).split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.round(words / 200))
}

export function extractYoutubeId(url: string): string | null {
    if (!url) return null
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/)
    return m?.[1] ?? null
}

export function toSpotifyEmbedUrl(url: string): string | null {
    try {
        const u = new URL(url)
        if (u.hostname !== 'open.spotify.com') return null
        const path = u.pathname.startsWith('/embed') ? u.pathname : `/embed${u.pathname}`
        return `https://open.spotify.com${path}?utm_source=generator&theme=0`
    } catch { return null }
}
