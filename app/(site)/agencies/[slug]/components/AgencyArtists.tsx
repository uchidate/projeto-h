import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getWPImage, stripHtml } from '@/lib/utils'
import { ExpandableArtistGrid } from '@/components/agency/ExpandableArtistGrid'
import { SectionHeader } from '@/app/(site)/agencies/[slug]/components/SectionHeader'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyArtists({ view }: { view: AgencyView }) {
    const { interfaceAccent, allArtists, topArtist } = view
    return (
        <section id="artistas" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <SectionHeader label="Perfis relacionados" title="Artistas" count={allArtists.length} />

            {/* Spotlight — perfil com maior sinal editorial de destaque */}
            {topArtist && (() => {
                const img = getWPImage(topArtist._embedded, topArtist.featured_image_url)
                const aname = stripHtml(topArtist.title.rendered)
                const roles = topArtist.acf?.roles ?? []
                return (
                    <Link href={`/artists/${topArtist.slug}`} prefetch={false} className="group mt-6 mb-8 flex items-stretch gap-0 border border-border bg-surface overflow-hidden hover:border-(--ac) transition-colors">
                        <div className="relative w-[120px] sm:w-[160px] shrink-0 aspect-3/4">
                            {img ? (
                                <Image src={img.src} alt={aname} fill
                                    className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500"
                                    sizes="160px" />
                            ) : (
                                <div className="w-full h-full [background:var(--ac-08)] flex items-center justify-center">
                                    <span className="font-black text-[48px] text-(--ac) opacity-30">{aname[0]}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-between p-5 sm:p-7 flex-1 min-w-0 [border-left:2px_solid_var(--ac)]">
                            <div>
                                <span className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-(--ac) mb-3 block">
                                    ● Perfil em destaque
                                </span>
                                <p className="text-[24px] sm:text-[32px] font-black leading-tight tracking-tight group-hover:text-(--ac) transition-colors">{aname}</p>
                                {topArtist.acf?.name_hangul && (
                                    <p className="font-mono text-[13px] text-muted mt-1">{topArtist.acf.name_hangul}</p>
                                )}
                                {roles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {roles.slice(0, 3).map(r => (
                                            <span key={r} className="font-mono text-[9px] uppercase tracking-wider border border-border px-2 py-1 text-muted">{r}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="font-mono text-[11px] text-muted/60 mt-4 flex items-center gap-1 group-hover:text-muted transition-colors">
                                Ver perfil completo <ChevronRight size={11} />
                            </p>
                        </div>
                    </Link>
                )
            })()}

            <ExpandableArtistGrid
                artists={[...allArtists]
                    .sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0))
                    .filter(a => a.id !== topArtist?.id)}
                accent={interfaceAccent}
                initialCount={11}
            />
        </section>
    )
}
