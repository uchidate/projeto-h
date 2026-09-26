import Image from 'next/image'
import Link from 'next/link'

interface Props {
    grupo: { name: string; slug: string; color?: string | null }
    artistas: { name: string; slug: string; image: string | null }[]
}

/**
 * Do artigo para a ficha: rostos de quem o texto cita, com link para o perfil do
 * grupo. A ficha tem mais anúncios e mais tempo de leitura que o artigo, então é
 * o caminho para uma segunda página na sessão.
 */
export function BlogEntityCard({ grupo, artistas }: Props) {
    const accent = grupo.color || 'var(--color-accent)'
    return (
        <aside data-bloco="artigo-card-grupo" aria-label={`Conheça ${grupo.name}`} className="not-prose my-8 border bg-surface p-4 sm:p-5" style={{ borderColor: accent }}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>Conheça o grupo</p>
                    <p className="mt-1 text-[19px] font-extrabold leading-tight text-foreground sm:text-[20px]">{grupo.name}</p>
                </div>
                <Link href={`/groups/${grupo.slug}`} className="touch-target text-[13px] font-bold hover:underline" style={{ color: accent }}>Ver a ficha completa →</Link>
            </div>
            <div className="-mx-1 mt-3.5 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
                {artistas.map(a => (
                    <div key={a.slug} className="w-[84px] shrink-0 sm:w-auto">
                        <Link href={`/artists/${a.slug}`} className="block">
                            <span className="relative block aspect-3/4 overflow-hidden bg-background">
                                {a.image && <Image src={a.image} alt="" fill sizes="(max-width: 640px) 84px, 100px" className="object-cover object-top" />}
                            </span>
                            <span className="mt-1.5 block truncate text-center text-[12px] font-bold text-foreground">{a.name}</span>
                        </Link>
                    </div>
                ))}
            </div>
        </aside>
    )
}
