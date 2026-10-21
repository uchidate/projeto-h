import Link from 'next/link'

interface Props {
    companyName: string
    chaebolGroup?: string | null
    groupLink?: { slug: string; name: string } | null
    globalBrands?: string[]
}

/**
 * Diagrama estático (sem JS) grupo → empresa → marcas. Diferente do
 * MapaConexoes de artista/grupo: aqui `chaebol_group` e `global_brands` são
 * texto livre, não entidades navegáveis — só o grupo, às vezes, tem ficha
 * própria no acervo (ver findCompanyByName). Por isso não há recentrar.
 */
export function ConexoesChaebol({ companyName, chaebolGroup, groupLink, globalBrands = [] }: Props) {
    // Dado inválido no WP já visto (ex: ficha da Abib com chaebol_group = "Abib"
    // — a própria empresa): sem esse guard, o diagrama liga o nó a ele mesmo.
    const group = chaebolGroup && chaebolGroup.trim().toLowerCase() !== companyName.trim().toLowerCase()
        ? chaebolGroup
        : null
    const brands = globalBrands.filter(b => b.trim().toLowerCase() !== companyName.trim().toLowerCase())
    if (!group && brands.length === 0) return null

    return (
        <div className="rounded-2xl border border-border bg-surface/30 p-5 sm:p-8">
            <h2 className="mb-6 text-[15px] font-black tracking-tight">🔗 Conexões do grupo</h2>
            <div className="flex flex-col items-center gap-3">
                {group && (
                    <>
                        {groupLink ? (
                            <Link href={`/empresas/${groupLink.slug}`}
                                className="rounded-full border-2 border-accent bg-surface px-4 py-2 font-mono text-[12px] font-bold text-accent hover:bg-accent/10 transition-colors">
                                {group}
                            </Link>
                        ) : (
                            <span className="rounded-full border-2 border-border bg-surface px-4 py-2 font-mono text-[12px] font-bold text-muted">
                                {group}
                            </span>
                        )}
                        <span aria-hidden className="h-6 w-px bg-border" />
                    </>
                )}
                <span className="rounded-full bg-foreground px-4 py-1.5 font-mono text-[12px] font-bold text-background">
                    {companyName}
                </span>
                {brands.length > 0 && (
                    <>
                        <span aria-hidden className="h-6 w-px bg-border" />
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {brands.map(b => (
                                <span key={b} className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-foreground/80">
                                    {b}
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
