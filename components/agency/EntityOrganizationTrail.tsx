import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ChevronRight, Network } from 'lucide-react'
import type { EntityOrganizationContext } from '@/lib/agencies/network'
import { stripHtml } from '@/lib/utils'

const KIND_KEYS = ['conglomerate', 'label', 'agency', 'joint_venture', 'division'] as const
const isKind = (value: string): value is (typeof KIND_KEYS)[number] => (KIND_KEYS as readonly string[]).includes(value)

export function EntityOrganizationTrail({ context }: { context: EntityOrganizationContext }) {
    const t = useTranslations('profile.ui')
    if (!context.nodes.length) return null
    return (
        <div className="border border-border bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2 text-(--ac)"><Network size={15} /><p className="profile-kicker">{t('org.title')}</p></div>
            <div className="flex flex-wrap items-stretch gap-2">
                {context.nodes.map((node, index) => {
                    const organization = node.organization
                    const name = stripHtml(organization.title.rendered)
                    return (
                        <div key={organization.id} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight size={14} className="text-muted" aria-hidden="true" />}
                            <Link href={`/agencies/${organization.slug}`} className="min-w-36 border border-border bg-background px-4 py-3 transition-colors hover:border-(--ac)">
                                <span className="font-mono text-[8px] font-black uppercase tracking-[0.12em] text-muted">{(() => { const kind = organization.acf?.organization_kind ?? ''; return isKind(kind) ? t(`org.${kind}`) : node.direct ? t('org.direct') : t('org.parent') })()}</span>
                                <strong className="mt-1 block text-[14px]">{name}</strong>
                            </Link>
                        </div>
                    )
                })}
            </div>
            <p className="mt-4 text-[11px] leading-5 text-muted">{t('org.note')}</p>
        </div>
    )
}
