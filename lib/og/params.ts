import { SITE_DOMAIN, WORDPRESS_HOST } from '@/lib/constants/identidade.mjs'
import { SITE_NAME } from '@/lib/constants/site'

const WORDPRESS_DOMAIN = WORDPRESS_HOST.replace(/^www\./, '')
const DEFAULT_TITLE = SITE_NAME
const TITLE_MAX_LENGTH = 100
const SUBTITLE_MAX_LENGTH = 180

const EXACT_IMAGE_HOSTS = new Set([
    'image.tmdb.org',
    'img.youtube.com',
    'i.ytimg.com',
    'lh3.googleusercontent.com',
    'secure.gravatar.com',
    'www.gravatar.com',
])

const OWN_MEDIA_HOSTS = new Set([
    SITE_DOMAIN,
    `www.${SITE_DOMAIN}`,
    WORDPRESS_DOMAIN,
    `www.${WORDPRESS_DOMAIN}`,
])

function compactText(value: string | null, maxLength: number, fallback = ''): string {
    const compact = (value ?? '').replace(/\s+/g, ' ').trim()
    return (compact || fallback).slice(0, maxLength)
}

export function safeOgImageUrl(value: string | null): string {
    if (!value || value.length > 2048) return ''
    try {
        const url = new URL(value)
        if (url.protocol !== 'https:' || url.username || url.password || url.port) return ''
        const hostname = url.hostname.toLowerCase()
        if (OWN_MEDIA_HOSTS.has(hostname)) {
            return url.pathname.startsWith('/wp-content/uploads/') ? url.toString() : ''
        }
        if (EXACT_IMAGE_HOSTS.has(hostname) || hostname === 'wp.com' || hostname.endsWith('.wp.com')) {
            return url.toString()
        }
        return ''
    } catch {
        return ''
    }
}

export function normalizeOgParams(searchParams: URLSearchParams) {
    const requestedType = searchParams.get('type')
    const type = ['artist', 'production', 'group', 'post', 'agency'].includes(requestedType ?? '')
        ? requestedType!
        : ''

    return {
        title: compactText(searchParams.get('title'), TITLE_MAX_LENGTH, DEFAULT_TITLE),
        subtitle: compactText(searchParams.get('subtitle'), SUBTITLE_MAX_LENGTH),
        imageUrl: safeOgImageUrl(searchParams.get('image')),
        type,
    }
}
