'use client'

import { intlLocale } from '@/lib/i18n/format'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { BookmarkCheck, BookOpen, Calendar, CheckCircle2, Compass, Heart, Mic2, Pencil, Save, ShieldCheck, Sparkles, Trophy, Users, X } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { getNotificationPreferences, updateNotificationPreferences, updateProfile, type NotificationPreferences } from '@/lib/wordpress/userApi'
import { buildUserAchievements } from '@/lib/userJourney'
import { tinta, contorno } from '@/lib/fandoms/cor'
import type { Locale } from '@/lib/i18n/config'
import { textosDaConquista } from '@/lib/conta/conquistas'
import { IndicadorDaConta, CartaoDeAtalho } from '@/components/conta/AtalhosDaConta'

export interface TorcidaDoPerfil { slug: string; nome: string; cor: string; grupo: string }

interface Props {
    user: { name: string; email: string; image: string | null; bio: string }
    stats: {
        favoritesCount: number
        watchlistCount: number
        joinDate: string
        profileCompletion?: number
        profileTasks?: { label: string; done: boolean }[]
        contentCounts?: { production: number; artist: number; group: number; post: number }
        contentStateCounts?: { favorite: number; following: number; saved: number; read: number }
    }
    /** Torcidas cujo grupo o usuário segue na conta — é a mesma marcação de /fandoms, não um dado à parte. */
    torcidas?: TorcidaDoPerfil[]
}

