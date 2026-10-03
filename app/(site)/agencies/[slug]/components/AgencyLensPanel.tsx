import { Network, BookOpenCheck } from 'lucide-react'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyLensPanel({ view }: { view: AgencyView }) {
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
                        <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em]">Escopo desta página</span>
                    </div>
                    <p className="mt-3 text-[12px] leading-5 text-muted">
                        {network.organizations.length > 1
                            ? `${network.organizations.length} organizações conectadas · ${allGroups.length} grupos · ${allArtists.length} perfis.`
                            : `${allGroups.length} grupos e ${allArtists.length} perfis relacionados no acervo editorial.`}
                    </p>
                </div>
            </div>
        </aside>
    )
}
