import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

const NO_CELULAR = 20
const NO_DESKTOP = 12

interface Props {
    title: string
    cast: WPArtist[]
    castRoles: Map<string, string>
}

/**
 * Elenco em UMA seção com duas apresentações: faixa horizontal de rostos no celular
 * (dá para ver todo mundo com o polegar, sem uma lista de 1 coluna) e grade de
 * cartões no desktop. Ter as duas na mesma seção mantém um só `#elenco` no HTML — a
 * âncora da navegação fixa funciona nos dois tamanhos.
 */
export function ProductionElencoB({ title, cast, castRoles }: Props) {
    const t = useTranslations('profile.production')
    if (!cast.length) return null

    const dados = (artist: WPArtist) => ({
        nome: stripHtml(artist.title.rendered),
        foto: getWPImage(artist._embedded, artist.featured_image_url),
        papel: castRoles.get(artist.slug),
    })

    return (
        <section id="elenco" data-bloco="ficha-producao-elenco" aria-labelledby="h-elenco" className="scroll-mt-(--scroll-anchor-offset,134px)">
            <p className="mb-2.5 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted lg:text-[11px]">01 · {t('nav.cast')}</p>
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-3.5">
                <h2 id="h-elenco" className="font-serif text-[26px] font-semibold tracking-tight text-foreground lg:text-[34px]">
                    <span className="lg:hidden">{t('summary.mainCast')}</span>
                    <span className="hidden lg:inline">{t('summary.castOf', { title })}</span>
                </h2>
                <span className="hidden text-[13px] text-muted lg:inline">{t('summary.castCount', { count: cast.length })}</span>
            </div>

            <ul className="no-scrollbar -mx-4 flex snap-x scroll-pl-4 gap-3.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:scroll-pl-0 sm:px-0 lg:hidden">
                {cast.slice(0, NO_CELULAR).map(artist => {
                    const { nome, foto, papel } = dados(artist)
                    return (
                        <li key={artist.id} className="w-[84px] shrink-0 snap-start">
                            <Link href={`/artists/${artist.slug}`} className="group block text-center">
                                <span className="relative mx-auto block h-[76px] w-[76px] overflow-hidden rounded-full border border-border bg-surface">
                                    {foto ? (
                                        <Image src={foto.src} alt="" fill sizes="76px" className="object-cover object-top" />
                                    ) : (
                                        <span className="flex h-full items-center justify-center font-serif text-[28px] text-accent/40">{nome[0]}</span>
                                    )}
                                </span>
                                <span className="mt-2 block text-[12px] font-bold leading-tight text-foreground group-hover:text-accent">{nome}</span>
                                {papel && <span className="mt-0.5 block text-[11px] leading-tight text-muted">{papel}</span>}
                            </Link>
                        </li>
                    )
                })}
            </ul>

            <ul className="hidden grid-cols-4 gap-x-5 gap-y-7 lg:grid">
                {cast.slice(0, NO_DESKTOP).map(artist => {
                    const { nome, foto, papel } = dados(artist)
                    return (
                        <li key={artist.id}>
                            <Link href={`/artists/${artist.slug}`} className="group block">
                                <span className="relative block aspect-[6/7] overflow-hidden border border-border bg-surface">
                                    {foto ? (
                                        <Image src={foto.src} alt="" fill sizes="(min-width: 1280px) 210px, 20vw" className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                                    ) : (
                                        <span className="flex h-full items-center justify-center font-serif text-[64px] text-border-strong">{nome[0]}</span>
                                    )}
                                </span>
                                <span className="mt-3 block text-[16px] font-bold text-foreground group-hover:text-accent">{nome}</span>
                                {papel && <span className="mt-0.5 block text-[13px] text-muted">{papel}</span>}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
