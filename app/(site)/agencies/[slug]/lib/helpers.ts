import { SITE_NAME } from '@/lib/constants/site'

export const BIG4_SLUGS = new Set(['sm-entertainment', 'hybe', 'yg-entertainment', 'jyp-entertainment'])
export const LEGACY_AGENCY_TITLE = new RegExp(`\\s+[—–-]\\s+Agência K-Pop(?:\\s+\\|\\s+${SITE_NAME})?$`, 'i')

export function sameImageAsset(first?: string | null, second?: string | null) {
    if (!first || !second) return false
    try {
        return new URL(first).pathname === new URL(second).pathname
    } catch {
        return first === second
    }
}

export const GENERATIONS = [
    { label: '1ª Geração', shortLabel: '1ª Gen', from: 1990, to: 2002 },
    { label: '2ª Geração', shortLabel: '2ª Gen', from: 2003, to: 2011 },
    { label: '3ª Geração', shortLabel: '3ª Gen', from: 2012, to: 2017 },
    { label: '4ª Geração', shortLabel: '4ª Gen', from: 2018, to: 2022 },
    { label: '5ª Geração', shortLabel: '5ª Gen', from: 2023, to: 9999 },
]
