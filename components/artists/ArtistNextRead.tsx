import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import type { WPArtist, WPGroup, WPAgency } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

interface Props {
    artists: WPArtist[]
    connectionGroup?: WPGroup
    agency?: WPAgency
    accent: string
}

/**
 * Saída do perfil. Quem chega ao fim de um dossiê longo quer outro nome, não um
 * índice: as duas âncoras genéricas que fechavam a página ("Todos os artistas",
 * "Grupos K-Pop") devolviam o leitor para uma listagem sem sugestão nenhuma.
 *
 * Aqui a página propõe UM destino e diz por quê — a conexão vem do grupo ou da
 * agência em comum, o mesmo critério de "Também em X" usado acima. As âncoras de
 * índice continuam presentes, em peso secundário, para quem quer navegar.
 */
export function ArtistNextRead({ artists, connectionGroup, agency, accent }: Props) {
    const t = useTranslations('profile.ui')
    const next = artists[0]
    if (!next) return null

    const name = stripHtml(next.title.rendered)
    const image = getWPImage(next._embedded, next.featured_image_url)
    const reason = connectionGroup
        ? t('next.alsoIn', { name: stripHtml(connectionGroup.title.rendered) })
        : agency
            ? t('next.sameRoster', { name: stripHtml(agency.title.rendered) })
            : t('next.sameScene')

    return (
        <section className="page-wrap py-10">
            <div className="profile-measure border-t border-border/70 pt-6">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>
                    {t('next.continueHere')}
                </p>

                <Link href={`/artists/${next.slug}`} className="group mt-5 flex items-center gap-5">
                    <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden bg-surface sm:h-[104px] sm:w-[104px]">
                        {image && (
                            <Image src={image.src} alt={image.alt || name} fill sizes="104px"
                                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted">{reason}</p>
                        <p className="mt-1.5 text-[clamp(1.25rem,2.4vw,1.75rem)] font-black leading-[1.1] tracking-[-0.03em] text-foreground transition-colors group-hover:text-accent">
                            {name}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-2 font-mono text-[11px] text-muted">
                            {t('next.readProfile')} <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                        </span>
                    </div>
                </Link>

                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4">
                    <Link href="/artists" className="touch-target inline-flex items-center font-mono text-[11px] text-muted transition-colors hover:text-accent">
                        {t('next.allArtists')}
                    </Link>
                    <Link href="/groups" className="touch-target inline-flex items-center font-mono text-[11px] text-muted transition-colors hover:text-accent">
                        {t('next.kpopGroups')}
                    </Link>
                </div>
            </div>
        </section>
    )
}
