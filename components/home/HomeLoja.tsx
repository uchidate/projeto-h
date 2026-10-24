import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { HomeLojaCard } from '@/components/home/HomeLojaCard'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { vendidos } from '@/lib/home/mais-vendidos'
import { quedaDePreco, type StoreProduct } from '@/lib/wordpress/store'

/** Faixa rosa da loja: os mais vendidos, com o aviso de comissão. Só entra com dado de vendas (ver `maisVendidos`). */
export async function HomeLoja({ produtos, locale = DEFAULT_LOCALE }: { produtos: StoreProduct[]; locale?: Locale }) {
    if (produtos.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.loja' })
    const numero = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR')
    return (
        <section aria-label={t('titulo')} className="bg-[#ff246e] px-4 py-6 text-white sm:px-6 lg:px-5">
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="font-serif text-[28px] font-medium leading-none tracking-[-0.02em] sm:text-[34px]">{t('titulo')}</h2>
                <span className="bg-white px-[7px] py-1 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-[#ff246e]">{t('caixa')}</span>
                <Link href="/loja" className="ml-auto shrink-0 bg-white px-4 py-3 font-mono text-[11px] font-black uppercase leading-none tracking-[0.1em] text-[#ff246e]">{t('verLoja')}</Link>
                <p className="w-full text-[13px] text-white/90">{t('aviso')}</p>
            </div>
            <div className="-mx-4 grid auto-cols-[190px] grid-flow-col gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-5 lg:overflow-visible lg:px-0">
                {produtos.map(p => (
                    <HomeLojaCard key={p.id} product={p} vendidos={t('vendidos', { n: numero(vendidos(p)) })} comprar={t('comprar')}
                        selo={quedaDePreco(p.acf.price, p.acf.price_history, 30) ? t('precoCaiu') : undefined} />
                ))}
            </div>
        </section>
    )
}
