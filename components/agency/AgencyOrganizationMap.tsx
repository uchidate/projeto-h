import Image from 'next/image'
import Link from 'next/link'
import { Network } from 'lucide-react'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import type { AgencyNetwork } from '@/lib/agencies/network'
import type { WPAgency, WPArtist, WPGroup } from '@/lib/wordpress/types'
import { agencyMark } from '@/lib/agencies/presentation'
import { entityBelongsToOrganizations } from '@/lib/agencies/network'
import { getWPImage, stripHtml } from '@/lib/utils'

const KIND_LABELS: Record<string, string> = {
    conglomerate: 'Conglomerado',
    label: 'Label',
    agency: 'Agência',
    joint_venture: 'Joint venture',
    division: 'Divisão',
}

function belongsTo(entity: WPArtist | WPGroup, organizationId: number) {
    return entityBelongsToOrganizations(entity, [organizationId])
}

type Props = {
    agency: WPAgency
    network: AgencyNetwork
    groups: WPGroup[]
    artists: WPArtist[]
}

export function AgencyOrganizationMap({ agency, network, groups, artists }: Props) {
    const name = stripHtml(agency.title.rendered)
    const related = network.organizations.filter(item => item.id !== agency.id)
    if (related.length === 0 && network.ancestors.length === 0) return null

    return (
        <section id="ecossistema" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <BlockHeader
                eyebrow="Quem responde por quem"
                title={`Como a ${name} se organiza`}
                icon={<Network className="h-4 w-4 text-(--ac)" />}
                meta={<span className="font-mono text-[10px] text-muted">{related.length} relações</span>}
            />
            <p className="profile-content-measure -mt-2 mb-6 text-[14px] leading-6 text-muted">
                {network.ancestors.length > 0
                    ? 'O vínculo com a controladora aparece de forma explícita, sem misturar o catálogo desta organização com o de labels irmãs.'
                    : 'A organização principal ocupa o primeiro nível. Labels, divisões, subsidiárias e joint ventures aparecem abaixo sem serem tratadas como equivalentes entre si.'}
            </p>

            {network.ancestors.length > 0 && (
                <div className="mb-8 border-l-2 border-(--ac) bg-surface p-5 sm:p-6">
                    <p className="profile-kicker text-(--ac)">Conglomerado controlador · acesse o perfil</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {network.ancestors.map(parent => {
                            const parentName = stripHtml(parent.title.rendered)
                            return (
                                <Link key={parent.id} href={`/agencies/${parent.slug}`} className="group inline-flex min-w-48 items-center justify-between gap-5 border border-border bg-background px-4 py-3 transition-colors hover:border-(--ac)">
                                    <span>
                                        <span className="block font-mono text-[8px] font-black uppercase tracking-[0.12em] text-muted">{KIND_LABELS[parent.acf?.organization_kind ?? ''] ?? 'Organização controladora'}</span>
                                        <strong className="mt-1 block text-[15px] group-hover:text-accent">{parentName}</strong>
                                    </span>
                                    <span aria-hidden="true" className="text-lg text-(--ac)">→</span>
                                </Link>
                            )
                        })}
                    </div>
                    <p className="mt-3 text-[11px] leading-5 text-muted">A controladora define o nível corporativo; o catálogo desta página continua restrito à organização aberta.</p>
                </div>
            )}

            <div className="relative mx-auto mb-8 max-w-xl border border-(--ac) bg-(--ac-08) p-6 text-center">
                <p className="profile-kicker text-(--ac)">{network.ancestors.length > 0 ? 'Organização em foco' : 'Nível 1'} · {KIND_LABELS[agency.acf?.organization_kind ?? ''] ?? 'Organização principal'}</p>
                <h3 className="mt-2 text-2xl font-black">{name}</h3>
                <p className="mt-2 text-[12px] leading-5 text-muted">
                    {network.ancestors.length > 0
                        ? 'Identidade criativa, elenco e atuação próprios dentro da estrutura controladora.'
                        : 'Estratégia, controle ou coordenação da rede apresentada nesta página.'}
                </p>
                {related.length > 0 && <div aria-hidden="true" className="absolute left-1/2 top-full h-8 w-px -translate-x-1/2 [background:var(--ac)]" />}
            </div>

            {related.length > 0 && (
                <>
                    <div className="mb-4 flex items-center gap-3">
                        <span className="profile-kicker text-(--ac)">Nível 2 · Organizações relacionadas</span>
                        <span aria-hidden="true" className="h-px flex-1 bg-border" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map(item => {
                    const itemName = stripHtml(item.title.rendered)
                    const image = getWPImage(item._embedded, item.featured_image_url)
                    const groupCount = groups.filter(group => belongsTo(group, item.id)).length
                    const artistCount = artists.filter(artist => belongsTo(artist, item.id)).length
                    return (
                        <Link key={item.id} href={`/agencies/${item.slug}`} className="profile-panel group flex min-h-32 items-start gap-4 p-5 transition-colors hover:border-(--ac)">
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-background">
                                {image ? <Image src={image.src} alt={`${itemName} — logo`} fill className="object-contain p-2" sizes="56px" /> : <span className="font-black text-muted">{agencyMark(itemName)}</span>}
                            </div>
                            <div className="min-w-0">
                                <p className="profile-kicker text-(--ac)">{KIND_LABELS[item.acf?.organization_kind ?? ''] ?? 'Organização relacionada'}</p>
                                <h3 className="mt-1 text-[17px] font-black leading-tight group-hover:text-accent">{itemName}</h3>
                                {item.acf?.region && <p className="mt-1 text-[11px] text-muted">{item.acf.region}</p>}
                                {(groupCount > 0 || artistCount > 0) && <p className="mt-3 font-mono text-[9px] uppercase tracking-wider text-muted">{groupCount} grupos · {artistCount} perfis</p>}
                            </div>
                        </Link>
                    )
                        })}
                    </div>
                </>
            )}

            <div className="mt-6 border-l-2 border-(--ac) bg-surface px-5 py-4">
                <p className="profile-kicker text-(--ac)">{related.length > 0 ? 'Nível 3 · Catálogo relacionado' : 'Catálogo direto'}</p>
                <p className="mt-2 text-[13px] leading-6 text-foreground/70">
                    {related.length > 0
                        ? 'Grupos e artistas mantêm o vínculo direto com a organização responsável. O catálogo seguinte pode agregar toda a rede sem apagar essa origem.'
                        : 'Os grupos e artistas abaixo estão ligados diretamente a esta organização, sem incorporar o elenco de outras empresas do conglomerado.'}
                </p>
            </div>
        </section>
    )
}
