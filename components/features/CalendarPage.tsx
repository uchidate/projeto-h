'use client'

import { intlLocale } from '@/lib/i18n/format'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Cake, Star, Search, X, Calendar } from 'lucide-react'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import type { CalendarEvent } from '@/app/(site)/calendario/page'

/* Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4
 * genre: editorial · macrostructure: Countdown Spine (agenda temporal)
 * hero: evento de hoje em tamanho real; sem evento hoje, o próximo com contagem
 * regressiva — a dobra nunca é só cabeçalho e números.
 *
 * O que esta página era antes: um dashboard. Fileira de quatro números, barra de
 * filtro, listas dentro de caixas, widgets na lateral. Trocando os rótulos,
 * viraria um CRM — nada nela dizia "calendário de k-pop". Pior, a dobra inteira
 * era título + estatísticas + um anúncio de 250px: nenhum evento aparecia sem
 * rolar, num produto cujo gancho é justamente "quem comemora hoje".
 *
 * O que ficou: proximidade é a informação, então proximidade manda no tamanho.
 * Hoje ocupa a dobra com o rosto grande. Os sete dias seguintes vêm numa lista
 * densa com a contagem em evidência. O resto desce para uma espinha mensal com
 * a data num trilho à esquerda — mesmo vocabulário dos perfis de artista.
 */

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type FilterType = 'all' | 'birthday' | 'debut'

