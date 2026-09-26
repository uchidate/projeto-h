import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
    /** Só entram atalhos cujo bloco existe na ficha. */
    destinos: { id: string; tipo: 'listen' | 'watch' | 'read' | 'understand' }[]
    accent: string
}

/** Faixa "comece pelo que você quer": leva direto ao bloco certo, em vez de a pessoa rolar a ficha. */
export function ArtistAtalhos({ destinos, accent }: Props) {
    const t = useTranslations('profile.artistC')
    if (destinos.length < 2) return null
    return (
        <nav aria-label={t('startWith')} className="page-wrap pb-6 pt-2 sm:pb-10" data-bloco="ficha-artista-atalhos">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>{t('startWith')}</p>
            <ul className="-mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:px-0">
                {destinos.map((d, i) => (
                    <li key={d.id} className="shrink-0 sm:shrink">
                        <Link href={`#${d.id}`} data-posicao={i + 1}
                            className="touch-target flex h-full items-center gap-2 border border-border bg-surface px-4 py-3 text-[13px] font-bold transition-colors hover:border-accent/60 sm:text-[14px]">
                            <span className="font-mono text-[11px]" style={{ color: accent }}>{String(i + 1).padStart(2, '0')}</span>
                            {t(d.tipo)}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
