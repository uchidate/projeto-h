'use client'

import { useTranslations } from 'next-intl'
/* eslint-disable react-hooks/set-state-in-effect -- anonymous votes hydrate from localStorage */

import Image from 'next/image'
import { useState, useEffect } from 'react'
import type { MemberSummary } from '@/lib/artists/memberSummary'
import { getWPImage, stripHtml } from '@/lib/utils'
import { toRgba } from '@/lib/theme/color'

interface Props {
    members: MemberSummary[]
    accent: string
    groupName: string
    groupSlug: string
}

export function GroupMemberVote({ members, accent, groupName, groupSlug }: Props) {
    const tc = useTranslations('client')
    const storageKey = `oc_vote_${groupSlug}`
    const countsKey = `oc_vote_counts_${groupSlug}`

    const [voted, setVoted] = useState<number | null>(null)
    const [counts, setCounts] = useState<Record<number, number>>({})
    const [ready, setReady] = useState(false)
    const [justVoted, setJustVoted] = useState(false)

    useEffect(() => {
        const storedVote = localStorage.getItem(storageKey)
        const storedCounts = localStorage.getItem(countsKey)
        const parsedCounts: Record<number, number> = storedCounts ? JSON.parse(storedCounts) : {}
        if (Object.keys(parsedCounts).length === 0) {
            members.forEach(m => { parsedCounts[m.id] = Math.floor(Math.random() * 60 + 10) })
            localStorage.setItem(countsKey, JSON.stringify(parsedCounts))
        }
        setCounts(parsedCounts)
        if (storedVote) setVoted(Number(storedVote))
        setReady(true)
    }, [storageKey, countsKey, members])

    function handleVote(memberId: number) {
        if (voted !== null) return
        const newCounts = { ...counts, [memberId]: (counts[memberId] ?? 0) + 1 }
        setCounts(newCounts)
        setVoted(memberId)
        setJustVoted(true)
        localStorage.setItem(storageKey, String(memberId))
        localStorage.setItem(countsKey, JSON.stringify(newCounts))
    }

    if (!ready || members.length === 0) return null

    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const votedMember = voted !== null ? members.find(m => m.id === voted) : null
    const votedName = votedMember ? stripHtml(votedMember.title.rendered) : ''

    const ranked = [...members].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    const topMember = ranked[0]

    return (
        <section id="votacao" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <div className="mb-5 border-b border-foreground pb-3">
                <p className="font-mono text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-muted">Fandom</p>
                <h2 className="text-xl font-black tracking-[-0.03em]">
                    {voted === null
                        ? tc('vote.question', { group: groupName })
                        : tc('vote.voted', { name: votedName ?? '' })}
                </h2>
            </div>

            {voted === null ? (
                <div className="flex gap-3 overflow-x-auto snap-x pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {members.map(member => {
                        const mName = stripHtml(member.title.rendered)
                        const img = getWPImage(member._embedded, member.featured_image_url, mName)
                        return (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => handleVote(member.id)}
                                className="group shrink-0 snap-start w-[120px] text-left focus:outline-hidden"
                            >
                                <div className="relative aspect-3/4 overflow-hidden border border-border transition-all duration-200 group-hover:border-foreground/50">
                                    {img ? (
                                        <Image src={img.src} alt={mName} fill sizes="120px"
                                            className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"
                                            style={{ background: toRgba(accent, 0.12) }}>
                                            <span className="text-4xl font-black" style={{ color: accent }}>{mName[0]}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                                    {/* CTA overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        style={{ background: toRgba(accent, 0.82) }}>
                                        <span className="text-2xl">♡</span>
                                        <span className="font-mono text-[11px] font-black uppercase tracking-widest text-white">
                                            {tc('vote.vote')}
                                        </span>
                                    </div>

                                    {/* Name always visible at bottom */}
                                    <div className="absolute inset-x-0 bottom-0 p-2.5 group-hover:opacity-0 transition-opacity">
                                        <p className="text-[13px] font-bold text-white leading-tight">{mName}</p>
                                        {member.acf?.name_hangul && (
                                            <p className="font-mono text-[10px] text-white/70">{member.acf.name_hangul}</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            ) : (
                <div>
                    {/* Winner spotlight */}
                    {justVoted && topMember && (
                        <div className="mb-4 flex items-center gap-3 p-4 border"
                            style={{ background: toRgba(accent, 0.1), borderColor: toRgba(accent, 0.4) }}>
                            {(() => {
                                const n = stripHtml(topMember.title.rendered)
                                const img = getWPImage(topMember._embedded, topMember.featured_image_url, n)
                                return (
                                    <>
                                        <div className="relative w-12 h-12 shrink-0 overflow-hidden"
                                            style={{ boxShadow: `0 0 0 2px ${accent}` }}>
                                            {img ? (
                                                <Image src={img.src} alt={n} fill sizes="48px" className="object-cover object-top" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"
                                                    style={{ background: toRgba(accent, 0.2) }}>
                                                    <span className="font-black" style={{ color: accent }}>{n[0]}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-mono text-[10px] uppercase leading-4 tracking-widest" style={{ color: accent }}>
                                                {tc('vote.thanks')}
                                            </p>
                                            <p className="font-bold text-sm text-foreground">{tc('vote.favorite', { name: votedName ?? '' })}</p>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    )}

                    {/* Ranking */}
                    <div className="flex flex-col divide-y divide-border border border-border">
                        {ranked.map((member, idx) => {
                            const mName = stripHtml(member.title.rendered)
                            const img = getWPImage(member._embedded, member.featured_image_url, mName)
                            const count = counts[member.id] ?? 0
                            const pct = total > 0 ? Math.round((count / total) * 100) : 0
                            const isVoted = member.id === voted
                            const rank = idx + 1
                            const isFirst = rank === 1

                            return (
                                <div key={member.id}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                                    style={{
                                        background: isVoted ? toRgba(accent, 0.08) : undefined,
                                        borderLeft: isVoted ? `3px solid ${accent}` : '3px solid transparent',
                                    }}>
                                    {/* Rank */}
                                    <span className="font-mono text-[11px] font-black w-7 shrink-0 text-center"
                                        style={{ color: isFirst ? accent : 'var(--color-muted)' }}>
                                        {isFirst ? '★' : `#${rank}`}
                                    </span>

                                    {/* Avatar */}
                                    <div className="relative w-10 h-10 shrink-0 overflow-hidden"
                                        style={isFirst ? { boxShadow: `0 0 0 2px ${accent}` } : undefined}>
                                        {img ? (
                                            <Image src={img.src} alt={mName} fill sizes="40px" className="object-cover object-top" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"
                                                style={{ background: toRgba(accent, 0.15) }}>
                                                <span className="text-sm font-black" style={{ color: accent }}>{mName[0]}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Name + bar */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold truncate leading-tight">{mName}</p>
                                        <div className="mt-1.5 h-1.5 bg-border overflow-hidden">
                                            <div className="h-full transition-all duration-700 ease-out"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: isVoted ? accent : toRgba(accent, 0.35),
                                                }} />
                                        </div>
                                    </div>

                                    {/* Percent */}
                                    <span className="font-mono text-[14px] font-black shrink-0 tabular-nums"
                                        style={{ color: isVoted ? accent : 'var(--color-muted)' }}>
                                        {pct}%
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <p className="mt-3 text-center font-mono text-[10px] uppercase leading-4 tracking-widest text-muted">
                {voted !== null
                    ? tc('vote.total', { count: total })
                    : tc('vote.onePerDevice')}
            </p>
        </section>
    )
}
