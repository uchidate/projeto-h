import { intlLocale } from '@/lib/i18n/format'
import { useLocale, useTranslations } from 'next-intl'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { formatDate } from '@/lib/utils'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import { FactGrid, type FactItem } from '@/components/blocks/FactGrid'
import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { ProfileSidebarAd } from '@/components/profiles/ProfileSidebarAd'
import { highlightProse } from '@/lib/profiles/highlightProse'

interface Zodiac { sign: string; emoji: string }

interface Props {
    name: string
    label: string
    contentBefore: string
    contentAfter: string
    facts: {
        birthDate?: string
        deathDate?: string
        birthPlace?: string
        height?: number
        mbti?: string
        debutDate?: string
    }
    age: number | null
    zodiac: Zodiac | null
    roleLabels: string[]
    accent?: string
    bioQuote?: { text: string; author: string; context?: string } | null
    /** Ficha magra: sem anúncio ao lado de um texto que mal chega a um parágrafo. */
    semAnuncio?: boolean
}

function buildAgeDescription(age: number | null, isDeceased: boolean, t: ReturnType<typeof useTranslations<'profile.ui'>>) {
    if (age == null) return undefined
    return isDeceased ? t('bio.ageAtDeath', { age }) : t('bio.age', { age })
}

export function ArtistBiography({ name, label, contentBefore, contentAfter, facts, age, zodiac, roleLabels, accent = '#e91e8c', bioQuote, semAnuncio = false }: Props) {
    const t = useTranslations('profile.ui')
    const locale = useLocale()
    // Com data de falecimento, `age` já vem congelado na morte — rotular como
    // idade atual seria errado.
    const ageDescription = buildAgeDescription(age, !!facts.deathDate, t)
    const factItems: FactItem[] = [
        facts.birthDate && {
            label: t('bio.birth'),
            value: formatDate(facts.birthDate, intlLocale(locale)),
            description: ageDescription,
        },
        facts.deathDate && { label: t('bio.death'), value: formatDate(facts.deathDate, intlLocale(locale)) },
        zodiac && { label: t('bio.zodiac'), value: `${zodiac.emoji} ${zodiac.sign}` },
        facts.birthPlace && { label: t('bio.origin'), value: facts.birthPlace },
        facts.height && { label: t('bio.height'), value: `${facts.height} cm` },
        facts.mbti && { label: 'MBTI', value: facts.mbti },
        facts.debutDate && { label: t('bio.debut'), value: formatDate(facts.debutDate, intlLocale(locale)) },
    ].filter(Boolean) as FactItem[]
    const primaryFacts = factItems.slice(0, 3)
    const secondaryFacts = factItems.slice(3)

    return (
        <div className="artist-bio">
            <div className="py-(--profile-section-block)">
                <BlockHeader eyebrow={label} title={t('whoIs', { name })} size="lg" tone="muted" className="profile-measure" />

                <div className="flex items-start gap-10">
                    <div className="min-w-0 flex-1 lg:max-w-none">
                        <div
                            className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline prose-img:rounded-none dark:prose-invert prose-a:hover:underline"
                            dangerouslySetInnerHTML={{ __html: highlightProse(contentBefore, name) }}
                        />

                        {/* Só insere anúncio se a bio tiver conteúdo suficiente após o corte (evita anúncio colado ao fim de bios curtas) */}
                        {!semAnuncio && contentAfter && ADSENSE.slots.inline && (
                            <div className="xl:hidden">
                                <AdSlotInline
                                    slot={ADSENSE.slots.inline}
                                    analyticsPlacement="artist_bio_mobile"
                                    // Espelha o `xl:hidden` do bloco: acima de 1280px quem
                                    // serve é o slot da coluna lateral, e pedir os dois
                                    // deixaria um deles oculto.
                                    mediaQuery="(max-width: 1279px)"
                                />
                            </div>
                        )}

                        {contentAfter && (
                            <CollapsibleProse label={t('bio.continueReading')}>
                                <div
                                    className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: highlightProse(contentAfter, name) }}
                                />
                            </CollapsibleProse>
                        )}

                        {bioQuote && (
                            <blockquote className="relative mt-8 overflow-hidden border-l-4 py-2 pl-6 sm:pl-8" style={{ borderColor: accent }}>
                                <span aria-hidden="true" className="pointer-events-none absolute -left-3 -top-6 select-none font-serif text-[130px] font-black leading-none sm:text-[170px]" style={{ color: accent, opacity: 0.12 }}>
                                    &ldquo;
                                </span>
                                <p className="relative font-serif text-[22px] font-bold leading-[1.28] tracking-[-0.02em] text-foreground sm:text-[30px]">
                                    {bioQuote.text}
                                </p>
                                <footer className="relative mt-4">
                                    <cite className="not-italic font-mono text-[11px] font-black uppercase tracking-widest" style={{ color: accent }}>
                                        {bioQuote.author}
                                    </cite>
                                    {bioQuote.context && <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-muted">{bioQuote.context}</span>}
                                </footer>
                            </blockquote>
                        )}
                    </div>

                    <aside className="hidden w-[300px] shrink-0 flex-col gap-5 xl:sticky xl:top-[calc(var(--site-header-h,52px)+var(--reading-bar-h,42px)+56px)] xl:flex">
                        {(primaryFacts.length > 0 || secondaryFacts.length > 0 || roleLabels.length > 0) && (
                            <div className="profile-panel p-4 sm:p-5">
                                {primaryFacts.length > 0 && (
                                    <>
                                        <p className="profile-kicker mb-4">{t('bio.keyFacts')}</p>
                                        <FactGrid items={primaryFacts} columns={1} variant="list" />
                                    </>
                                )}
                                {secondaryFacts.length > 0 && (
                                    <div className={primaryFacts.length > 0 ? 'mt-5 border-t border-border/70 pt-4' : ''}>
                                        <p className="profile-kicker mb-4">{t('bio.moreInfo')}</p>
                                        <FactGrid items={secondaryFacts} columns={1} variant="list" />
                                    </div>
                                )}
                                {roleLabels.length > 0 && (
                                    <div className={primaryFacts.length > 0 || secondaryFacts.length > 0 ? 'mt-5 border-t border-border/70 pt-4' : ''}>
                                        <p className="profile-kicker mb-3">{t('bio.acting')}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {roleLabels.map(r => (
                                                <span key={r} className="profile-chip">{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!semAnuncio && <ProfileSidebarAd analyticsPlacement="artist_bio_desktop" />}
                    </aside>
                </div>
            </div>
        </div>
    )
}
