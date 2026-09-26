import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
    abas: { href: string; label: string }[]
    accent: string
}

/** Abas da ficha C logo abaixo do topo. A ReadingBar só aparece depois de rolar; esta já está à vista. */
export function ArtistAbas({ abas, accent }: Props) {
    const t = useTranslations('profile.artistC')
    if (abas.length < 2) return null
    return (
        <nav aria-label={t('tabsLabel')} className="border-y border-border/60 bg-surface/40">
            <ul className="page-wrap -mx-0 flex gap-6 overflow-x-auto">
                {abas.map((a, i) => (
                    <li key={a.href} className="shrink-0">
                        <Link href={a.href} data-posicao={i + 1}
                            className="touch-target flex items-center border-b-2 border-transparent py-3 text-[13px] font-bold text-muted transition-colors hover:text-foreground"
                            style={i === 0 ? { borderColor: accent, color: 'var(--foreground)' } : undefined}>
                            {a.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
