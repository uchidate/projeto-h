'use client'

import { intlLocale } from '@/lib/i18n/format'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookmarkCheck, BookOpen, Calendar, CheckCircle2, Compass, Heart, Mic2, Pencil, Save, ShieldCheck, Sparkles, Trophy, Users, X } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { getNotificationPreferences, updateNotificationPreferences, updateProfile, type NotificationPreferences } from '@/lib/wordpress/userApi'
import { buildUserAchievements } from '@/lib/userJourney'

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
}

export function PerfilClient({ user, stats }: Props) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(user.name)
    const [bio, setBio] = useState(user.bio)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
    const [savingPrefs, setSavingPrefs] = useState(false)

    const memberSince = stats.joinDate
        ? new Date(stats.joinDate).toLocaleDateString(intlLocale(), { month: 'long', year: 'numeric' })
        : null
    const followedArtists = stats.contentCounts?.artist ?? 0
    const followedGroups = stats.contentCounts?.group ?? 0
    const savedReadings = stats.contentStateCounts?.saved ?? 0
    const readArticles = stats.contentStateCounts?.read ?? 0
    const followingCount = followedArtists + followedGroups
    const fallbackProfileTasks = [
        { label: 'Nome visível', done: name.trim().length > 0 },
        { label: 'Bio preenchida', done: bio.trim().length >= 20 },
        { label: 'Primeiro favorito', done: stats.favoritesCount > 0 },
        { label: 'Lista Quero ver', done: stats.watchlistCount > 0 },
        { label: 'Seguir artista ou grupo', done: followingCount > 0 },
        { label: 'Salvar uma leitura', done: savedReadings > 0 || readArticles > 0 },
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
            setError('Erro ao salvar. Tente novamente.')
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
                                        <label htmlFor="perfil-nome" className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1">Nome</label>
                                        <input
                                            id="perfil-nome"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-accent focus:outline-hidden"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="perfil-bio" className="block text-[10px] font-black uppercase tracking-wider text-muted mb-1">Bio</label>
                                        <textarea
                                            id="perfil-bio"
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                            rows={3}
                                            maxLength={200}
                                            className="w-full border border-border bg-background px-3 py-2 text-[14px] text-foreground focus:border-accent focus:outline-hidden resize-none"
                                            placeholder="Uma frase sobre você e seus gostos..."
                                        />
                                        <p className="text-[10px] text-muted text-right">{bio.length}/200</p>
                                    </div>
                                    {error && <p className="text-[13px] text-red-500">{error}</p>}
                                    <div className="flex gap-2">
                                        <button type="button" onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-1.5 bg-accent-a11y px-4 py-2 text-[12px] font-black text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                                            <Save size={13} /> {saving ? 'Salvando…' : 'Salvar'}
                                        </button>
                                        <button type="button" onClick={() => { setEditing(false); setName(user.name); setBio(user.bio) }}
                                            className="flex items-center gap-1.5 border border-border px-4 py-2 text-[12px] font-black text-muted hover:border-foreground hover:text-foreground transition-colors">
                                            <X size={13} /> Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent mb-1">Perfil</p>
                                    <h1 className="text-[28px] font-black leading-tight tracking-tight mb-1">
                                        {name}<BrandDot />
                                    </h1>
                                    <p className="text-[13px] text-muted mb-3">{user.email}</p>
                                    {bio ? (
                                        <p className="text-[14px] text-foreground/70 leading-relaxed max-w-lg mb-4">{bio}</p>
                                    ) : (
                                        <p className="text-[13px] text-muted italic mb-4">Nenhuma bio ainda.</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button type="button" onClick={() => setEditing(true)}
                                            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[12px] font-black text-muted hover:border-accent hover:text-accent transition-colors">
                                            <Pencil size={12} /> Editar perfil
                                        </button>
                                        {memberSince && (
                                            <span className="flex items-center gap-1.5 text-[12px] text-muted">
                                                <Calendar size={12} /> Membro desde {memberSince}
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
                        <Link href="/minhas-listas?tab=favoritos"
                            className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
                            <Heart size={18} className="text-accent shrink-0" />
                            <span>
                                <span className="block text-[24px] font-black leading-none">{stats.favoritesCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Favoritos</span>
                            </span>
                        </Link>
                        <Link href="/minhas-listas?tab=lista"
                            className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
                            <BookmarkCheck size={18} className="text-foreground shrink-0" />
                            <span>
                                <span className="block text-[24px] font-black leading-none">{stats.watchlistCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Quero ver</span>
                            </span>
                        </Link>
                        <Link href="/dashboard"
                            className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
                            <span className="text-[22px] font-black leading-none text-foreground">↗</span>
                            <span>
                                <span className="block text-[14px] font-black">Minha Onda</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Visão geral</span>
                            </span>
                        </Link>
                        <Link href="/artists"
                            className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
                            <Mic2 size={18} className="text-accent shrink-0" />
                            <span>
                                <span className="block text-[24px] font-black leading-none">{followingCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Acompanhando</span>
                            </span>
                        </Link>
                        <Link href="/dashboard#leituras-salvas"
                            className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
                            <BookOpen size={18} className="text-accent shrink-0" />
                            <span>
                                <span className="block text-[24px] font-black leading-none">{savedReadings + readArticles}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Leituras</span>
                            </span>
                        </Link>
                    </div>

                    <section className="border border-border bg-surface p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">Experiência personalizada</p>
                                <h2 className="mt-1 text-[20px] font-black tracking-tight">Complete seu perfil</h2>
                                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">
                                    Esses sinais ajudam a transformar sua conta em uma área útil para acompanhar dramas, K-pop, artistas e leituras.
                                </p>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                                <span className="block text-[28px] font-black leading-none text-foreground">{completion}%</span>
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">completo</span>
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
                        <Link href="/productions" className="group flex items-center gap-3 border border-border bg-surface p-4 transition-colors hover:border-accent/50">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
                                <Compass size={18} />
                            </span>
                            <span>
                                <span className="block text-[14px] font-black group-hover:text-accent">Descobrir produções</span>
                                <span className="text-[12px] text-muted">Encontre o próximo título para salvar.</span>
                            </span>
                        </Link>
                        <Link href="/blog" className="group flex items-center gap-3 border border-border bg-surface p-4 transition-colors hover:border-accent/50">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
                                <Sparkles size={18} />
                            </span>
                            <span>
                                <span className="block text-[14px] font-black group-hover:text-accent">Ler guias e listas</span>
                                <span className="text-[12px] text-muted">Use a curadoria para decidir melhor.</span>
                            </span>
                        </Link>
                        <Link href="/groups" className="group flex items-center gap-3 border border-border bg-surface p-4 transition-colors hover:border-accent/50">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
                                <Users size={18} />
                            </span>
                            <span>
                                <span className="block text-[14px] font-black group-hover:text-accent">Acompanhar grupos</span>
                                <span className="text-[12px] text-muted">Conecte fandoms, membros e artigos.</span>
                            </span>
                        </Link>
                        <Link href="/artists" className="group flex items-center gap-3 border border-border bg-surface p-4 transition-colors hover:border-accent/50">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-accent/10 text-accent">
                                <Mic2 size={18} />
                            </span>
                            <span>
                                <span className="block text-[14px] font-black group-hover:text-accent">Seguir artistas</span>
                                <span className="text-[12px] text-muted">Acompanhe perfis, grupos e filmografia.</span>
                            </span>
                        </Link>
                    </section>
                </div>

                {/* Conquistas */}
                <aside className="space-y-4">
                    <div className="border border-border bg-surface p-4">
                        <div className="mb-3 flex items-end justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Conquistas</p>
                                <p className="mt-1 text-[12px] text-muted">{unlockedAchievements}/{achievements.length} desbloqueadas</p>
                            </div>
                            <span className="text-[22px] font-black leading-none text-accent">{unlockedAchievements}</span>
                        </div>
                        <Link href="/conquistas" className="mb-3 flex items-center justify-center gap-2 border border-border bg-background px-3 py-2 text-[11px] font-black uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent">
                            <Trophy size={13} /> Como obter
                        </Link>
                        <div className="space-y-2">
                            {achievements.slice(0, 6).map(a => (
                                <Link key={a.label} href={a.href} className={`block border p-2.5 transition-colors hover:border-accent/50 ${a.done ? 'border-accent/35 bg-background' : 'border-border bg-background'}`}>
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
                            ))}
                        </div>
                    </div>

                    <div className="border border-border bg-surface p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <ShieldCheck size={15} className="text-accent" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">Conta sincronizada</p>
                        </div>
                        <p className="text-[13px] leading-relaxed text-muted">
                            Perfil, listas, acompanhamentos e leituras acompanham você em qualquer dispositivo.
                        </p>
                    </div>

                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Notificações</p>
                        <p className="mb-3 text-[12px] leading-relaxed text-muted">
                            Escolha apenas alertas úteis da sua Minha Onda.
                        </p>
                        <div className="space-y-2">
                            {([
                                { key: 'savedReadings', label: 'Leituras salvas', desc: 'Lembrar artigos que você guardou para ler.' },
                                { key: 'watching', label: 'Continuar assistindo', desc: 'Mostrar títulos marcados como Assistindo.' },
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
