import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { getWpToken } from '@/lib/auth/wpToken'
import { ArrowRight, BookOpen, CheckCircle2, Compass, Film, Heart, Mic2, PlayCircle, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { authOptions } from '@/lib/auth'
import { getUserStats } from '@/lib/wordpress/userApi'
import { buildUserAchievements, type UserAchievement } from '@/lib/userJourney'
import { BrandDot } from '@/components/ui/BrandDot'

export const metadata: Metadata = {
    title: 'Conquistas',
    robots: { index: false, follow: false },
}

const categoryCopy: Record<UserAchievement['category'], { title: string; desc: string; icon: typeof Heart }> = {
    Colecao: {
        title: 'Colecao',
        desc: 'Favoritos e listas que deixam seu gosto mais claro.',
        icon: Heart,
    },
    Continuidade: {
        title: 'Continuidade',
        desc: 'Estados para acompanhar o que voce quer ver, esta vendo e ja concluiu.',
        icon: PlayCircle,
    },
    Fandom: {
        title: 'Fandom',
        desc: 'Artistas e grupos que conectam K-pop, dramas e cultura coreana.',
        icon: Users,
    },
    Leitura: {
        title: 'Leitura',
        desc: 'Guias, listas e artigos salvos ou marcados como lidos.',
        icon: BookOpen,
    },
}

const categoryOrder: UserAchievement['category'][] = ['Colecao', 'Continuidade', 'Fandom', 'Leitura']

export default async function ConquistasPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/entrar?callbackUrl=/conquistas')

    const stats = await getUserStats(await getWpToken()).catch(() => ({
        favoritesCount: 0,
        watchlistCount: 0,
        joinDate: '',
    }))
    const achievements = buildUserAchievements(stats)
    const unlocked = achievements.filter(item => item.done).length
    const nextAchievement = achievements
        .filter(item => !item.done)
        .sort((a, b) => b.progress - a.progress)[0]
    const completion = Math.round((unlocked / achievements.length) * 100)

    return (
        <div className="page-wrap py-8 lg:py-12">
            <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="border border-border bg-surface p-6 sm:p-8">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">Minha Onda</p>
                    <h1 className="mt-1 text-[32px] font-black leading-tight tracking-tight">
                        Conquistas<BrandDot />
                    </h1>
                    <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
                        Aqui fica claro o que desbloqueia cada conquista. Todas usam acoes simples do site: favoritar producoes, organizar sua lista, seguir artistas e grupos, salvar leituras e marcar artigos como lidos.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 bg-accent-a11y px-4 py-2 text-[12px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90">
                            Ver Minha Onda <ArrowRight size={14} />
                        </Link>
                        <Link href="/perfil" className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[12px] font-black uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent">
                            Ajustar perfil
                        </Link>
                    </div>
                </section>

                <aside className="border border-border bg-surface p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center bg-accent/10 text-accent">
                            <Trophy size={20} />
                        </span>
                        <span>
                            <span className="block text-[28px] font-black leading-none">{unlocked}/{achievements.length}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted">desbloqueadas</span>
                        </span>
                    </div>
                    <div className="mb-4 h-2 overflow-hidden bg-background">
                        <div className="h-full bg-accent" style={{ width: `${completion}%` }} />
                    </div>
                    {nextAchievement ? (
                        <div className="border border-border bg-background p-3">
                            <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Proxima mais perto</p>
                            <p className="mt-1 text-[14px] font-black text-foreground">{nextAchievement.label}</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-muted">{nextAchievement.howTo}</p>
                            <Link href={nextAchievement.href} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-accent hover:underline">
                                {nextAchievement.cta} <ArrowRight size={12} />
                            </Link>
                        </div>
                    ) : (
                        <div className="border border-accent/35 bg-background p-3">
                            <p className="text-[14px] font-black text-foreground">Tudo desbloqueado.</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-muted">Sua Minha Onda ja esta bem completa. Agora e manter viva com novas leituras e titulos.</p>
                        </div>
                    )}
                </aside>
            </div>

            <div className="space-y-8">
                {categoryOrder.map(category => {
                    const copy = categoryCopy[category]
                    const Icon = copy.icon
                    const items = achievements.filter(item => item.category === category)
                    const doneCount = items.filter(item => item.done).length
                    return (
                        <section key={category}>
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center bg-accent/10 text-accent">
                                        <Icon size={17} />
                                    </span>
                                    <div>
                                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">{doneCount}/{items.length} concluidas</p>
                                        <h2 className="text-[22px] font-black tracking-tight">{copy.title}</h2>
                                        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">{copy.desc}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {items.map(item => (
                                    <Link key={item.id} href={item.href} className={`group border p-4 transition-colors hover:border-accent/50 ${item.done ? 'border-accent/35 bg-surface' : 'border-border bg-surface'}`}>
                                        <div className="flex items-start gap-3">
                                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center ${item.done ? 'bg-accent-a11y text-white' : 'bg-background text-muted group-hover:text-accent'}`}>
                                                {item.done ? <CheckCircle2 size={16} /> : category === 'Colecao' ? <Film size={16} /> : category === 'Fandom' ? <Mic2 size={16} /> : <Compass size={16} />}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-[15px] font-black text-foreground group-hover:text-accent">{item.label}</span>
                                                <span className="mt-0.5 block text-[12px] font-semibold text-muted">{item.desc}</span>
                                                <span className="mt-2 block text-[12px] leading-relaxed text-muted">{item.howTo}</span>
                                            </span>
                                        </div>
                                        <div className="mt-4">
                                            <div className="mb-1.5 flex items-center justify-between gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">Progresso</span>
                                                <span className="text-[11px] font-bold text-muted">{Math.min(item.current, item.target)}/{item.target}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden bg-background">
                                                <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
                                            </div>
                                            <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-accent">
                                                {item.done ? 'Revisitar caminho' : item.cta} <ArrowRight size={12} />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
