interface Props {
    hasMembers: boolean
    hasDiscography: boolean
    hasFacts: boolean
    hasRelated: boolean
    hasPosts: boolean
    hasSocial: boolean
    hasColor: boolean
    hasBio: boolean
}

export function GroupQuickNav({
    hasMembers,
    hasDiscography,
    hasFacts,
    hasRelated,
    hasPosts,
    hasSocial,
    hasColor,
    hasBio,
}: Props) {
    return (
        <div className="border-b border-border bg-surface/40">
            <div className="page-wrap py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {hasMembers     && <a href="#membros"      className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Membros</a>}
                    {hasDiscography && <a href="#discografia"  className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Discografia</a>}
                    {hasFacts       && <a href="#conquistas"   className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Conquistas</a>}
                    {hasFacts       && <a href="#timeline"     className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Timeline</a>}
                    {hasRelated     && <a href="#relacionados" className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Relacionados</a>}
                    {hasPosts       && <a href="#artigos"      className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Artigos</a>}
                    {hasSocial      && <a href="#redes"        className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Redes</a>}
                    {hasColor       && <a href="#identidade"   className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Identidade</a>}
                    {hasBio         && <a href="#sobre"        className="border border-border px-3 py-1 font-mono text-[11px] font-semibold text-muted hover:border-foreground hover:text-foreground transition-colors">Sobre</a>}
                </div>
            </div>
        </div>
    )
}
