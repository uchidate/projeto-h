'use client'

import Link from 'next/link'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { BookmarkCheck, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Compass, Film, Heart, LogOut, Mic2, PlayCircle, Search, Sparkles, Trophy, User, Users } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { ProductionCard } from '@/components/productions/ProductionCard'
import type { WPArtist, WPGroup, WPProduction, WPPost } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { buildUserAchievements } from '@/lib/userJourney'

interface Props {
    user: { name: string; email: string; image: string | null }
    stats: {
        favoritesCount: number
        watchlistCount: number
        joinDate: string
        daysSinceJoin: number | null
        statusCounts?: { want: number; watching: number; watched: number }
        contentCounts?: { production: number; artist: number; group: number; post: number }
        contentStateCounts?: { favorite: number; following: number; saved: number; read: number }
    }
    favProductions: WPProduction[]
    watchProductions: WPProduction[]
    watchingProductions: WPProduction[]
    savedPosts: WPPost[]
    readPosts: WPPost[]
    followedArtists: WPArtist[]
    followedGroups: WPGroup[]
    latestPosts: WPPost[]
}

type DashboardAction = {
    label: string
    description: string
    href: string
    icon: typeof Heart
    done?: boolean
}

function StatCard({ icon: Icon, label, value, href }: { icon: typeof Heart; label: string; value: number; href: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 border border-border bg-surface p-4 hover:border-accent/50 transition-colors">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent/10 text-accent">
                <Icon className="h-4 w-4" />
            </span>
            <span>
                <span className="block text-[22px] font-black leading-none text-foreground">{value}</span>
                <span className="mt-0.5 block text-[10px] font-black uppercase tracking-widest text-muted">{label}</span>
            </span>
        </Link>
    )
}

