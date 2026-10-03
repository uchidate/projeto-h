import type { ReactNode } from 'react'

/**
 * Peso editorial da seção. A página de perfil tem ~24 seções; com respiro
 * idêntico em todas, nenhuma se destaca e o leitor não distingue a espinha
 * (a trajetória, que é a matéria) dos blocos de consulta (players, links).
 *
 * - `spine`     — a seção que justifica a página. Respiro amplo.
 * - `pillar`    — seções de conteúdo próprio. É o padrão.
 * - `reference` — material de consulta: embeds, listas, canais. Comprime.
 */
export type ProfileSectionWeight = 'spine' | 'pillar' | 'reference'

export type ProfileBlockLayout =
    /** O registro aplica o wrapper visual padrão de perfis. */
    | 'profile'
    /** O componente controla seu próprio elemento semântico e seu layout. */
    | 'self'

export type ProfileBlockDef = {
    /** âncora (#id) — também vira o item da nav */
    id: string
    /** rótulo humano da nav de seções */
    nav: string
    /** os dados deste bloco existem? bloco ausente não aparece na nav nem na numeração */
    present: boolean
    /** Define quem aplica o wrapper da seção. O padrão é `profile`. */
    layout?: ProfileBlockLayout
    /** Peso editorial — controla o respiro vertical. O padrão é `pillar`. */
    weight?: ProfileSectionWeight
    /** false = componente não exibe o eyebrow numerado — não consome número (sequência visível fica contígua) */
    numbered?: boolean
    /** Exibe o índice Specimen na coluna-margem mesmo quando o bloco controla o próprio layout. */
    indexed?: boolean
    /** recebe o eyebrow numerado ("03 · FILMOGRAFIA") derivado da ordem visível */
    render: (numberedLabel: string) => ReactNode
}

/** Item não-navegável entre seções (anúncio, quiz) — posição garantida pela ordem do registro. */
export type ProfileInterstitial = {
    /** Chave estável e única dentro do registro. */
    key: string
    interstitial: ReactNode
}
export type ProfileEntry = ProfileBlockDef | ProfileInterstitial

export function isInterstitial(entry: ProfileEntry): entry is ProfileInterstitial {
    return 'interstitial' in entry
}

/** Interstitials de anúncio seguem a convenção de chave dos registros de perfil. */
export const CHAVE_DE_ANUNCIO = /(^|-)ad$|leaderboard|meio-ficha|densidade-/
