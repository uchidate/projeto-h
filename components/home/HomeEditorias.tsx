import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { postLink } from '@/components/home/postLink'
import { href as rota } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { intlLocale } from '@/lib/i18n/format'
import { getWPImage, stripHtml, formatDatePt } from '@/lib/utils'
import { HomeProdutoMini } from '@/components/home/HomeProdutoMini'
import type { EditoriaMontada } from '@/lib/home/editorias'
import type { PrateleirasEditorias } from '@/lib/home/editorias-loja'

type Props = {
    editorias: EditoriaMontada[]
    prateleiras?: PrateleirasEditorias
    locale?: Locale
}

/**
 * Editorias em colunas (K-Pop, Doramas e filmes, Cultura e K-Beauty): o visitante
 * escolhe o assunto em vez de percorrer um feed único. Cada coluna é uma barra
 * colorida, uma matéria de abertura e uma lista curta. Coluna com poucos posts some.
 */
export async function HomeEditorias({ editorias: colunas, prateleiras = {}, locale = DEFAULT_LOCALE }: Props) {
    if (!colunas.length) return null
    const t = await getTranslations({ locale, namespace: 'home.editorias' })
    const data = (date: string) => formatDatePt(date, intlLocale(locale))
    const blog = rota('blog', undefined, locale)

    return (
        <section aria-label={t('rotulo')} className="border-t border-border px-4 py-7 sm:px-6 sm:py-8 lg:px-10">
            <div className={`grid gap-5 lg:gap-6 ${colunas.length === 3 ? 'lg:grid-cols-3' : colunas.length === 2 ? 'lg:grid-cols-2' : ''}`}>
                {colunas.map(({ coluna, posts: itens }) => {
                    const [abertura, ...resto] = itens
                    const imagem = getWPImage(abertura._embedded, abertura.featured_image_url)
                    const titulo = stripHtml(abertura.title.rendered)
                    return (
                        <div key={coluna.chave} className="flex min-w-0 flex-col border border-border bg-background">
                            <div className="flex items-center justify-between px-4 py-2.5 text-white" style={{ backgroundColor: coluna.cor }}>
                                <h2 className="font-mono text-[11px] font-black uppercase tracking-[0.14em]">{t(coluna.chave)}</h2>
                                <Link href={`${blog}?category=${coluna.categoria}`} className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] hover:underline">{t('verMais')}</Link>
                            </div>
                            <Link {...postLink(abertura.slug, locale)} className="group block p-4 pb-3">
                                <div className="relative aspect-video overflow-hidden bg-surface">
                                    {imagem && <Image src={imagem.src} alt={imagem.alt || titulo} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />}
                                </div>
                                <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{data(abertura.date)}</p>
                                <h3 className="mt-1.5 font-serif text-home-title-sm font-medium text-foreground transition-colors group-hover:text-accent">{titulo}</h3>
                            </Link>
                            <div className="px-4 pb-3">
                                {resto.map(post => {
                                    const img = getWPImage(post._embedded, post.featured_image_url)
                                    const nome = stripHtml(post.title.rendered)
                                    return (
                                        <Link key={post.id} {...postLink(post.slug, locale)} className="group flex items-start gap-3 border-t border-border py-3">
                                            <div className="relative aspect-video w-24 shrink-0 overflow-hidden bg-surface">
                                                {img && <Image src={img.src} alt={img.alt || nome} fill sizes="96px" className="object-cover" />}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-[13px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent line-clamp-3">{nome}</h3>
                                                <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{data(post.date)}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                            {(prateleiras[coluna.chave]?.length ?? 0) > 0 && (
                                <div className="mx-4 mb-4 mt-auto border-2 p-3" style={{ borderColor: coluna.cor }}>
                                    <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">{t('loja.naLoja', { assunto: t(`loja.${coluna.chave}`) })}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {prateleiras[coluna.chave]!.map(p => <HomeProdutoMini key={p.id} product={p} contexto={`home_editoria_${coluna.chave}`} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
