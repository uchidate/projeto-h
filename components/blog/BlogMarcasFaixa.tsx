import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import type { MarcaDaCategoria } from '@/lib/blog/categoriaLoja'

/**
 * Faixa de marcas da categoria: logo e nome, rolável de lado, uma linha só para
 * não empurrar os artigos para baixo no celular. Cada marca leva à loja dela.
 * Marca sem logo entra só com o nome.
 */
export function BlogMarcasFaixa({ marcas, rotulo, todasHref = '/empresas' }: { marcas: MarcaDaCategoria[]; rotulo: string; todasHref?: string }) {
    return (
        <section data-bloco="blog-marcas" aria-label={`Marcas de ${rotulo} na loja`} className="mt-5">
            <div className="mb-2 flex items-baseline gap-3">
                <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-foreground/60">Marcas na loja</h2>
                <Link href={todasHref} className="ml-auto font-mono text-[11px] text-muted transition-colors hover:text-accent">todas as marcas →</Link>
            </div>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {marcas.map(m => (
                    <li key={m.slug} className="shrink-0">
                        <Link href={`/loja/empresa/${m.slug}`} title={`${m.produtos} produto${m.produtos !== 1 ? 's' : ''} de ${m.nome} na loja`}
                            className="flex h-[76px] w-[140px] flex-col items-center justify-center gap-0.5 border border-border bg-background px-2 transition-colors hover:border-accent/60">
                            {m.logo ? (
                                <span className="relative block h-11 w-full overflow-hidden">
                                    {/* Os logos são quadrados com margem; cobrir a caixa larga recorta só a margem vazia. */}
                                    <Image src={m.logo} alt={m.nome} fill sizes="140px" className="object-cover" />
                                </span>
                            ) : (
                                <span className="line-clamp-2 text-center text-[13px] font-bold leading-tight text-foreground">{m.nome}</span>
                            )}
                            <span className="font-mono text-[10px] text-muted">{m.produtos} produto{m.produtos !== 1 ? 's' : ''}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}
