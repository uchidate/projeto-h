import { useTranslations } from 'next-intl'

/**
 * Crédito ao JustWatch, exigido pelos termos do TMDB para exibir onde assistir.
 *
 * Todo lugar que mostra `production_platform` precisa usar este componente: o dado
 * veio do TMDB (2026-09-26) e mostrá-lo sem crédito descumpre o uso permitido da API.
 */
export function AtribuicaoJustWatch({ className = '' }: { className?: string }) {
    const t = useTranslations('profile.ui')
    return (
        <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer nofollow"
            className={`font-mono text-[9px] uppercase tracking-[0.12em] text-muted hover:text-foreground ${className}`}>
            {t('sidebar.justWatch')}
        </a>
    )
}
