import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export type ChaveCapitulo = 'agora' | 'aprenda' | 'editoria' | 'reportagem' | 'dados' | 'jogue' | 'temas' | 'loja'

/**
 * Divisor numerado entre os grandes grupos da home: dá nome e cor a cada natureza de conteúdo
 * (Agora, Aprenda, Por editoria, Reportagem, Dados, Jogue, Temas, Loja) para a página ter hierarquia.
 */
export async function HomeCapitulo({ n, chave, cor, locale = DEFAULT_LOCALE }: { n: number; chave: ChaveCapitulo; cor: string; locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.capitulos' })
    return (
        <div data-capitulo={chave} className="flex items-center gap-3">
            <span aria-hidden className="h-3 w-3 shrink-0" style={{ backgroundColor: cor }} />
            <h2 className="whitespace-nowrap font-mono text-[11px] font-black uppercase tracking-[0.18em] text-foreground">{`0${n} · ${t(`${chave}.titulo`)}`}</h2>
            <span aria-hidden className="h-0.5 min-w-4 flex-1 opacity-35" style={{ backgroundColor: cor }} />
            <span className="hidden whitespace-nowrap text-[12px] text-muted lg:block">{t(`${chave}.sub`)}</span>
        </div>
    )
}
