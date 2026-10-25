import Image from 'next/image'
import Link from 'next/link'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'

/** Abertura do guia de um artista: foto, nome e a porta para o perfil completo (que é a página que importa). */
export function SolistaDestaque({ artist, grupo, resumo }: { artist: WPArtist; grupo?: string; resumo?: string }) {
    const imagem = getWPImage(artist._embedded, artist.featured_image_url)
    const nome = stripHtml(artist.title.rendered)
    return (
        <section aria-label={`Perfil de ${nome}`} className="grid gap-5 border border-border bg-surface/40 p-4 sm:grid-cols-[200px_1fr] sm:gap-7 sm:p-6 lg:grid-cols-[260px_1fr]">
            <Link href={`/artists/${artist.slug}`} className="relative block aspect-3/4 w-full max-w-[220px] overflow-hidden bg-surface sm:max-w-none">
                {imagem && <Image src={imagem.src} alt={imagem.alt || nome} fill priority sizes="(max-width: 640px) 220px, 260px" className="object-cover object-top" />}
            </Link>
            <div className="flex flex-col justify-center gap-3">
                <p className={`text-accent ${MONO}`}>Perfil{grupo ? ` · ${grupo}` : ''}</p>
                <h2 className="font-[family-name:var(--font-playfair)] text-[30px] font-bold leading-tight sm:text-[38px]">
                    {nome}{artist.acf?.name_hangul && <span className="ml-3 text-[18px] font-normal text-muted">{artist.acf.name_hangul}</span>}
                </h2>
                {resumo && <p className="max-w-xl text-[15px] leading-7 text-muted">{resumo}</p>}
                <Link href={`/artists/${artist.slug}`} className="touch-target mt-1 inline-flex h-11 w-fit items-center border border-foreground px-5 text-[14px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                    Ver perfil completo →
                </Link>
            </div>
        </section>
    )
}
