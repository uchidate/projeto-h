import type { ReactNode } from 'react'
import { BlockSection } from '@/components/blocks/BlockSection'

/**
 * Wrapper padrão de seção de perfil (artista/grupo/produção) — antes cada
 * página repetia este markup ~8 vezes e qualquer ajuste de ritmo era um
 * find-replace. Mobile-first: py-8 no mobile (a página é longa e o respiro
 * de desktop virava rolagem morta em tela pequena), py-14 em sm+.
 */
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

const WEIGHT_SPACING = {
    spine: 'spine',
    pillar: 'default',
    reference: 'compact',
} as const

/**
 * Rail editorial compartilhado entre artistas e grupos. O recuo preserva a
 * coluna de leitura dos perfis de artista, mas rótulo, título e conteúdo vivem
 * no mesmo eixo: a numeração é um kicker empilhado, nunca uma coluna lateral.
 *
 * `indented=false` evita recuo duplicado quando o contêiner pai já fornece o
 * rail (caso do layout de grupo com sidebar).
 */
export function ProfileSection({ id, weight = 'pillar', label, indented = true, bloco, children }: {
    id: string
    /** Nome para a medição de recirculação (`data-bloco`); ausente = bloco não medido. */
    bloco?: string
    weight?: ProfileSectionWeight
    label?: string
    indented?: boolean
    children: ReactNode
}) {
    return (
        <BlockSection id={id} layout="page" spacing={WEIGHT_SPACING[weight]} className="scroll-mt-20">
            <div className={indented ? 'lg:pl-48' : ''}>
                {label && (
                    <p className="mb-4 font-mono text-[10px] font-black uppercase leading-4 tracking-[0.16em] text-muted">
                        {label}
                    </p>
                )}
                <div data-bloco={bloco}>{children}</div>
            </div>
        </BlockSection>
    )
}

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

/**
 * Garante que nunca passem `maxSemAnuncio` seções visíveis seguidas sem anúncio.
 *
 * Medido em 2026-09-17, no celular: a ficha de artista tinha 1 anúncio a cada
 * ~3.300px e a de grupo, 1 a cada ~4.800px — longos trechos de rolagem sem
 * monetização em páginas de 14.000 a 16.000px. Os anúncios posicionados à mão
 * continuam onde estão; esta regra só preenche os vazios entre eles.
 *
 * Conta seções PRESENTES (bloco sem dado não aparece na tela e não conta). O
 * anúncio entra sempre ANTES de uma seção, então nunca fica solto no fim.
 */
export function adensarAnuncios(
    entries: readonly ProfileEntry[],
    criarAnuncio: (indice: number) => ReactNode,
    maxSemAnuncio = 3,
): ProfileEntry[] {
    const saida: ProfileEntry[] = []
    let semAnuncio = 0
    let inseridos = 0
    entries.forEach(entry => {
        if (isInterstitial(entry)) {
            if (CHAVE_DE_ANUNCIO.test(entry.key)) semAnuncio = 0
            saida.push(entry)
            return
        }
        if (entry.present && semAnuncio >= maxSemAnuncio) {
            saida.push({ key: `densidade-${inseridos}`, interstitial: criarAnuncio(inseridos) })
            inseridos++
            semAnuncio = 0
        }
        saida.push(entry)
        if (entry.present) semAnuncio++
    })
    return saida
}

/**
 * Falha cedo para erros de composição que, sem validação, gerariam âncoras
 * ambíguas, nós React instáveis ou itens duplicados na ReadingBar.
 */
export function validateProfileEntries(entries: readonly ProfileEntry[]) {
    const blockIds = new Set<string>()
    const interstitialKeys = new Set<string>()

    for (const entry of entries) {
        if (isInterstitial(entry)) {
            if (!entry.key.trim()) throw new Error('Profile interstitial key cannot be empty')
            if (interstitialKeys.has(entry.key)) {
                throw new Error(`Duplicate profile interstitial key: ${entry.key}`)
            }
            interstitialKeys.add(entry.key)
            continue
        }

        if (!entry.id.trim()) throw new Error('Profile block id cannot be empty')
        if (!entry.nav.trim()) throw new Error(`Profile block nav cannot be empty: ${entry.id}`)
        if (blockIds.has(entry.id)) throw new Error(`Duplicate profile block id: ${entry.id}`)
        blockIds.add(entry.id)
    }
}

/**
 * Deriva tudo de uma lista só (a cura do drift triplo: nav, numeração e
 * ordem de render eram três contabilidades manuais na página):
 * - anchors: só blocos presentes, na ordem em que renderizam
 * - numberedLabel: "NN · NAV" pela posição VISÍVEL (buraco de dado não pula número)
 * - nodes: seções embrulhadas (ou `layout: self`) + interstitials no lugar exato
 */
export function renderProfileEntries(
    entries: readonly ProfileEntry[],
    options: {
        parentProvidesRail?: boolean
        /**
         * Blocos de NAVEGAÇÃO a medir (clique e exibição): `${prefixo}-${id}`. Só os que
         * levam a outra página; medir todos geraria uma dúzia de eventos por ficha.
         */
        medir?: { prefixo: string; ids: readonly string[] }
    } = {},
) {
    validateProfileEntries(entries)

    const visibleBlocks = entries.filter((e): e is ProfileBlockDef => !isInterstitial(e) && e.present)
    const anchors = visibleBlocks.map(b => ({ href: `#${b.id}`, label: b.nav }))
    const numberedBlocks = visibleBlocks.filter(b => b.numbered !== false)
    const numberOf = new Map(numberedBlocks.map((b, i) => [b.id, `${String(i + 1).padStart(2, '0')} · ${b.nav.toUpperCase()}`]))

    const blocoDe = (id: string) => options.medir?.ids.includes(id) ? `${options.medir.prefixo}-${id}` : undefined

    const nodes = entries.map(entry => {
        if (isInterstitial(entry)) return <div key={`interstitial-${entry.key}`} data-profile-entry="interstitial">{entry.interstitial}</div>
        if (!entry.present) return null
        const label = numberOf.get(entry.id) ?? entry.nav.toUpperCase()
        if (entry.layout === 'self') return (
            <div key={entry.id} className="relative" data-profile-entry="section" data-profile-weight={entry.weight ?? 'pillar'} data-bloco={blocoDe(entry.id)}>
                {entry.indexed && (
                    <p className="mb-4 font-mono text-[10px] font-black uppercase leading-4 tracking-[0.16em] text-muted">
                        {label}
                    </p>
                )}
                {entry.render(entry.indexed ? '' : label)}
            </div>
        )
        // O wrapper desenha o rótulo no mesmo eixo do título; o componente recebe
        // string vazia para não repetir o kicker.
        return (
            <ProfileSection key={entry.id} id={entry.id} weight={entry.weight} label={label} indented={!options.parentProvidesRail} bloco={blocoDe(entry.id)}>
                {entry.render('')}
            </ProfileSection>
        )
    })

    return { anchors, nodes }
}
