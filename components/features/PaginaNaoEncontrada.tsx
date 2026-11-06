import { useTranslations } from 'next-intl'
import Link from '@/components/i18n/LocalizedLink'
import { RastreioDeNaoEncontrado } from '@/components/analytics/RastreioDeNaoEncontrado'

/**
 * 404 com o site em volta.
 *
 * Até 2026-09-13 a URL inexistente caía na página padrão do Next: "404" solto,
 * sem menu, sem busca, sem link. Quem chega por link quebrado do Google ou de
 * rede social não tinha por onde continuar — vazamento de audiência, e sem
 * medição. Agora mede (page_not_found, com a origem) e oferece caminhos.
 */
export function PaginaNaoEncontrada() {
    const t = useTranslations('client.notFound')
    return (
        <div className="page-wrap py-24 text-center">
            <RastreioDeNaoEncontrado />
            <p className="font-mono text-[11px] text-muted tracking-[0.08em] uppercase mb-4">{t('erro')}</p>
            <h1 className="text-[48px] font-black tracking-[-0.04em] leading-none mb-4">
                {t('titulo')}<span className="text-accent">.</span>
            </h1>
            <p className="text-[15px] text-muted max-w-md mx-auto mb-8">
                {t('texto')}
            </p>
            <div data-bloco="pagina-404" className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/" className="font-mono text-[12px] font-semibold border border-accent-a11y bg-accent-a11y text-white px-5 py-2.5 hover:opacity-90 transition-opacity">
                    {t('inicio')}
                </Link>
                <Link href="/blog" className="font-mono text-[12px] font-semibold border border-border px-5 py-2.5 hover:border-accent hover:text-accent transition-colors">
                    {t('noticias')}
                </Link>
                <Link href="/productions" className="font-mono text-[12px] font-semibold border border-border px-5 py-2.5 hover:border-accent hover:text-accent transition-colors">
                    {t('producoes')}
                </Link>
                <Link href="/artists" className="font-mono text-[12px] font-semibold border border-border px-5 py-2.5 hover:border-accent hover:text-accent transition-colors">
                    {t('artistas')}
                </Link>
            </div>
        </div>
    )
}