function FollowedMiniCard({ href, title, subtitle, imageUrl }: { href: string; title: string; subtitle?: string; imageUrl?: string | null }) {
    return (
        <Link href={href} className="group flex items-center gap-3 border border-border bg-surface p-3 transition-colors hover:border-accent/50">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-background">
                {imageUrl ? (
                    <Image src={imageUrl} alt={title} fill className="object-cover object-top" sizes="48px" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-[18px] font-black text-accent/50">{title[0]}</div>
                )}
            </div>
            <span className="min-w-0">
                <span className="block truncate text-[13px] font-black text-foreground group-hover:text-accent">{title}</span>
                {subtitle && <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted">{subtitle}</span>}
            </span>
        </Link>
    )
}

export function DashboardClient({ user, stats, favProductions, watchProductions, watchingProductions, savedPosts, readPosts, followedArtists, followedGroups, latestPosts }: Props) {
    const firstName = user.name.split(' ')[0]
    const savedReadings = stats.contentStateCounts?.saved ?? savedPosts.length
    const readArticles = stats.contentStateCounts?.read ?? readPosts.length
    const followedTotal = (stats.contentCounts?.artist ?? 0) + (stats.contentCounts?.group ?? 0)
    const isEmpty = stats.favoritesCount === 0 && stats.watchlistCount === 0 && savedReadings === 0 && readArticles === 0 && followedTotal === 0
    const collectionTotal = stats.favoritesCount + stats.watchlistCount
    const watchingCount = stats.statusCounts?.watching ?? 0
    const watchedCount = stats.statusCounts?.watched ?? 0
    const followedArtistCount = stats.contentCounts?.artist ?? 0
    const followedGroupCount = stats.contentCounts?.group ?? 0
    const profileLevel = collectionTotal >= 20 ? 'Curador dedicado' : collectionTotal >= 8 ? 'Explorador em ritmo forte' : collectionTotal >= 1 ? 'Coleção começando' : 'Novo por aqui'
    const nextFavoriteGoal = stats.favoritesCount >= 20 ? null : stats.favoritesCount >= 5 ? 20 : stats.favoritesCount >= 1 ? 5 : 1
    const favoriteProgressGoal = nextFavoriteGoal ?? stats.favoritesCount
    const favoriteProgress = favoriteProgressGoal > 0
        ? Math.min(100, Math.round((stats.favoritesCount / favoriteProgressGoal) * 100))
        : 100
    const achievements = buildUserAchievements(stats)
    const unlockedAchievements = achievements.filter(item => item.done).length
    const nextActions: DashboardAction[] = [
        {
            label: stats.favoritesCount > 0 ? 'Revisitar favoritos' : 'Favoritar a primeira produção',
            description: stats.favoritesCount > 0 ? 'Abra sua coleção para continuar refinando seu gosto.' : 'Um favorito já deixa o painel com a sua cara.',
            href: stats.favoritesCount > 0 ? '/minhas-listas?tab=favoritos' : '/productions',
            icon: Heart,
            done: stats.favoritesCount > 0,
        },
        {
            label: stats.watchlistCount > 0 ? 'Organizar Quero ver' : 'Criar sua lista Quero ver',
            description: stats.watchlistCount > 0 ? 'Escolha o próximo drama ou filme da fila.' : 'Salve títulos para não perder a próxima maratona.',
            href: stats.watchlistCount > 0 ? '/minhas-listas?tab=lista' : '/productions',
            icon: BookmarkCheck,
            done: stats.watchlistCount > 0,
        },
        {
            label: watchingCount > 0 ? 'Continuar assistindo' : 'Marcar algo como Assistindo',
            description: watchingCount > 0 ? `${watchingCount} título${watchingCount !== 1 ? 's' : ''} em andamento na sua jornada.` : 'Abra uma produção e marque onde você parou.',
            href: watchingCount > 0 ? '/minhas-listas?tab=assistindo' : '/productions',
            icon: PlayCircle,
            done: watchingCount > 0,
        },
        {
            label: followedArtistCount + followedGroupCount > 0 ? 'Acompanhar cultura pop' : 'Seguir artistas e grupos',
            description: followedArtistCount + followedGroupCount > 0
                ? `${followedArtistCount + followedGroupCount} perfil${followedArtistCount + followedGroupCount !== 1 ? 's' : ''} acompanhado${followedArtistCount + followedGroupCount !== 1 ? 's' : ''} na Minha Onda.`
                : 'Siga artistas e grupos para conectar dramas, K-pop e artigos.',
            href: followedGroupCount > followedArtistCount ? '/groups' : '/artists',
            icon: Users,
            done: followedArtistCount + followedGroupCount > 0,
        },
        {
            label: savedReadings > 0 ? 'Retomar leituras salvas' : 'Salvar uma leitura',
            description: savedReadings > 0 ? `${savedReadings} artigo${savedReadings !== 1 ? 's' : ''} esperando na sua biblioteca.` : 'Salve guias e matérias para voltar depois.',
            href: savedReadings > 0 ? '#leituras-salvas' : '/blog',
            icon: BookOpen,
            done: savedReadings > 0,
        },
        {
            label: 'Explorar novidades',
            description: watchedCount > 0 ? 'Use o que você já assistiu para encontrar próximos títulos.' : latestPosts.length > 0 ? 'Use as leituras recentes para descobrir contexto e recomendações.' : 'Veja guias, listas e produções em destaque.',
            href: latestPosts.length > 0 ? '/blog' : '/productions',
            icon: Search,
        },
    ]

    return (
        <div className="page-wrap py-8 lg:py-12">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    {user.image ? (
                        <Image src={user.image} alt={user.name} width={56} height={56} className="shrink-0 object-cover border border-border" />
                    ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-accent-a11y text-xl font-black text-white">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">Minha Onda</p>
                        <h1 className="text-[28px] font-black leading-tight tracking-tight">
                            Olá, {firstName}<BrandDot />
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <Link href="/perfil"
                        className="flex items-center gap-1.5 border border-border px-3 py-2 text-[11px] font-black uppercase tracking-wider text-muted hover:border-accent hover:text-accent transition-colors">
                        <User size={12} /> Perfil
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-1.5 border border-border px-3 py-2 text-[11px] font-black uppercase tracking-wider text-muted hover:border-red-500 hover:text-red-500 transition-colors">
                        <LogOut size={12} /> Sair
                    </button>
                </div>
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="border border-border bg-surface p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">Seu momento</p>
                            <h2 className="mt-1 text-[22px] font-black tracking-tight">{profileLevel}</h2>
                            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-muted">
                                {isEmpty
                                    ? 'Comece salvando produções, seguindo perfis ou guardando leituras. Sua Onda vai tomando forma aos poucos.'
                                    : `Você já salvou ${collectionTotal} item${collectionTotal !== 1 ? 's' : ''}. Use sua Onda como ponto de partida para decidir o que assistir, ler e acompanhar.`}
                            </p>
                        </div>
                        <Link href="/productions" className="inline-flex shrink-0 items-center justify-center gap-2 bg-accent-a11y px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90">
                            Descobrir títulos <Sparkles size={14} />
                        </Link>
                    </div>
                    <div className="mt-5 border border-border bg-background p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[12px] font-black text-foreground">
                                {nextFavoriteGoal ? `Meta: ${nextFavoriteGoal} favorito${nextFavoriteGoal !== 1 ? 's' : ''}` : 'Meta de favoritos concluída'}
                            </span>
                            <span className="text-[11px] font-bold text-muted">{stats.favoritesCount}/{favoriteProgressGoal}</span>
                        </div>
                        <div className="h-2 overflow-hidden bg-surface">
                            <div className="h-full bg-accent transition-all" style={{ width: `${favoriteProgress}%` }} />
                        </div>
                    </div>
                </section>

                <section className="border border-border bg-surface p-5">
                    <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted">Próximos passos</p>
                    <div className="space-y-2">
                        {nextActions.map(({ label, description, href, icon: Icon, done }) => (
                            <Link key={label} href={href} className="group flex items-start gap-3 border border-border bg-background p-3 transition-colors hover:border-accent/50">
                                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center ${done ? 'bg-accent-a11y text-white' : 'bg-surface text-muted group-hover:text-accent'}`}>
                                    {done ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[13px] font-black text-foreground group-hover:text-accent">{label}</span>
                                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">{description}</span>
                                </span>
                                <ChevronRight size={14} className="mt-2 text-muted group-hover:text-accent" />
                            </Link>
                        ))}
                    </div>
                </section>
            </div>

            {/* Stats */}
            <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={Heart} label="Favoritos" value={stats.favoritesCount} href="/minhas-listas?tab=favoritos" />
                <StatCard icon={BookmarkCheck} label="Quero ver" value={stats.watchlistCount} href="/minhas-listas?tab=lista" />
                <StatCard icon={PlayCircle} label="Assistindo" value={watchingCount} href="/minhas-listas?tab=assistindo" />
                <StatCard icon={Mic2} label="Acompanhando" value={followedArtistCount + followedGroupCount} href="/perfil" />
                <StatCard icon={BookOpen} label="Leituras" value={savedReadings + readArticles} href="#leituras-salvas" />
                <StatCard icon={Trophy} label="Conquistas" value={unlockedAchievements} href="/conquistas" />
                {stats.daysSinceJoin !== null && (
                    <StatCard icon={CalendarDays} label="Dias no site" value={stats.daysSinceJoin} href="/perfil" />
                )}
            </div>

            {isEmpty ? (
                <div className="border border-dashed border-border bg-surface p-10 text-center">
                    <Compass className="mx-auto mb-4 h-10 w-10 text-muted" />
                    <h2 className="text-[20px] font-black mb-2">Monte sua coleção</h2>
                    <p className="text-[14px] text-muted max-w-sm mx-auto mb-6">
                        Favorite dramas, siga artistas ou salve leituras para construir sua Minha Onda.
                    </p>
                    <Link href="/productions" className="inline-flex items-center gap-2 bg-accent-a11y px-5 py-2.5 text-[13px] font-black text-white hover:opacity-90 transition-opacity">
                        <Film size={14} /> Explorar produções
                    </Link>
                </div>
            ) : (
                <div className="space-y-10">
                    {favProductions.length > 0 && (
                        <section>
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Coleção</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Favoritos recentes</h2>
                                </div>
                                <Link href="/minhas-listas?tab=favoritos" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                    Ver todos →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                {favProductions.map(p => <ProductionCard key={p.id} production={p} />)}
                            </div>
                        </section>
                    )}

                    {watchingProductions.length > 0 && (
                        <section>
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Continuidade</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Continuar assistindo</h2>
                                </div>
                                <Link href="/minhas-listas?tab=assistindo" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                    Ver todos →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                {watchingProductions.map(p => <ProductionCard key={p.id} production={p} />)}
                            </div>
                        </section>
                    )}

                    {watchProductions.length > 0 && (
                        <section>
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Lista</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Quero ver</h2>
                                </div>
                                <Link href="/minhas-listas?tab=lista" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                    Ver todos →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                {watchProductions.map(p => <ProductionCard key={p.id} production={p} />)}
                            </div>
                        </section>
                    )}

                    {(followedArtists.length > 0 || followedGroups.length > 0) && (
                        <section>
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Minha Onda</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Acompanhando</h2>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/artists" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                        Artistas
                                    </Link>
                                    <Link href="/groups" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                        Grupos
                                    </Link>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {followedArtists.map(artist => {
                                    const image = getWPImage(artist._embedded, artist.featured_image_url)
                                    const roles = (artist.acf?.roles ?? []).slice(0, 1).join(', ')
                                    return (
                                        <FollowedMiniCard
                                            key={`artist-${artist.id}`}
                                            href={`/artists/${artist.slug}`}
                                            title={stripHtml(artist.title.rendered)}
                                            subtitle={roles || artist.acf?.name_hangul || 'Artista'}
                                            imageUrl={image?.src}
                                        />
                                    )
                                })}
                                {followedGroups.map(group => {
                                    const image = getWPImage(group._embedded, group.featured_image_url)
                                    return (
                                        <FollowedMiniCard
                                            key={`group-${group.id}`}
                                            href={`/groups/${group.slug}`}
                                            title={stripHtml(group.title.rendered)}
                                            subtitle={group.acf?.fandom_name ? `Fandom: ${group.acf.fandom_name}` : 'Grupo'}
                                            imageUrl={image?.src}
                                        />
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {savedPosts.length > 0 && (
                        <section id="leituras-salvas">
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Biblioteca</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Salvos para ler</h2>
                                </div>
                                <Link href="/blog" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                    Ver blog →
                                </Link>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {savedPosts.map(post => {
                                    const img = getWPImage(post._embedded, post.featured_image_url)
                                    return (
                                        <Link key={post.id} href={`/blog/${post.slug}`}
                                            className="group grid grid-cols-[80px_minmax(0,1fr)] border border-border bg-surface hover:border-accent/50 transition-colors overflow-hidden">
                                            {img ? (
                                                <div className="relative h-full min-h-[80px] bg-background">
                                                    <Image src={img.src} alt={img.alt || ''} fill className="object-cover" sizes="80px" />
                                                </div>
                                            ) : (
                                                <div className="h-full min-h-[80px] bg-surface" />
                                            )}
                                            <div className="p-3">
                                                <p className="line-clamp-2 text-[13px] font-black leading-tight text-foreground group-hover:text-accent transition-colors">
                                                    {stripHtml(post.title.rendered)}
                                                </p>
                                                <p className="mt-1 text-[11px] font-semibold text-muted">Salvo na Minha Onda</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {readPosts.length > 0 && (
                        <section>
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Histórico</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Lidos recentemente</h2>
                                </div>
                                <Link href="/blog" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                    Ver blog →
                                </Link>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {readPosts.map(post => {
                                    const img = getWPImage(post._embedded, post.featured_image_url)
                                    return (
                                        <Link key={post.id} href={`/blog/${post.slug}`}
                                            className="group grid grid-cols-[80px_minmax(0,1fr)] border border-border bg-surface hover:border-accent/50 transition-colors overflow-hidden">
                                            {img ? (
                                                <div className="relative h-full min-h-[80px] bg-background">
                                                    <Image src={img.src} alt={img.alt || ''} fill className="object-cover" sizes="80px" />
                                                </div>
                                            ) : (
                                                <div className="h-full min-h-[80px] bg-surface" />
                                            )}
                                            <div className="p-3">
                                                <p className="line-clamp-2 text-[13px] font-black leading-tight text-foreground group-hover:text-accent transition-colors">
                                                    {stripHtml(post.title.rendered)}
                                                </p>
                                                <p className="mt-1 text-[11px] font-semibold text-muted">Marcado como lido</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {latestPosts.length > 0 && (
                        <section>
                            <div className="mb-5 flex items-baseline justify-between">
                                <div>
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Blog</p>
                                    <h2 className="text-[20px] font-black tracking-tight">Leituras recentes</h2>
                                </div>
                                <Link href="/blog" className="font-mono text-[11px] text-accent hover:underline uppercase tracking-[0.06em]">
                                    Ver blog →
                                </Link>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {latestPosts.map(post => {
                                    const img = getWPImage(post._embedded, post.featured_image_url)
                                    return (
                                        <Link key={post.id} href={`/blog/${post.slug}`}
                                            className="group grid grid-cols-[80px_minmax(0,1fr)] border border-border bg-surface hover:border-accent/50 transition-colors overflow-hidden">
                                            {img ? (
                                                <div className="relative h-full min-h-[80px] bg-background">
                                                    <Image src={img.src} alt={img.alt || ''} fill className="object-cover" sizes="80px" />
                                                </div>
                                            ) : (
                                                <div className="h-full min-h-[80px] bg-surface" />
                                            )}
                                            <div className="p-3">
                                                <p className="line-clamp-2 text-[13px] font-black leading-tight text-foreground group-hover:text-accent transition-colors">
                                                    {stripHtml(post.title.rendered)}
                                                </p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}
