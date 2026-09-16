import type { CSSProperties } from 'react'
import { toRgba as hexToRgba } from '@/lib/theme/color'

export type CSSVariableProperties = CSSProperties & { [key: `--${string}`]: string | number }

export function normalizeAccent(value: string | null | undefined, fallback = '#dc2626') {
    if (!value) return fallback
    const hex = value.trim()
    if (/^#[0-9a-f]{6}$/i.test(hex)) return hex
    if (/^#[0-9a-f]{3}$/i.test(hex)) {
        return `#${hex.slice(1).split('').map(char => char + char).join('')}`
    }
    return fallback
}

export function optionalAccent(value: string | null | undefined) {
    if (!value) return null
    const hex = value.trim()
    return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex) ? normalizeAccent(hex) : null
}

/** Mesma conversão de lib/theme, com a normalização de acento das agências antes. */
export function toRgba(color: string, alpha: number) {
    return hexToRgba(normalizeAccent(color), alpha)
}

function channelLuminance(channel: number) {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
}

/** Ajusta o acento para permanecer legível tanto sobre fundos claros quanto escuros. */
export function accessibleAccent(value: string) {
    const hex = normalizeAccent(value)
    let channels = [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ]
    const luminance = () => 0.2126 * channelLuminance(channels[0])
        + 0.7152 * channelLuminance(channels[1])
        + 0.0722 * channelLuminance(channels[2])

    for (let step = 0; step < 40 && luminance() < 0.175; step += 1) {
        channels = channels.map(channel => Math.round(channel + (255 - channel) * 0.05))
    }
    for (let step = 0; step < 40 && luminance() > 0.183; step += 1) {
        channels = channels.map(channel => Math.round(channel * 0.95))
    }

    return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

export function countryLabel(country: string | null | undefined) {
    if (!country || country === 'KR' || country === 'Korea, Republic of') return 'Coreia do Sul'
    return country
}

export function agencyMark(name: string) {
    const core = name
        .replace(/\b(entertainment|company|corporation|music|media|labels?|group|project)\b/gi, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
    const words = core.split(/\s+/).filter(Boolean)
    if (words.length > 1) return words.slice(0, 3).map(word => word[0]).join('').toUpperCase()
    return (words[0] || name).slice(0, 3).toUpperCase()
}

/**
 * Rótulos de exibição — vocabulário do domínio, não layout.
 *
 * Estavam dentro do arquivo de página de 1.331 linhas, o que obrigava a reler
 * JSX para corrigir uma palavra. Vivem aqui ao lado de `countryLabel`, que já
 * era o mesmo tipo de coisa.
 */
export const AGENCY_TYPE_LABELS: Record<string, string> = {
    major: 'Grande agência',
    mid: 'Mid-tier',
    indie: 'Independente',
    subsidiary: 'Subsidiária',
}

export const ORGANIZATION_KIND_LABELS: Record<string, string> = {
    conglomerate: 'Conglomerado',
    label: 'Label',
    agency: 'Agência',
    joint_venture: 'Joint venture',
    division: 'Divisão',
}

