import { useTranslations } from 'next-intl'
import { Network, BookOpenCheck } from 'lucide-react'
import type { AgencyView } from '@/components/agencies/detail/lib/carregarAgencia'

export function AgencyLensPanel({ view }: { view: AgencyView }) {
    const t = useTranslations('entity.agency.ui')
    const { mark, network, allArtists, allGroups, editorialLens } = view
    return (
        <aside className="profile-panel relative overflow-hidden" aria-labelledby="chave-leitura-agencia">
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 [background:var(--ac)]" />
            <div aria-hidden="true" className="absolute -right-8 -top-12 hidden font-black text-[150px] leading-none text-foreground/2.5 sm:block">
                {mark}
            </div>
            <div className="relative grid gap-5 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                <div>
                    <div className="flex items-center gap-2 text-(--ac)">
                        <BookOpenCheck size={15} />
                        <p className="profile-kicker">{editorialLens.eyebrow}</p>
                    </div>
                    <h2 id="chave-leitura-agencia" className="mt-3 max-w-3xl text-lg font-black leading-tight tracking-tight sm:text-2xl">
                        {editorialLens.title}
                    </h2>
                    <p className="mt-3 max-w-3xl text-[13px] leading-6 text-foreground/70 sm:text-[14px] sm:leading-7">
                        {editorialLens.body}
                    </p>
                </div>
                <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-center gap-2 text-(--ac)">
                        <Network size={14} />
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em]">{t('lensPanel.scope')}</span>
                    </div>
                    <p className="mt-3 text-[12px] leading-5 text-muted">
                        {network.organizations.length > 1
                            ? t('lensPanel.many', { orgs: network.organizations.length, groups: allGroups.length, artists: allArtists.length })
                            : t('lensPanel.one', { groups: allGroups.length, artists: allArtists.length })}
                    </p>
                </div>
            </div>
        </aside>
    )
}
