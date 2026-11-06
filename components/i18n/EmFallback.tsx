import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { AvisoSemTraducao } from './AvisoSemTraducao'

/**
 * Página sem tradução: em português é só o conteúdo; nos outros idiomas o mesmo
 * conteúdo vem precedido do aviso de que ainda não há versão traduzida.
 * Antes, cada página repetia este `if` + fragmento.
 */
export function EmFallback({ locale, hrefOriginal, children }: { locale: Locale; hrefOriginal: string; children: React.ReactNode }) {
    if (locale === DEFAULT_LOCALE) return <>{children}</>
    return (
        <>
            <AvisoSemTraducao locale={locale} hrefOriginal={hrefOriginal} />
            {children}
        </>
    )
}
