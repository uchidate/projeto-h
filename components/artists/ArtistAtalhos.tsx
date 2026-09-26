import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
    /** Só entram atalhos cujo bloco existe na ficha. */
    destinos: { id: string; tipo: 'listen' | 'watch' | 'read' | 'understand'; detalhe?: string }[]
    accent: string
}

/** Faixa "comece pelo que você quer": leva direto ao bloco certo, em vez de a pessoa rolar a ficha. */
export function ArtistAtalhos({ destinos, accent }: Props) {
    const t = useTranslations('profile.artistC')
    if (destinos.length < 2) return null
    return (
        <nav aria-label={t('startWith')} className="page-wrap pb-6 pt-6 sm:pb-10 sm:pt-8" data-bloco="ficha-artista-atalhos">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>{t('startWith')}</p>
            <ul className="-mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:px-0">
                {destinos.map((d, i) => (
                    <li key={d.id} className="shrink-0 sm:shrink">
                        <Link href={`#${d.id}`} data-posicao={i + 1}
                            className="touch-target flex h-full w-[220px] flex-col gap-1 border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/60 sm:w-auto">
                            <span className="flex items-center gap-2 text-[14px] font-black sm:text-[15px]">
                                <span className="font-mono text-[11px]" style={{ color: accent }}>{String(i + 1).padStart(2, '0')}</span>
                                {t(d.tipo)}
                                <span aria-hidden className="ml-auto text-[13px]" style={{ color: accent }}>→</span>
                            </span>
                            {d.detalhe && <span className="line-clamp-2 text-[12px] leading-4 text-muted sm:text-[13px] sm:leading-5">{d.detalhe}</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
