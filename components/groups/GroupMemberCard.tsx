'use client'

import { useLocale, useTranslations } from 'next-intl'
import { intlLocale } from '@/lib/i18n/format'

import Image from 'next/image'
import Link from 'next/link'
import type { MemberSummary } from '@/lib/artists/memberSummary'
import { formatDate, getAge, getWPImage, parseAcfDate, stripHtml } from '@/lib/utils'
import { getZodiac } from '@/lib/artists/zodiac'
import { POSITION_LABELS } from '@/lib/constants/positions'
import { toRgba } from '@/lib/theme/color'

const ROLE_KEYS = { singer: 1, actor: 1, rapper: 1, dancer: 1, model: 1, host: 1, composer: 1 } as const

/** Data do ACF só quando parseável — evita "Invalid Date" e idade NaN na ficha. */
function parseValidDate(value?: string) {
    if (!value) return null
    const parsed = parseAcfDate(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildAgeLabel(age: number | null, isDeceased: boolean, tc: ReturnType<typeof useTranslations<'client'>>) {
    if (age == null) return null
    return isDeceased ? tc('member.ageAtDeath', { age }) : tc('member.age', { age })
}

export function GroupMemberCard({ member, accent, positions, isFormer }: { member: MemberSummary; accent: string; positions?: string[]; isFormer?: boolean }) {
    const tc = useTranslations('client')
    const locale = useLocale()
    const name = stripHtml(member.title.rendered)
    const image = getWPImage(member._embedded, member.featured_image_url, name)
    const rawBirthDate = member.acf?.birth_date
    const birthDate = parseValidDate(rawBirthDate)
    // Membro falecido: a idade para na morte, mesma regra do perfil individual.
    const deathDate = parseValidDate(member.acf?.death_date)
    const age = getAge(rawBirthDate, deathDate ?? undefined)
    const ageLabel = buildAgeLabel(age, deathDate != null, tc)
    const zodiac = rawBirthDate ? getZodiac(rawBirthDate) : null
    const roles = (member.acf?.roles ?? []).slice(0, 2).map(role => (role in ROLE_KEYS ? tc(`member.role.${role as keyof typeof ROLE_KEYS}`) : role))
    // posições canônicas dentro do grupo (leader, visual, maknae, ...) têm prioridade sobre a profissão genérica
    const positionLabels = (positions ?? []).map(position => POSITION_LABELS[position] ?? position)
    const displayRole = positionLabels.length > 0 ? positionLabels.join(' · ') : (roles[0] ?? null)

    return (
        <Link href={`/artists/${member.slug}`} className="group block focus-visible:outline-offset-4">
            <div
                className={`member-card-border relative mb-2 aspect-3/4 overflow-hidden border bg-surface transition-all duration-300 ${isFormer ? 'border-border/40 opacity-70 grayscale-30' : 'border-border'}`}
                style={{ '--member-accent': accent } as React.CSSProperties}
            >
                {image ? (
                    <Image
                        src={image.src}
                        alt={image.alt || name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div
                        className="flex h-full items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${toRgba(accent, 0.35)}, ${toRgba(accent, 0.08)})` }}
                    >
                        <span className="text-5xl font-black text-white/80">{name.charAt(0)}</span>
                    </div>
                )}

                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/5 to-transparent opacity-70 transition-opacity group-hover:opacity-95" />

                {(zodiac || member.blood_type) && (
                    <span
                        className="absolute left-2 top-2 flex items-center gap-1 border border-white/20 bg-black/45 px-1.5 py-1 text-sm leading-none text-white backdrop-blur-xs"
                        title={zodiac ? `${zodiac.sign}${member.blood_type ? ` · Tipo ${member.blood_type}` : ''}` : `Tipo ${member.blood_type}`}
                    >
                        {zodiac?.emoji}
                        {zodiac && member.blood_type && <span className="text-white/30 text-[10px]">·</span>}
                        {member.blood_type && (
                            <span className="font-mono text-[10px] font-black">{member.blood_type}</span>
                        )}
                    </span>
                )}

                {/* Hover overlay: detailed info */}
                <div
                    className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                    style={{ background: `linear-gradient(to top, ${toRgba(accent, 0.92)}, transparent)` }}
                >
                    {ageLabel && (
                        <p className="font-mono text-[10px] font-bold text-white">
                            {ageLabel}{member.acf?.height ? ` · ${member.acf.height} cm` : ''}
                        </p>
                    )}
                    {birthDate && (
                        <p className="mt-0.5 font-mono text-[10px] leading-4 text-white/80">
                            {formatDate(birthDate, intlLocale(locale))}
                            {deathDate && ` — ${formatDate(deathDate, intlLocale(locale))}`}
                        </p>
                    )}
                </div>
            </div>

            {/* Always visible info */}
            <div className="flex items-start justify-between gap-1 mt-0.5">
                <h3 className="text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-accent">
                    {name}
                </h3>
                {isFormer && (
                    <span className="mt-0.5 shrink-0 border border-border px-1.5 py-0.5 font-mono text-[10px] font-black uppercase leading-3 tracking-wider text-muted">
                        ex
                    </span>
                )}
            </div>
            {member.acf?.name_hangul && (
                <p className="text-xs leading-5 text-muted">{member.acf.name_hangul}</p>
            )}
            {(ageLabel || displayRole) && (
                <p className="mt-0.5 font-mono text-[11px] leading-[1.45] text-muted">
                    {ageLabel ?? ''}
                    {ageLabel && displayRole ? ' · ' : ''}
                    {displayRole ?? ''}
                </p>
            )}
        </Link>
    )
}
