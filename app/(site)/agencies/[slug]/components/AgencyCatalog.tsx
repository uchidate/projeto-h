import Image from 'next/image'
import Link from 'next/link'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import { optionalAccent, toRgba, type CSSVariableProperties } from '@/lib/agencies/presentation'
import { GroupCard } from '@/app/(site)/agencies/[slug]/components/GroupCard'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyCatalog({ view }: { view: AgencyView }) {
    const { interfaceAccent, allGroups, activeGroups, inactiveGroups, featuredGroups, groupsByGen, groupsWithoutGeneration } = view
    return (
        <section id="catalogo" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 shrink-0 [background:var(--ac)]" />
                    <div>
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Elenco</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">Um mapa visual do catálogo</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted tabular-nums">{allGroups.length} total</span>
                    {activeGroups.length > 0 && (
                        <span className="font-mono text-[10px] px-2 py-0.5 [background:var(--ac-08)] text-(--ac) border border-(--ac-15)">
                            {activeGroups.length} ativos
                        </span>
                    )}
                </div>
            </div>

            <p className="mt-4 max-w-3xl text-[13px] leading-6 text-muted">
                Comece pelos destaques e avance pelas gerações. A relação pode ser direta ou ocorrer por meio de uma label ou subsidiária; cada perfil detalha o vínculo específico.
            </p>

            {/* Featured 4 — abertura visual assimétrica */}
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
                {featuredGroups.map((group, index) => {
                    const img = getWPImage(group._embedded, group.featured_image_url)
                    const gname = stripHtml(group.title.rendered)
                    const debutYear = getYear(group.acf?.debut_date)
                    const isActive = group.acf?.active !== false
                    const groupColor = optionalAccent(group.acf?.color)
                    const groupStyle: CSSVariableProperties | undefined = groupColor ? { '--gc': groupColor } : undefined
                    return (
                        <Link
                            key={group.id}
                            href={`/groups/${group.slug}`}
                            prefetch={false}
                            style={groupStyle}
                            className={`group relative min-h-[210px] overflow-hidden border border-border bg-surface transition-all duration-300 [border-top:3px_solid_var(--gc,var(--ac))] hover:border-foreground/30 hover:shadow-2xl motion-safe:hover:-translate-y-1 motion-reduce:transition-none ${index === 0 ? 'col-span-2 min-h-[330px] md:row-span-2 md:min-h-[470px]' : index === 3 ? 'col-span-2 md:min-h-0' : 'md:min-h-0'}`}
                        >
                            <div className="absolute inset-0 overflow-hidden">
                                {img ? (
                                    <Image
                                        src={img.src}
                                        alt={gname}
                                        fill
                                        className="object-cover object-top group-hover:scale-[1.06] transition-transform duration-700"
                                        sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : index === 3 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-surface">
                                        <span className="text-[64px] font-black text-muted/10">{gname[0]}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
                                {index === 0 && (
                                    <span className="absolute left-4 top-4 border border-white/25 bg-black/45 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.12em] text-white backdrop-blur-xs">
                                        Comece por aqui
                                    </span>
                                )}
                                <div className={`absolute inset-x-0 bottom-0 ${index === 0 ? 'p-5 sm:p-7' : 'p-4'}`}>
                                    <div className={`inline-block px-1.5 py-0.5 font-mono text-[8px] font-black text-white mb-2 ${isActive ? '[background:var(--gc,var(--ac))]' : 'bg-muted/60'}`}>
                                        {isActive ? 'Ativo' : 'Inativo'}
                                    </div>
                                    <p className={`font-black leading-tight text-white ${index === 0 ? 'text-2xl sm:text-3xl' : 'text-[17px]'}`}>{gname}</p>
                                    {group.acf?.name_hangul && (
                                        <p className="text-white/50 font-mono text-[10px] mt-0.5">{group.acf.name_hangul}</p>
                                    )}
                                    {debutYear && (
                                        <p className="font-mono text-[9px] text-white/35 mt-1.5">desde {debutYear}</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Remaining groups by generation */}
            {groupsByGen.length > 0 && (
                <div className="mt-10 space-y-8">
                    {groupsByGen.map(gen => (
                        <div key={gen.label}>
                            <div className="flex items-center gap-3 mb-4 border-b border-border/30 pb-3">
                                <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] border border-border px-2 py-1"
                                    style={{ borderColor: toRgba(interfaceAccent, 0.4), color: interfaceAccent }}>
                                    {gen.shortLabel}
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-muted">{gen.label}</span>
                                <span className="font-mono text-[10px] text-muted/40">
                                    {gen.from}–{gen.to === 9999 ? 'hoje' : gen.to}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {gen.items.map(group => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {groupsWithoutGeneration.length > 0 && (
                <div className="mt-10">
                    <div className="mb-4 flex items-center gap-3 border-b border-border/30 pb-3">
                        <span className="border border-border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-muted">
                            Outros
                        </span>
                        <span className="font-mono text-[11px] text-muted">Sem geração informada</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {groupsWithoutGeneration.map(group => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                </div>
            )}

            {/* Inativos / Disbandados */}
            {inactiveGroups.length > 0 && (
                <div className="mt-10">
                    <div className="flex items-center gap-3 mb-4 border-b border-border/20 pb-3">
                        <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em] border border-border/30 px-2 py-1 text-muted">
                            Legado
                        </span>
                        <span className="font-mono text-[11px] text-muted">Grupos inativos ou disbandados</span>
                        <span className="font-mono text-[10px] text-muted/40">{inactiveGroups.length}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 opacity-60">
                        {inactiveGroups.map(group => (
                            <GroupCard key={group.id} group={group} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}