export function PerfilClient({ user, stats, torcidas = [] }: Props) {
    const router = useRouter()
    const t = useTranslations('client.conta.perfil')
    const tc = useTranslations('client.conta')
    const locale = useLocale()
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(user.name)
    const [bio, setBio] = useState(user.bio)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
    const [savingPrefs, setSavingPrefs] = useState(false)

    const memberSince = stats.joinDate
        ? new Date(stats.joinDate).toLocaleDateString(intlLocale(locale as Locale), { month: 'long', year: 'numeric' })
        : null
    const followedArtists = stats.contentCounts?.artist ?? 0
    const followedGroups = stats.contentCounts?.group ?? 0
    const savedReadings = stats.contentStateCounts?.saved ?? 0
    const readArticles = stats.contentStateCounts?.read ?? 0
    const followingCount = followedArtists + followedGroups
    const fallbackProfileTasks = [
        { label: t('task.name'), done: name.trim().length > 0 },
        { label: t('task.bio'), done: bio.trim().length >= 20 },
        { label: t('task.favorite'), done: stats.favoritesCount > 0 },
        { label: t('task.want'), done: stats.watchlistCount > 0 },
        { label: t('task.follow'), done: followingCount > 0 },
        { label: t('task.reading'), done: savedReadings > 0 || readArticles > 0 },
        { label: t('task.fandom'), done: torcidas.length > 0 },
    ]
    const profileTasks = fallbackProfileTasks
    const completedTasks = profileTasks.filter(task => task.done).length
    const completion = Math.round((completedTasks / profileTasks.length) * 100)

    const achievements = buildUserAchievements(stats)
    const unlockedAchievements = achievements.filter(a => a.done).length

    useEffect(() => {
        getNotificationPreferences()
            .then(setNotificationPrefs)
            .catch(() => null)
    }, [])

    async function handleNotificationPreference(key: keyof NotificationPreferences, value: boolean) {
        if (!notificationPrefs) return
        const next = { ...notificationPrefs, [key]: value }
        setNotificationPrefs(next)
        setSavingPrefs(true)
        try {
            const saved = await updateNotificationPreferences(null, { [key]: value })
            setNotificationPrefs(saved)
        } catch {
            setNotificationPrefs(notificationPrefs)
        } finally {
            setSavingPrefs(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        setError('')
        try {
            await updateProfile(null, { name, bio })
            setEditing(false)
            router.refresh()
        } catch {
            setError(t('saveError'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="page-wrap py-8 lg:py-12">
            {/* Header */}
            <div className="mb-8 border border-border bg-surface">
                <div className="p-6 sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        {/* Avatar */}
                        <div className="shrink-0">
                            {user.image ? (
                                <Image src={user.image} alt={user.name} width={96} height={96} className="object-cover border border-border" />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center bg-accent-a11y text-4xl font-black text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Info / Edit */}
                        <div className="flex-1 min-w-0">
                            {editing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="perfil-nome" className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1">{t('name')}</label>
                                        <input
                                            id="perfil-nome"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-accent focus:outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="perfil-bio" className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1">{t('bio')}</label>
                                        <textarea
                                            id="perfil-bio"
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                            rows={3}
                                            maxLength={200}
                                            className="w-full border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-accent focus:outline-hidden resize-none"
                                            placeholder={t('bioPlaceholder')}
                                        />
                                        <p className="text-[10px] text-muted text-right">{bio.length}/200</p>
                                    </div>
                                    {error && <p className="text-[13px] text-red-500">{error}</p>}
                                    <div className="flex gap-2">
                                        <button type="button" onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-1.5 bg-accent-a11y px-4 py-2 text-[12px] font-black text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                                            <Save size={13} /> {saving ? t('saving') : t('save')}
                                        </button>
                                        <button type="button" onClick={() => { setEditing(false); setName(user.name); setBio(user.bio) }}
                                            className="flex items-center gap-1.5 border border-border px-4 py-2 text-[12px] font-black text-muted hover:border-foreground hover:text-foreground transition-colors">
                                            <X size={13} /> {t('cancel')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent mb-1">{tc('common.profile')}</p>
                                    <h1 className="text-[28px] font-black leading-tight tracking-tight mb-1">
                                        {name}<BrandDot />
                                    </h1>
                                    <p className="text-[13px] text-muted mb-3">{user.email}</p>
                                    {bio ? (
                                        <p className="text-[14px] text-foreground/70 leading-relaxed max-w-lg mb-4">{bio}</p>
                                    ) : (
                                        <p className="text-[13px] text-muted italic mb-4">{t('noBio')}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button type="button" onClick={() => setEditing(true)}
                                            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-black text-muted hover:border-accent hover:text-accent transition-colors">
                                            <Pencil size={12} /> {t('edit')}
                                        </button>
                                        {memberSince && (
                                            <span className="flex items-center gap-1.5 text-[12px] text-muted">
                                                <Calendar size={12} /> {t('memberSince', { date: memberSince })}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Stats + Links */}
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <IndicadorDaConta href="/minhas-listas?tab=favoritos" icone={Heart} valor={stats.favoritesCount} rotulo={t('favorites')} />
                        <IndicadorDaConta href="/minhas-listas?tab=lista" icone={BookmarkCheck} classeIcone="text-foreground" valor={stats.watchlistCount} rotulo={t('want')} />
                        <IndicadorDaConta href="/dashboard" valor={tc('common.wave')} rotulo={t('overview')} />
                        <IndicadorDaConta href="/artists" icone={Mic2} valor={followingCount} rotulo={t('following')} />
                        <IndicadorDaConta href="/dashboard#leituras-salvas" icone={BookOpen} valor={savedReadings + readArticles} rotulo={t('readings')} />
                    </div>

                    <section className="bg-[#15102b] p-6 sm:p-7">
                        <div className="flex flex-wrap items-baseline justify-between gap-3">
                            <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-extrabold text-white">{t('fandomsTitle')}</h2>
                            <Link href="/fandoms" className="text-[12px] font-bold text-[#c9c2ee] underline underline-offset-2 hover:text-white">{t('fandomsManage')}</Link>
                        </div>
                        {torcidas.length > 0 ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {torcidas.map(f => {
                                    const ink = tinta(f.cor)
                                    return (
                                        <Link key={f.slug} href={`/fandoms/${f.slug}`} className={`block p-4 transition-transform hover:-translate-y-0.5 ${contorno(f.cor)}`} style={{ background: f.cor, color: ink }}>
                                            <p className="text-[11px] font-black uppercase tracking-[0.08em]">{f.grupo}</p>
                                            <p className="mt-1 font-[family-name:var(--font-playfair)] text-[26px] font-extrabold leading-none">{f.nome}</p>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="mt-4 text-[13px] leading-relaxed text-[#c9c2ee]">
                                {t('fandomsEmptyA')} <Link href="/fandoms" className="font-bold text-white underline">{t('fandomsEmptyLink')}</Link> {t('fandomsEmptyB')}
                            </p>
                        )}
                    </section>

                    <section className="border border-border bg-surface p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">{t('personalized')}</p>
                                <h2 className="mt-1 text-[20px] font-black tracking-tight">{t('completeTitle')}</h2>
                                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
                                    {t('completeDesc')}
                                </p>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                                <span className="block text-[28px] font-black leading-none text-foreground">{completion}%</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">{t('completePct')}</span>
                            </div>
                        </div>
                        <div className="mb-4 h-2 overflow-hidden bg-background">
                            <div className="h-full bg-accent transition-all" style={{ width: `${completion}%` }} />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {profileTasks.map(task => (
                                <div key={task.label} className="flex items-center gap-2 border border-border bg-background p-3">
                                    {task.done ? (
                                        <CheckCircle2 size={15} className="shrink-0 text-accent" />
                                    ) : (
                                        <span className="h-3.5 w-3.5 shrink-0 border border-border" />
                                    )}
                                    <span className={`text-[12px] font-bold ${task.done ? 'text-foreground' : 'text-muted'}`}>{task.label}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                        <CartaoDeAtalho href="/productions" icone={Compass} titulo={t('cta.discover')} descricao={t('cta.discoverDesc')} />
                        <CartaoDeAtalho href="/blog" icone={Sparkles} titulo={t('cta.guides')} descricao={t('cta.guidesDesc')} />
                        <CartaoDeAtalho href="/groups" icone={Users} titulo={t('cta.groups')} descricao={t('cta.groupsDesc')} />
                        <CartaoDeAtalho href="/artists" icone={Mic2} titulo={t('cta.artists')} descricao={t('cta.artistsDesc')} />
                    </section>
                </div>

                {/* Conquistas */}
                <aside className="space-y-4">
                    <div className="border border-border bg-surface p-4">
                        <div className="mb-3 flex items-end justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">{t('achievements')}</p>
                                <p className="mt-1 text-[12px] text-muted">{t('unlocked', { done: unlockedAchievements, total: achievements.length })}</p>
                            </div>
                            <span className="text-[22px] font-black leading-none text-accent">{unlockedAchievements}</span>
                        </div>
                        <Link href="/conquistas" className="mb-3 flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-[11px] font-black uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent">
                            <Trophy size={13} /> {t('howTo')}
                        </Link>
                        <div className="space-y-2">
                            {achievements.slice(0, 6).map(a0 => {
                                const a = { ...a0, ...textosDaConquista(tc, a0.id) }
                                return (
                                <Link key={a.id} href={a.href} className={`block border p-2.5 transition-colors hover:border-accent/50 ${a.done ? 'border-accent/35 bg-background' : 'border-border bg-background'}`}>
                                    <div className="flex items-start gap-2.5">
                                        <span className={`mt-0.5 text-[14px] font-black ${a.done ? 'text-accent' : 'text-muted'}`}>
                                            {a.done ? '★' : '☆'}
                                        </span>
                                        <span>
                                            <span className="block text-[12px] font-black text-foreground">{a.label}</span>
                                            <span className="text-[11px] text-muted">{a.desc}</span>
                                            <span className="mt-1 block text-[10px] font-bold text-muted">
                                                {Math.min(a.current, a.target)}/{a.target}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden bg-surface">
                                        <div className="h-full bg-accent" style={{ width: `${a.progress}%` }} />
                                    </div>
                                </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div className="border border-border bg-surface p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <ShieldCheck size={15} className="text-accent" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">{t('synced')}</p>
                        </div>
                        <p className="text-[13px] leading-relaxed text-muted">
                            {t('syncedDesc')}
                        </p>
                    </div>

                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">{t('notifications')}</p>
                        <p className="mb-3 text-[12px] leading-relaxed text-muted">
                            {t('notificationsDesc')}
                        </p>
                        <div className="space-y-2">
                            {([
                                { key: 'savedReadings', label: t('notifSaved'), desc: t('notifSavedDesc') },
                                { key: 'watching', label: t('notifWatching'), desc: t('notifWatchingDesc') },
                            ] as const).map(item => (
                                <label key={item.key} className="flex cursor-pointer items-start justify-between gap-3 border border-border bg-background p-3">
                                    <span>
                                        <span className="block text-[12px] font-black text-foreground">{item.label}</span>
                                        <span className="text-[11px] leading-snug text-muted">{item.desc}</span>
                                    </span>
                                    <input
                                        type="checkbox"
                                        disabled={!notificationPrefs || savingPrefs}
                                        checked={notificationPrefs?.[item.key] ?? true}
                                        onChange={event => handleNotificationPreference(item.key, event.target.checked)}
                                        className="mt-1 h-4 w-4 accent-accent"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    )
}
