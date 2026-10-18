import { useTranslations } from 'next-intl'
import type { WPArtist } from '@/lib/wordpress/types'

const SERIF = 'font-[family-name:var(--font-playfair)]'

/** Obra-chave do dossiê, sem o parêntese final: "Flower (2023)" -> "Flower". */
export function obraChaveDe(artist: WPArtist): string {
    return String(artist.acf?.essencia_obra_chave ?? '').replace(/\s*\([^)]*\)?\s*$/, '').trim()
}

/** Id do primeiro grupo do artista que tem nome conhecido. */
export function grupoDe(artist: WPArtist, grupos: Record<number, string>): string | undefined {
    const id = (artist.acf?.groups as number[] | undefined)?.find(g => grupos[g])
    return id ? grupos[id] : undefined
}

/**
 * Gancho sobre a foto do artista: obra-chave em destaque no pé e, quando há, o grupo em etiqueta.
 * `grupoNoTopo` põe a etiqueta no canto superior (cartão do diretório); sem ele, ela fica no pé,
 * acima da obra (cartão do "Em alta", onde o topo é do número da posição).
 * Só usa dados já presentes na listagem; sem eles não desenha nada.
 */
export function GanchoArtista({ obraChave, grupoNome, grupoNoTopo = false }: { obraChave: string; grupoNome?: string; grupoNoTopo?: boolean }) {
    const t = useTranslations('client.artistCard')
    const etiqueta = grupoNome && (
        <span className={`${grupoNoTopo ? 'absolute left-2 top-2 max-w-[calc(100%-1rem)]' : 'mb-2 block w-fit max-w-full'} truncate bg-accent px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#0d0b0f] shadow-md`}>
            ♪ {grupoNome}
        </span>
    )
    return (
        <>
            {grupoNoTopo && etiqueta}
            {obraChave && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 via-60% to-transparent px-3 pb-3 pt-20 text-white">
                    {!grupoNoTopo && etiqueta}
                    <span className="block whitespace-nowrap font-mono text-[9px] font-black uppercase tracking-[0.14em] text-accent">{t('keyWork')}</span>
                    <span className={`mt-1 line-clamp-2 block pr-10 ${SERIF} text-[18px] font-bold italic leading-[1.08] drop-shadow-[0_1px_6px_rgba(0,0,0,.6)]`}>{obraChave}</span>
                    <span aria-hidden className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[15px] font-black text-[#0d0b0f] shadow-lg transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-110">→</span>
                </div>
            )}
        </>
    )
}
