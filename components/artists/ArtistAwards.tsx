import { useTranslations } from 'next-intl'
import { Trophy } from 'lucide-react'
import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'
import type { ArtistAward } from '@/lib/profiles/structuredFields'
import { toRgba } from '@/lib/theme/color'

export function ArtistAwards({ awards, eyebrow, accent }: { awards: ArtistAward[]; eyebrow: string; accent: string }) {
    const t = useTranslations('profile.ui')
    if (!awards.length) return null

    // Categorias repetidas 3+ vezes viram um recorde visível — sinaliza sem precisar
    // de curadoria manual por artista (funciona para qualquer dossiê de prêmios).
    const categoryCounts = awards.reduce<Record<string, number>>((acc, a) => {
        acc[a.category] = (acc[a.category] ?? 0) + 1
        return acc
    }, {})
    const streakCategories = Object.entries(categoryCounts).filter(([, count]) => count >= 3).map(([category]) => category)

    return (
        <div>
            <div className="mb-6"><GroupSectionHeading id="premios-titulo" eyebrow={eyebrow} title={t('awardsTitle')} accent={accent} /></div>

            {streakCategories.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 profile-measure">
                    {streakCategories.map(category => (
                        <span key={category} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.08em]"
                            style={{ borderColor: toRgba(accent, 0.4), background: toRgba(accent, 0.1), color: accent }}>
                            <Trophy size={11} /> {categoryCounts[category]}× {category} — recorde
                        </span>
                    ))}
                </div>
            )}

            {/* divide-x numa grid de 2 colunas segue a ordem do DOM, não a coluna:
                o 3º item (coluna 1) ganharia borda esquerda solta. Bordas por
                posição real — coluna 2 recebe borda esquerda, linha 2+ recebe
                borda superior — e o último ímpar fecha a grade ocupando as duas. */}
            {/* Fio de cabeça por prêmio, sem painel envolvente: era um card
                contendo cards. Último ímpar ocupa as duas colunas. */}
            <div className="profile-measure grid gap-x-10 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                {awards.map((a, i) => (
                    <div
                        key={i}
                        className="flex gap-4 border-t border-border/70 py-5"
                    >
                        <div className="shrink-0 pt-0.5" style={{ color: accent }}>
                            <Trophy size={15} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-mono text-[11px] font-black tracking-[0.04em]" style={{ color: accent }}>{a.year}</p>
                            <p className="mt-0.5 text-[15px] font-black leading-snug text-foreground">{a.category}</p>
                            {a.title && (
                                <p className="mt-0.5 text-[13px] italic leading-snug text-foreground-subtle">{a.title}</p>
                            )}
                            {a.event && (
                                <p className="profile-kicker mt-2">{a.event}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
