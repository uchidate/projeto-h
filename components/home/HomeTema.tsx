import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { HomeProdutoMini } from '@/components/home/HomeProdutoMini'
import { postLink } from '@/components/home/postLink'
import { StoreCard } from '@/components/ui/StoreCard'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { dataRelativa } from '@/lib/home/data-relativa'
import type { FichaDoTema, TemaHome } from '@/lib/home/temas'
import { getWPImage, stripHtml } from '@/lib/utils'

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em]'

interface Props {
    tema: TemaHome
    /** Chave em `home.temas.*` (título, caixa, ficha de pratos/marcas, rótulos da prateleira). */
    chave: 'gastronomia' | 'beleza'
    cor: string
    href: string
    bloco: string
    locale?: Locale
}

function Ficha({ ficha, base, naLoja, cor }: { ficha: FichaDoTema; base: string; naLoja: string; cor: string }) {
    return (
        <Link href={`${base}/${ficha.slug}`} className="group block border border-border bg-background">
            <span className="relative block aspect-[16/10] overflow-hidden bg-white">
                <Image src={ficha.imagem} alt={ficha.nome} fill sizes="(max-width: 1024px) 45vw, 14vw" className="object-contain p-2 group-hover:scale-[1.03] transition-transform" />
            </span>
            <span className="block px-3 py-2.5">
                <span className="block text-[14px] font-bold leading-tight text-foreground">{ficha.nome}</span>
                {ficha.naLoja > 0 && <span className={`mt-1 block ${MONO} text-[9px]`} style={{ color: cor }}>{naLoja}</span>}
            </span>
        </Link>
    )
}

/** Painel temático da home (Gastronomia, Beleza): artigos, fichas (pratos e marcas) e a prateleira da loja do assunto. */
export async function HomeTema({ tema, chave, cor, href, bloco, locale = DEFAULT_LOCALE }: Props) {
    const t = await getTranslations({ locale, namespace: `home.temas.${chave}` })
    const { artigos, pratos, marcas, prateleira } = tema
    if (artigos.length === 0 && pratos.length === 0 && marcas.length === 0) return null
    const contagens = [
        tema.totalPratos > 0 && t('contaPratos', { n: tema.totalPratos }),
        tema.totalMarcas > 0 && t('contaMarcas', { n: tema.totalMarcas }),
        tema.totalArtigos > 0 && t('contaArtigos', { n: tema.totalArtigos }),
    ].filter(Boolean).join(' · ')
    const produtos = prateleira.filter(p => p.acf.affiliate_url).slice(0, 5)

    return (
        <section data-bloco={bloco} aria-label={t('titulo')}
            className="border border-border px-4 py-5 sm:px-6 lg:px-5"
            style={{ backgroundColor: `color-mix(in srgb, ${cor} 7%, var(--color-home-card))` }}>
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h2 className="font-serif text-[26px] font-medium leading-none tracking-[-0.02em] text-foreground sm:text-[32px]">{t('titulo')}</h2>
                <span className={`border px-[7px] py-1 leading-none ${MONO}`} style={{ color: cor, borderColor: cor }}>{t('caixa')}</span>
                {contagens && <span className="text-[13px] text-muted">{contagens}</span>}
                <Link href={href} className={`ml-auto border-b pb-0.5 text-foreground ${MONO}`} style={{ borderColor: cor }}>{t('abrir')}</Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)]">
                {artigos.length > 0 && (
                    <div>
                        <p className={`mb-2 ${MONO} text-[9px]`} style={{ color: cor }}>{t('paraLer')}</p>
                        <ul>
                            {artigos.map(post => {
                                const imagem = getWPImage(post._embedded, post.featured_image_url)
                                const titulo = stripHtml(post.title.rendered)
                                return (
                                    <li key={post.id} className="border-t border-border first:border-t-0">
                                        <Link {...postLink(post.slug, locale)} className="group flex items-start gap-3 py-2.5">
                                            <span className="relative aspect-video w-20 shrink-0 overflow-hidden bg-surface">
                                                {imagem && <Image src={imagem.src} alt="" fill sizes="80px" className="object-cover" />}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block font-serif text-[15px] font-medium leading-snug text-foreground group-hover:text-accent line-clamp-3">{titulo}</span>
                                                <span className={`mt-1 block ${MONO} text-[9px] text-muted`}>{dataRelativa(post.date, locale)}</span>
                                            </span>
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
                {pratos.length > 0 && (
                    <div>
                        <p className={`mb-2 ${MONO} text-[9px]`} style={{ color: cor }}>{t('pratos')}</p>
                        <div className="-mx-4 grid auto-cols-[44%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
                            {pratos.map(f => <Ficha key={f.slug} ficha={f} base="/comidas" cor={cor} naLoja={t('naLoja', { n: f.naLoja })} />)}
                        </div>
                    </div>
                )}
                {marcas.length > 0 && (
                    <div className={chave === 'beleza' ? 'lg:col-span-2' : ''}>
                        <p className={`mb-2 ${MONO} text-[9px]`} style={{ color: cor }}>{t('marcas')}</p>
                        <div className={`-mx-4 grid auto-cols-[44%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0 ${chave === 'beleza' ? 'lg:grid-cols-4' : ''}`}>
                            {marcas.map(f => <Ficha key={f.slug} ficha={f} base="/empresas" cor={cor} naLoja={t('naLoja', { n: f.naLoja })} />)}
                        </div>
                    </div>
                )}
            </div>

            {produtos.length > 0 && (
                <div className="mt-5 border-2 border-[#ff246e] bg-[#fff0f5] p-3 dark:bg-[#2a1018]">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                        <p className={`${MONO} text-[9px] text-muted`}>{t('prateleira')}</p>
                        <Link href="/loja" className="shrink-0 px-3 py-2 font-mono text-[10px] font-black uppercase leading-none tracking-[0.1em] text-white bg-[#ff246e]">{t('verPrateleira')}</Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:hidden">
                        {produtos.slice(0, 2).map(p => <HomeProdutoMini key={p.id} product={p} contexto={`home_${chave}`} />)}
                    </div>
                    <div className="hidden gap-2 lg:grid lg:grid-cols-5">
                        {produtos.map(p => <StoreCard key={p.id} product={p} compact contexto={`home_${chave}`} />)}
                    </div>
                </div>
            )}
        </section>
    )
}
