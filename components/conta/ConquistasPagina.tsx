import Link from '@/components/i18n/LocalizedLink'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { getWpToken } from '@/lib/auth/wpToken'
import { ArrowRight, BookOpen, CheckCircle2, Compass, Film, Heart, Mic2, PlayCircle, Trophy, Users } from 'lucide-react'
import type { Metadata } from 'next'
import { authOptions } from '@/lib/auth'
import { getUserStats } from '@/lib/wordpress/userApi'
import { buildUserAchievements, type UserAchievement } from '@/lib/userJourney'
import { BrandDot } from '@/components/ui/BrandDot'
import { textosDaConquista } from '@/lib/conta/conquistas'
import { href } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

export async function metadataDaPagina(locale: Locale = DEFAULT_LOCALE): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'client.conta.conquistas' })
    return { title: t('metaTitle'), robots: { index: false, follow: false } }
}

const categoryIcons: Record<UserAchievement['category'], typeof Heart> = {
    Colecao: Heart,
    Continuidade: PlayCircle,
    Fandom: Users,
    Leitura: BookOpen,
}

const categoryOrder: UserAchievement['category'][] = ['Colecao', 'Continuidade', 'Fandom', 'Leitura']

export default async function ConquistasPage({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
    const t = await getTranslations({ locale, namespace: 'client.conta.conquistas' })
    const tw = await getTranslations({ locale, namespace: 'client.conta' })
    const session = await getServerSession(authOptions)
    if (!session) redirect(`${href('login', undefined, locale)}?callbackUrl=${href('achievements', undefined, locale)}`)

    const stats = await getUserStats(await getWpToken()).catch(() => ({
        favoritesCount: 0,
        watchlistCount: 0,
        joinDate: '',
    }))
    const achievements = buildUserAchievements(stats).map(item => ({ ...item, ...textosDaConquista(tw, item.id) }))
    const unlocked = achievements.filter(item => item.done).length
    const nextAchievement = achievements
        .filter(item => !item.done)
        .sort((a, b) => b.progress - a.progress)[0]
    const completion = Math.round((unlocked / achievements.length) * 100)

    return (
        <div className="page-wrap py-8 lg:py-12">
            <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="border border-border bg-surface p-6 sm:p-8">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent">{tw('common.wave')}</p>
                    <h1 className="mt-1 text-[32px] font-black leading-tight tracking-tight">
                        {t('title')}<BrandDot />
                    </h1>
                    <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-muted">
                        {t('intro')}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 bg-accent-a11y px-4 py-2 text-[12px] font-black uppercase tracking-wider text-white transition-opacity hover:opacity-90">
                            {t('seeWave')} <ArrowRight size={14} />
                        </Link>
                        <Link href="/perfil" className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[12px] font-black uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent">
                            {t('adjustProfile')}
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
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted">{t('unlockedLabel')}</span>
                        </span>
                    </div>
                    <div className="mb-4 h-2 overflow-hidden bg-background">
                        <div className="h-full bg-accent" style={{ width: `${completion}%` }} />
                    </div>
                    {nextAchievement ? (
                        <div className="border border-border bg-background p-3">
                            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{t('nextClosest')}</p>
                            <p className="mt-1 text-[14px] font-black text-foreground">{nextAchievement.label}</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-muted">{nextAchievement.howTo}</p>
                            <Link href={nextAchievement.href} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-accent hover:underline">
                                {nextAchievement.cta} <ArrowRight size={12} />
                            </Link>
                        </div>
                    ) : (
                        <div className="border border-accent/35 bg-background p-3">
                            <p className="text-[14px] font-black text-foreground">{t('allDone')}</p>
                            <p className="mt-1 text-[12px] leading-relaxed text-muted">{t('allDoneDesc')}</p>
                        </div>
                    )}
                </aside>
            </div>

            <div className="space-y-8">
                {categoryOrder.map(category => {
                    const Icon = categoryIcons[category]
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
                                        <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{t('doneCount', { done: doneCount, total: items.length })}</p>
                                        <h2 className="text-[22px] font-black tracking-tight">{t(`cat.${category}.title` as 'cat.Colecao.title')}</h2>
                                        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">{t(`cat.${category}.desc` as 'cat.Colecao.desc')}</p>
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
                                                <span className="text-[10px] font-black uppercase tracking-wider text-muted">{t('progress')}</span>
                                                <span className="text-[11px] font-bold text-muted">{Math.min(item.current, item.target)}/{item.target}</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden bg-background">
                                                <div className="h-full bg-accent" style={{ width: `${item.progress}%` }} />
                                            </div>
                                            <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-accent">
                                                {item.done ? t('revisit') : item.cta} <ArrowRight size={12} />
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
