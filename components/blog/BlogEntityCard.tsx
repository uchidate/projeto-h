import Image from 'next/image'
import Link from 'next/link'

export interface EntidadeDoCard { name: string; href: string; image: string | null; tipo: 'grupo' | 'artista' }

interface Props {
    titulo: string
    itens: EntidadeDoCard[]
    color?: string | null
}

/**
 * Do artigo para as fichas: rostos de quem o texto cita, cada um com link para o
 * próprio perfil. A ficha tem mais anúncios e mais tempo de leitura que o artigo,
 * então é o caminho para uma segunda página na sessão.
 */
export function BlogEntityCard({ titulo, itens, color }: Props) {
    const accent = color || 'var(--color-accent)'
    return (
        <aside data-bloco="artigo-card-entidades" aria-label={titulo} className="not-prose my-8 border bg-surface p-4 sm:p-5" style={{ borderColor: accent }}>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>Conheça</p>
            <p className="mt-1 text-[19px] font-extrabold leading-tight text-foreground sm:text-[20px]">{titulo}</p>
            <div className="-mx-1 mt-3.5 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] sm:overflow-visible">
                {itens.map(a => (
                    <div key={a.href} className="w-[84px] shrink-0 sm:w-auto">
                        <Link href={a.href} className="block">
                            <span className="relative block aspect-3/4 overflow-hidden bg-background">
                                {a.image && <Image src={a.image} alt="" fill sizes="(max-width: 640px) 84px, 110px" className="object-cover object-top" />}
                            </span>
                            <span className="mt-1.5 block truncate text-center text-[12px] font-bold text-foreground">{a.name}</span>
                            <span className="block text-center font-mono text-[9px] uppercase tracking-[0.08em] text-muted">{a.tipo === 'grupo' ? 'Grupo' : 'Artista'}</span>
                        </Link>
                    </div>
                ))}
            </div>
        </aside>
    )
}
