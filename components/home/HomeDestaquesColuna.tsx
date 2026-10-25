import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { postLink } from '@/components/home/postLink'
import { href as rota } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { homeCatName, homeCatStyle } from '@/lib/home/catStyle'
import { dataRelativa } from '@/lib/home/data-relativa'
import { getWPImage, stripHtml } from '@/lib/utils'
import type { WPPost } from '@/lib/wordpress/types'

type CategoryMap = Record<number, { name: string; slug: string }>

const ROTULO = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em]'

/** Coluna do meio do topo: a matéria maior e uma lista numerada (2 a 5) com miniatura. */
export async function HomeDestaquesColuna({ posts, categoryMap, locale = DEFAULT_LOCALE }: { posts: WPPost[]; categoryMap?: CategoryMap; locale?: Locale }) {
    if (!posts.length) return null
    const t = await getTranslations({ locale, namespace: 'home.destaques' })
    const tc = await getTranslations({ locale, namespace: 'home.comum' })
    const [lead, ...lista] = posts
    const imagemLead = getWPImage(lead._embedded, lead.featured_image_url)
    const tituloLead = stripHtml(lead.title.rendered)
    const estiloLead = homeCatStyle(lead, categoryMap)

    return (
        <section aria-label={t('titulo')} className="min-w-0 px-4 py-4 sm:px-6 lg:px-4">
            <div className="flex items-center justify-between">
                <h2 className={`${ROTULO} text-accent`}>{t('titulo')}</h2>
                <Link href={rota('blog', undefined, locale)} className={`${ROTULO} text-muted hover:text-accent`}>{tc('verTodos')}</Link>
            </div>

            <Link {...postLink(lead.slug, locale)} className="group mt-2.5 block">
                <div className="relative aspect-video overflow-hidden bg-surface">
                    {imagemLead && <Image src={imagemLead.src} alt={imagemLead.alt || tituloLead} fill sizes="(max-width: 1024px) 100vw, 26vw" className="object-cover" />}
                    <span className="absolute left-2.5 top-2.5 border bg-background px-2 py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em]"
                        style={{ color: estiloLead.color, borderColor: estiloLead.color }}>
                        {homeCatName(lead, categoryMap, tc('artigo'))}
                    </span>
                </div>
                <h3 className="mt-2.5 text-[17px] font-extrabold leading-snug text-foreground transition-colors group-hover:text-accent">{tituloLead}</h3>
                <p className={`mt-1.5 ${ROTULO} text-muted`}>{dataRelativa(lead.date, locale)}</p>
            </Link>

            <ol className="mt-3 border-t border-border">
                {lista.map((post, i) => {
                    const imagem = getWPImage(post._embedded, post.featured_image_url)
                    const titulo = stripHtml(post.title.rendered)
                    return (
                        <li key={post.id} className="border-b border-border last:border-b-0">
                            <Link {...postLink(post.slug, locale)} className="group flex items-center gap-3 py-3">
                                <span className="w-3 shrink-0 text-[17px] font-black leading-none text-accent">{i + 2}</span>
                                <span className="relative aspect-video w-20 shrink-0 overflow-hidden bg-surface">
                                    {imagem && <Image src={imagem.src} alt="" fill sizes="80px" className="object-cover" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[13px] font-extrabold leading-snug text-foreground transition-colors group-hover:text-accent line-clamp-3">{titulo}</span>
                                    <span className={`mt-1 block ${ROTULO} text-[9px] text-muted`}>{homeCatName(post, categoryMap, tc('artigo'))} · {dataRelativa(post.date, locale)}</span>
                                </span>
                            </Link>
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}
