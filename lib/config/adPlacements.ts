import type { AdRuntimeFormat } from './adRuntime'

export type AdLayout = 'content' | 'feed' | 'leaderboard' | 'sidebar'

export type AdLayoutPolicy = {
    format: AdRuntimeFormat
    eager: boolean
    containerClassName: string
    maxWidthPx: number
    wrapperClassName: string
    fullWidthResponsive: boolean
}

/**
 * Contrato visual único de monetização.
 *
 * Páginas escolhem o papel editorial do placement, nunca dimensões ou flags
 * do AdSense. Formatos `auto` permanecem responsivos ao CONTÊINER; full-width
 * mobile fica desligado dentro do conteúdo para não escapar de grids, cards e
 * wrappers com overflow (origem dos criativos cortados em Safari).
 */
export const AD_LAYOUT_POLICIES: Record<AdLayout, AdLayoutPolicy> = {
    // Reserva de altura (min-h): o slot nascia com altura 0 e ganhava a altura do
    // criativo só quando o AdSense preenchia, empurrando todo o conteúdo abaixo —
    // origem clássica de CLS. A reserva é o menor formato plausível de cada papel,
    // então o colapso por `unfilled` continua removendo o bloco inteiro e o espaço
    // reservado nunca vira buraco permanente.
    content: {
        format: 'auto',
        eager: false,
        containerClassName: 'w-full min-w-0 min-h-[250px]',
        maxWidthPx: 728,
        wrapperClassName: 'my-8',
        fullWidthResponsive: false,
    },
    feed: {
        format: 'auto',
        eager: false,
        containerClassName: 'w-full min-w-0 min-h-[250px]',
        maxWidthPx: 970,
        wrapperClassName: 'my-8',
        fullWidthResponsive: false,
    },
    leaderboard: {
        // Era `horizontal`, para manter o separador editorial baixo e evitar que
        // o AdSense otimizasse para 390x844 no Safari mobile. A intenção estava
        // certa; o preço nunca tinha sido medido.
        //
        // Medido em 2026-09-12, nos 30 dias anteriores: `article_leaderboard`
        // preencheu 6,4% (20 de 314). Na MESMA página, o `article_body` — mesmo
        // componente, mesma audiência, mesmas sessões, e `format: 'auto'` —
        // preencheu 50%. Com o contexto de página controlado, o formato é a
        // única variável sistemática que sobra: horizontal restringe demais o
        // leilão, e quase todo o inventário voltava vazio.
        //
        // Voltar para `auto` NÃO reabre o incidente de CLS de 2026-08: aquele
        // dependia de `full-width-responsive`, que continua false aqui e é o que
        // deixa o Google trocar um horizontal por unidade de 250-300px (ver
        // `responsiveExpansion` em AdSlot.tsx). E a reserva anti-CLS acompanha o
        // formato sozinha — `.ad-reserve-auto` reserva 250px, contra os 100px do
        // horizontal.
        format: 'auto',
        eager: false,
        // 250px para casar com a reserva de `auto`. O vão morto que os 90px
        // evitavam não se materializa: `unfilled` e `timeout` colapsam o bloco
        // inteiro (ver AdSlotInline), então o espaço só existe durante a carga.
        containerClassName: 'w-full min-w-0 min-h-[250px]',
        maxWidthPx: 970,
        wrapperClassName: 'my-8',
        fullWidthResponsive: false,
    },
    sidebar: {
        format: 'rectangle',
        eager: true,
        containerClassName: 'w-full min-w-0 min-h-[250px]',
        maxWidthPx: 300,
        wrapperClassName: 'my-0',
        fullWidthResponsive: false,
    },
}