interface Props {
    events: CalendarEvent[]
    todayStr: string
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Contagem regressiva em texto. O accent fica reservado ao que é urgente —
 *  hoje e amanhã. Depois disso a distância é informação neutra. */
function countdown(n: number): { text: string; urgent: boolean } {
    if (n === 0) return { text: 'Hoje', urgent: true }
    if (n === 1) return { text: 'Amanhã', urgent: true }
    return { text: `em ${n} dias`, urgent: false }
}

function typeLabel(ev: CalendarEvent) {
    return ev.type === 'birthday' ? 'Aniversário' : 'Debut'
}

function TypeMark({ type, size = 10 }: { type: CalendarEvent['type']; size?: number }) {
    return type === 'birthday'
        ? <Cake size={size} className="shrink-0" aria-hidden="true" />
        : <Star size={size} className="shrink-0" aria-hidden="true" />
}

// ─── Hero ────────────────────────────────────────────────────────────────────

/**
 * A dobra. Se há evento hoje, ele aparece em tamanho de manchete. Se não há,
 * o próximo evento assume o lugar com a contagem regressiva — antes, um dia sem
 * aniversário deixava o topo da página vazio de conteúdo, o que é o oposto do
 * que um calendário precisa fazer.
 */
function CalendarHero({ today, next }: { today: CalendarEvent[]; next: CalendarEvent | null }) {
    const isToday = today.length > 0
    const shown = isToday ? today.slice(0, 4) : next ? [next] : []
    const overflow = isToday ? today.length - shown.length : 0
    if (shown.length === 0) return null
    const [lead, ...rest] = shown

    return (
        <section className="border-t border-border pt-6">
            <div className="mb-5 flex items-baseline gap-3">
                <h2 className="font-mono text-[11px] font-black uppercase tracking-[0.16em] text-accent">
                    {isToday ? 'Hoje' : 'A seguir'}
                </h2>
                <p className="font-mono text-[11px] text-muted">
                    {isToday
                        ? `${today.length} ${today.length === 1 ? 'evento' : 'eventos'}`
                        : `${countdown(next!.daysUntil).text} · ${next!.day} de ${MONTH_SHORT[next!.month - 1]}`}
                </p>
            </div>

            {/* Díptico com trilho: o primeiro evento leva o retrato, os demais
                correm ao lado. Uma grade de quatro colunas deixava metade da
                largura vazia nos dias de um ou dois eventos — que é a maioria. */}
            <div className="grid items-start gap-8 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-12">
                <Link href={lead.href} className="group block">
                    <div className="relative aspect-square overflow-hidden bg-surface">
                        {lead.image ? (
                            <Image src={lead.image.src} alt={lead.name} fill priority
                                sizes="(max-width: 1024px) 100vw, 420px"
                                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-surface font-serif text-[80px] text-muted">
                                {lead.name.slice(0, 1)}
                            </div>
                        )}
                    </div>
                </Link>

                <div className="flex flex-col lg:pt-2">
                    <Link href={lead.href} className="group block">
                        <p className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                            <TypeMark type={lead.type} /> {typeLabel(lead)}
                        </p>
                        <p className="mt-2 font-serif text-[clamp(1.75rem,3.2vw,2.75rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent">
                            {lead.name}
                        </p>
                        {lead.extra && <p className="mt-2 text-[15px] text-muted">{lead.extra}</p>}
                        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted">
                            {lead.day} de {MONTH_NAMES[lead.month - 1].toLowerCase()}
                        </p>
                    </Link>

                    {rest.length > 0 && (
                        <div className="mt-8">
                            {rest.map(ev => <EventRow key={`${ev.type}-${ev.id}`} ev={ev} showCountdown={!isToday} />)}
                        </div>
                    )}

                    {overflow > 0 && (
                        <p className="mt-4 font-mono text-[11px] text-muted">
                            + {overflow} {overflow === 1 ? 'outro evento hoje' : 'outros eventos hoje'}, na lista abaixo
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}

// ─── EventRow ────────────────────────────────────────────────────────────────

/** Linha de evento sobre fio. As caixas saíram: cada linha tinha moldura, dentro
 *  de uma lista com moldura, com o avatar em mais uma moldura — três retângulos
 *  aninhados para um dado de uma linha. */
function EventRow({ ev, showDate = false, showCountdown = true }: { ev: CalendarEvent; showDate?: boolean; showCountdown?: boolean }) {
    const c = countdown(ev.daysUntil)
    return (
        <Link href={ev.href}
            className="group flex items-center gap-4 border-t border-border py-3 transition-colors hover:bg-surface/40">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-surface">
                {ev.image ? (
                    <Image src={ev.image.src} alt={ev.name} fill sizes="48px" className="object-cover object-top" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-[18px] text-muted">
                        {ev.name.slice(0, 1)}
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                {showDate && (
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                        {ev.day} de {MONTH_SHORT[ev.month - 1]}
                    </p>
                )}
                <p className="truncate text-[15px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent">
                    {ev.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                    <TypeMark type={ev.type} size={9} />
                    {ev.extra ?? typeLabel(ev)}
                </p>
            </div>
            {/* Dentro do bloco "Hoje" a contagem regressiva de cada linha diria
                "Hoje" de novo — o contexto já deu essa informação. */}
            {showCountdown && (
                <span className={`shrink-0 whitespace-nowrap font-mono text-[11px] font-black uppercase tracking-[0.08em] ${
                    c.urgent ? 'text-accent' : 'text-muted'
                }`}>
                    {c.text}
                </span>
            )}
        </Link>
    )
}

// ─── MiniCalendar ────────────────────────────────────────────────────────────

/** Aniversário e debut eram dois rosas quase idênticos — no tamanho de 4px os
 *  pontos ficavam indistinguíveis, e a legenda prometia uma diferença que o olho
 *  não achava. Agora a diferença é de forma: sólido contra anel. */
function MiniCalendar({ year, month, events, todayStr }: {
    year: number; month: number; events: CalendarEvent[]; todayStr: string
}) {
    const firstDow = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const birthdayDays = new Set(events.filter(e => e.type === 'birthday' && e.month === month && e.year === year).map(e => e.day))
    const debutDays = new Set(events.filter(e => e.type === 'debut' && e.month === month && e.year === year).map(e => e.day))
    const todayDate = new Date(todayStr)
    const todayDay = todayDate.getDate()
    const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() + 1 === month

    return (
        <div>
            <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                {MONTH_SHORT[month - 1]} {year}
            </p>
            <div className="mb-1 grid grid-cols-7">
                {WEEKDAYS_SHORT.map((d, i) => (
                    <div key={i} className="py-0.5 text-center font-mono text-[9px] text-muted/60">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isToday = isCurrentMonth && day === todayDay
                    return (
                        <div key={day} className="relative flex flex-col items-center pb-1">
                            <span className={`w-5 text-center font-mono text-[10px] leading-5 ${
                                isToday ? 'bg-accent-a11y font-bold text-white' : 'text-foreground/70'
                            }`}>{day}</span>
                            <div className="flex h-1.5 items-center gap-0.5">
                                {birthdayDays.has(day) && <div className="h-1 w-1 rounded-full bg-accent" />}
                                {debutDays.has(day) && <div className="h-1 w-1 rounded-full border border-foreground/70" />}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── MonthSection ────────────────────────────────────────────────────────────

/** Espinha mensal: a data mora num trilho à esquerda e os eventos correm à
 *  direita — o mesmo trilho assimétrico dos perfis de artista. */
function MonthSection({ monthKey, events }: { monthKey: string; events: CalendarEvent[] }) {
    const [monthNum, yearNum] = monthKey.split('-').map(Number)
    const byDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>()
        for (const ev of events) {
            const list = map.get(ev.date) ?? []
            list.push(ev)
            map.set(ev.date, list)
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    }, [events])

    return (
        <section id={`mes-${monthKey}`} className="mb-10 scroll-mt-24">
            <div className="mb-1 flex items-baseline gap-3 border-b-2 border-foreground pb-2">
                <h2 className="font-serif text-[1.5rem] font-medium leading-none text-foreground">
                    {MONTH_NAMES[monthNum - 1]}
                </h2>
                <span className="font-mono text-[11px] text-muted">{yearNum}</span>
                <span className="ml-auto font-mono text-[11px] text-muted">
                    {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                </span>
            </div>

            {byDate.map(([date, evs]) => {
                const d = new Date(date + 'T12:00:00')
                const dayNum = d.getDate()
                const weekday = d.toLocaleDateString(intlLocale(), { weekday: 'short' }).replace('.', '')
                return (
                    <div key={date} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-6">
                        <div className="border-t border-border pt-3">
                            <p className="font-mono text-[20px] font-black leading-none text-foreground sm:text-[26px]">
                                {String(dayNum).padStart(2, '0')}
                            </p>
                            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">{weekday}</p>
                        </div>
                        <div>
                            {evs.map(ev => <EventRow key={`${ev.type}-${ev.id}`} ev={ev} />)}
                        </div>
                    </div>
                )
            })}
        </section>
    )
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export function CalendarPage({ events, todayStr }: Props) {
    const [filter, setFilter] = useState<FilterType>('all')
    const [search, setSearch] = useState('')
    const [activeMonth, setActiveMonth] = useState<string | null>(null)
    const monthNavRef = useRef<HTMLDivElement>(null)

    const today = new Date(todayStr)
    const todayMonth = today.getMonth() + 1
    const todayYear = today.getFullYear()
    const nextMonthNum = todayMonth === 12 ? 1 : todayMonth + 1
    const nextMonthYear = todayMonth === 12 ? todayYear + 1 : todayYear

    const filtered = useMemo(() => {
        let list = events
        if (filter !== 'all') list = list.filter(e => e.type === filter)
        if (search.trim()) {
            const q = search.trim().toLowerCase()
            list = list.filter(e => e.name.toLowerCase().includes(q))
        }
        return list
    }, [events, filter, search])

    const todayEvents = filtered.filter(e => e.daysUntil === 0)
    // Sem evento hoje o hero mostra o próximo — a dobra nunca fica sem conteúdo.
    const nextEvent = todayEvents.length === 0
        ? [...filtered].sort((a, b) => a.daysUntil - b.daysUntil)[0] ?? null
        : null
    // ...e some das listas abaixo, senão o mesmo evento aparece duas vezes na
    // mesma tela: uma no hero e outra na lista, a poucos pixels de distância.
    const heroId = nextEvent ? `${nextEvent.type}-${nextEvent.id}` : null
    const notInHero = (e: CalendarEvent) => `${e.type}-${e.id}` !== heroId
    const weekEvents = filtered.filter(e => e.daysUntil >= 1 && e.daysUntil <= 7).filter(notInHero)
    const restEvents = filtered.filter(e => e.daysUntil > 7).filter(notInHero)
    // O hero já mostra até 4 de hoje; os demais não podem sumir da página.
    const todayOverflow = todayEvents.slice(4)

    const byMonth = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>()
        for (const ev of restEvents) {
            const key = `${ev.month}-${ev.year}`
            const list = map.get(key) ?? []
            list.push(ev)
            map.set(key, list)
        }
        return Array.from(map.entries()).sort((a, b) => {
            const [am, ay] = a[0].split('-').map(Number)
            const [bm, by] = b[0].split('-').map(Number)
            return ay !== by ? ay - by : am - bm
        })
    }, [restEvents])

    useEffect(() => {
        if (!activeMonth || !monthNavRef.current) return
        const btn = monthNavRef.current.querySelector(`[data-month="${activeMonth}"]`) as HTMLElement | null
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, [activeMonth])

    /* As estatísticas saíam de `events`, não de `filtered`: filtrar por
       Aniversários deixava "40 Debuts" na tela, contradizendo a lista logo
       abaixo. E "Esta semana" contava `daysUntil <= 7`, incluindo hoje, enquanto
       a seção de mesmo nome contava 1..7 — o cartão dizia 11 e a seção 9, na
       mesma tela. Agora ambos derivam do mesmo recorte e usam o mesmo rótulo. */
    const stats = useMemo(() => [
        { label: 'Hoje', value: filtered.filter(e => e.daysUntil === 0).length, accent: true },
        { label: 'Próximos 7 dias', value: filtered.filter(e => e.daysUntil >= 1 && e.daysUntil <= 7).length, accent: false },
        { label: 'Aniversários', value: filtered.filter(e => e.type === 'birthday').length, accent: false },
        { label: 'Debuts', value: filtered.filter(e => e.type === 'debut').length, accent: false },
    ], [filtered])

    const handleMonthClick = (key: string) => {
        setActiveMonth(key === activeMonth ? null : key)
        document.getElementById(`mes-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const filteredByMonth = activeMonth ? byMonth.filter(([k]) => k === activeMonth) : byMonth

    return (
        <div className="page-wrap py-8">

            {/* Cabeçalho */}
            <header className="mb-6">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                    Calendário K-Pop · próximos 90 dias
                </p>
                <h1 className="font-serif text-[clamp(2rem,1.35rem+3vw,3.25rem)] font-medium leading-[1.02] tracking-[-0.03em]">
                    Quem comemora agora
                </h1>
            </header>

            {/* Hero antes de qualquer anúncio: a dobra pertence ao conteúdo. */}
            <div className="mb-8">
                <CalendarHero today={todayEvents} next={nextEvent} />
            </div>

            {/* Filtros + busca */}
            <div className="mb-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-5">
                    {([
                        { value: 'all', label: 'Todos' },
                        { value: 'birthday', label: 'Aniversários' },
                        { value: 'debut', label: 'Debuts' },
                    ] as { value: FilterType; label: string }[]).map(f => (
                        <button key={f.value} type="button" aria-pressed={filter === f.value}
                            onClick={() => setFilter(f.value)}
                            className={`relative whitespace-nowrap pb-1 text-[13px] font-black transition-colors ${
                                filter === f.value
                                    ? 'text-foreground'
                                    : 'text-muted hover:text-foreground'
                            }`}>
                            {f.label}
                            {filter === f.value && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" />}
                        </button>
                    ))}
                </div>
                <div className="relative sm:ml-auto sm:w-64">
                    <Search size={14} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted" />
                    <input type="search" placeholder="Buscar idol ou grupo…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="h-9 w-full border-b border-border bg-transparent pl-6 pr-7 text-[13px] placeholder:text-muted focus:border-accent focus:outline-hidden" />
                    {search && (
                        <button type="button" title="Limpar busca" aria-label="Limpar busca" onClick={() => setSearch('')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Estatísticas — derivadas do mesmo recorte que as listas */}
            <div className="mb-8 grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                {stats.map(s => (
                    <div key={s.label} className={`border-t pt-3 ${s.accent ? 'border-accent' : 'border-border'}`}>
                        <p className={`font-mono text-[28px] font-black leading-none ${s.accent ? 'text-accent' : 'text-foreground'}`}>
                            {s.value}
                        </p>
                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">

                {/* ── Principal ── */}
                <div className="min-w-0">
                    {filtered.length === 0 ? (
                        <div className="border-t border-border py-16 text-center">
                            <Calendar size={28} className="mx-auto mb-3 text-muted opacity-40" />
                            <p className="text-[14px] text-muted">Nenhum evento encontrado.</p>
                        </div>
                    ) : (
                        <>
                            {todayOverflow.length > 0 && (
                                <section className="mb-10">
                                    <h2 className="mb-1 border-b-2 border-foreground pb-2 font-serif text-[1.5rem] font-medium leading-none">
                                        Também hoje
                                    </h2>
                                    {todayOverflow.map(ev => <EventRow key={`${ev.type}-${ev.id}`} ev={ev} showCountdown={false} />)}
                                </section>
                            )}

                            {weekEvents.length > 0 && (
                                <section className="mb-10">
                                    <div className="mb-1 flex items-baseline gap-3 border-b-2 border-foreground pb-2">
                                        <h2 className="font-serif text-[1.5rem] font-medium leading-none">Próximos 7 dias</h2>
                                        <span className="ml-auto font-mono text-[11px] text-muted">
                                            {weekEvents.length} {weekEvents.length === 1 ? 'evento' : 'eventos'}
                                        </span>
                                    </div>
                                    {weekEvents.map(ev => <EventRow key={`${ev.type}-${ev.id}`} ev={ev} showDate />)}
                                </section>
                            )}

                            {ADSENSE.slots.inline && (
                                <div className="mb-10">
                                    <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="calendar_feed" />
                                </div>
                            )}

                            {filteredByMonth.map(([key, evs]) => (
                                <MonthSection key={key} monthKey={key} events={evs} />
                            ))}
                        </>
                    )}
                </div>

                {/* ── Lateral ── */}
                <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--site-header-h,52px)+var(--reading-bar-h,42px)+16px)]">
                    {/* Navegação de mês: era um carrossel horizontal enterrado no
                        meio da lista, onde ninguém encontrava. Na lateral fixa ele
                        vira o que sempre foi — o índice da página. */}
                    {byMonth.length > 1 && (
                        <nav ref={monthNavRef} className="mb-8">
                            <p className="mb-3 border-t border-border pt-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                                Ir para
                            </p>
                            <ul>
                                {byMonth.map(([key, evs]) => {
                                    const [m, y] = key.split('-').map(Number)
                                    const active = activeMonth === key
                                    return (
                                        <li key={key}>
                                            <button type="button" data-month={key} aria-pressed={active}
                                                onClick={() => handleMonthClick(key)}
                                                className={`flex w-full items-baseline justify-between border-b border-border py-2 text-left transition-colors ${
                                                    active ? 'text-accent' : 'text-foreground/80 hover:text-foreground'
                                                }`}>
                                                <span className="text-[13px] font-bold">{MONTH_NAMES[m - 1]}</span>
                                                <span className="font-mono text-[11px] text-muted">{evs.length}</span>
                                                <span className="sr-only">{y}</span>
                                            </button>
                                        </li>
                                    )
                                })}
                            </ul>
                            {activeMonth && (
                                <button type="button" onClick={() => setActiveMonth(null)}
                                    className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted hover:text-foreground">
                                    ← Ver todos os meses
                                </button>
                            )}
                        </nav>
                    )}

                    {/* Dois meses, não três: o terceiro ocupava a lateral inteira
                        com dias de 9px que ninguém lê nem clica. */}
                    <div className="border-t border-border pt-3">
                        <p className="mb-4 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                            Visão do mês
                        </p>
                        <div className="space-y-5">
                            <MiniCalendar year={todayYear} month={todayMonth} events={events} todayStr={todayStr} />
                            <MiniCalendar year={nextMonthYear} month={nextMonthNum} events={events} todayStr={todayStr} />
                        </div>
                        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> Aniversário
                            </span>
                            <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-foreground/70" /> Debut
                            </span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
