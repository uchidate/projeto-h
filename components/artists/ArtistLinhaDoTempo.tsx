import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { href } from '@/lib/i18n/routes'
import { stripHtml } from '@/lib/utils'
import type { MarcoDaCarreira } from '@/lib/artists/obrasEmDestaque'

interface Props {
    marcos: MarcoDaCarreira[]
    artistName: string
    accent: string
}

/** Carreira em uma faixa: cada marco é uma obra real e leva à página dela. */
export function ArtistLinhaDoTempo({ marcos, artistName, accent }: Props) {
    const t = useTranslations('profile.artistB')
    const locale = useLocale()
    if (marcos.length < 4) return null

    return (
        <section className="page-wrap py-8 sm:py-12" data-bloco="ficha-artista-linha-do-tempo">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>{t('timeline')}</p>
            <h2 className="mt-2 text-[24px] font-black leading-tight tracking-[-0.03em] sm:text-[34px]">{t('timelineTitle', { name: artistName, count: marcos.length })}</h2>
            <ol className="-mx-4 mt-6 flex snap-x scroll-pl-4 gap-0 sm:scroll-pl-0 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {marcos.map(({ ano, produtos }, i) => (
                    <li key={produtos.id} className="w-[170px] shrink-0 snap-start sm:w-[200px]">
                        <Link href={href('production', { slug: produtos.slug }, locale)} data-bloco="ficha-artista-linha-do-tempo" data-posicao={i + 1} className="group block touch-target">
                            <span className="font-mono text-[11px] font-bold tracking-[0.14em]" style={{ color: accent }}>{ano}</span>
                            <span aria-hidden="true" className="relative mt-3 block h-0.5 bg-border">
                                <span className="absolute -top-1.5 left-0 size-3.5 rounded-full border-2 bg-background" style={{ borderColor: accent }} />
                            </span>
                            <span className="mt-3 block pr-4 text-[16px] font-bold leading-snug group-hover:underline">{stripHtml(produtos.title.rendered)}</span>
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    )
}
