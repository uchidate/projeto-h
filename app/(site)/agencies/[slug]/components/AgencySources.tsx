type SourceHost = { host: string; count: number; sample: string }

export function AgencySources({ citedSourcesCount, sourcesByHost }: { citedSourcesCount: number; sourcesByHost: SourceHost[] }) {
    return (
        <aside aria-label="Como apuramos" className="border border-border bg-surface px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-(--ac)">Como apuramos</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    {citedSourcesCount} citações · {sourcesByHost.length} veículos
                </p>
            </div>
            <p className="mt-3 max-w-3xl text-[13px] leading-6 text-foreground/65">
                Números, capítulos e citações deste perfil apontam para a fonte primária no ponto em que aparecem.
                Priorizamos material institucional e imprensa verificável; opinião só entra atribuída.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
                {sourcesByHost.map(source => (
                    <li key={source.host} className="border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-foreground/60">
                        {source.host}
                        <span className="ml-1.5 font-black text-muted">×{source.count}</span>
                    </li>
                ))}
            </ul>
        </aside>
    )
}
