import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { APOIO_DOS_PASSOS, type GuiaDaHome } from '@/lib/home/guias'
import type { BestOfList } from '@/lib/wordpress/site-settings'

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.12em]'

function Passo({ numero, guia, ultimo }: { numero: number; guia: BestOfList; ultimo: boolean }) {
    const apoio = APOIO_DOS_PASSOS[guia.label]
    return (
        <li className="relative flex w-[200px] shrink-0 flex-col gap-3 border border-[#2c2c38] bg-[#18181f] p-3.5 lg:w-auto lg:flex-row lg:gap-3.5 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="flex flex-col items-start lg:items-center">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7be0d4] text-[13px] font-extrabold text-[#0b0b0e]">{numero}</span>
                {!ultimo && <span aria-hidden className="mt-1 hidden min-h-5 w-0.5 flex-1 bg-[#2c4a47] lg:block" />}
            </div>
            <Link href={guia.href} className={`group min-w-0 ${ultimo ? '' : 'lg:pb-4'}`}>
                <span className="block text-[15px] font-semibold leading-tight text-white group-hover:text-[#7be0d4]">{guia.label}</span>
                {apoio && <span className="mt-1 block text-[12px] text-[#a8a8bc]">{apoio}</span>}
            </Link>
        </li>
    )
}

function CartaoGuia({ guia, titulos }: { guia: GuiaDaHome; titulos: string }) {
    return (
        <Link href={`/guias/${guia.slug}`}
            className="group flex h-full min-h-[220px] flex-col justify-between gap-4 border border-[#2c2c38] border-t-[3px] bg-[#18181f] px-4 pb-4 pt-[18px] transition-colors hover:bg-[#20202a]"
            style={{ borderTopColor: guia.cor }}>
            <div className="relative h-[108px]" style={{ width: 70 + 2 * 56 }}>
                {guia.capas.map((capa, i) => (
                    <span key={capa} className="absolute h-[100px] w-[70px] overflow-hidden border-2 border-[#0b0b0e] bg-[#2c2c38] shadow-[0_4px_14px_rgba(0,0,0,0.55)]"
                        style={{ left: i * 56, top: i === 1 ? 0 : 6, zIndex: 3 - Math.abs(i - 1) }}>
                        <Image src={capa} alt="" fill sizes="70px" className="object-cover" />
                    </span>
                ))}
            </div>
            <div>
                <h3 className="text-[17px] font-semibold leading-tight text-white">{guia.titulo}</h3>
                <p className={`mt-2 text-[#a8a8bc] ${MONO} text-[9px] group-hover:text-white`}>{titulos} →</p>
            </div>
        </Link>
    )
}

/** Faixa escura de Guias: a trilha "Comece aqui" (editável no WP) e seis guias por tema com capas. */
export async function HomeGuias({ passos, guias, locale = DEFAULT_LOCALE }: { passos: BestOfList[]; guias: GuiaDaHome[]; locale?: Locale }) {
    if (passos.length === 0 && guias.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.guias' })
    const trilha = passos.slice(0, 6)
    return (
        <section aria-label={t('titulo')} className="bg-[#0b0b0e] px-4 py-7 text-white sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)] lg:gap-10 lg:px-7 lg:py-8">
            {trilha.length > 0 && (
                <div>
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                        <h2 className="font-serif text-[32px] font-medium leading-none tracking-[-0.02em] lg:text-[40px]">{t('titulo')}</h2>
                        <span className={`border border-[#7be0d4] px-[7px] py-1 leading-none text-[#7be0d4] ${MONO}`}>{t('tag')}</span>
                    </div>
                    <p className={`mb-4 text-[#7be0d4] ${MONO}`}>{t('comece')}</p>
                    <ol className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:block lg:overflow-visible lg:px-0 lg:pb-0">{trilha.map((g, i) => <Passo key={g.href} numero={i + 1} guia={g} ultimo={i === trilha.length - 1} />)}</ol>
                </div>
            )}
            {guias.length > 0 && (
                <div className="mt-8 min-w-0 lg:mt-0">
                    <div className="mb-4 flex items-baseline justify-between">
                        <p className={`text-[#ff7aa6] ${MONO}`}>{t('porTema')}</p>
                        <Link href="/guias" className={`hidden border-b border-[#ff7aa6] pb-0.5 text-white lg:inline-block ${MONO}`}>{t('verTodos')}</Link>
                    </div>
                    <div className="-mx-4 grid auto-cols-[210px] grid-flow-col gap-3.5 overflow-x-auto px-4 pb-2 no-scrollbar sm:-mx-6 sm:px-6 lg:mx-0 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:overflow-visible lg:px-0">
                        {guias.map(g => <CartaoGuia key={g.slug} guia={g} titulos={t('titulos', { total: g.total.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR') })} />)}
                    </div>
                    <Link href="/guias" className={`mt-4 inline-block border-b border-[#ff7aa6] pb-0.5 text-white lg:hidden ${MONO}`}>{t('verTodos')}</Link>
                </div>
            )}
        </section>
    )
}
