import Image from 'next/image'
import Link from 'next/link'
import type { AniversarianteSemana } from '@/lib/artists/aniversarios'

const SERIF = 'font-[family-name:var(--font-playfair)]'

export function AniversariosSemana({ itens }: { itens: AniversarianteSemana[] }) {
    if (itens.length === 0) return null
    return (
        <section aria-labelledby="aniversarios-titulo" data-bloco="lista-aniversarios" className="page-wrap pb-8 pt-2 sm:pb-10">
            <div className="flex items-baseline justify-between gap-4">
                <h2 id="aniversarios-titulo" className={`${SERIF} text-[26px] font-semibold leading-tight sm:text-[32px]`}>
                    <span className="sm:hidden">Aniversários</span><span className="hidden sm:inline">Aniversários da semana</span>
                </h2>
                <Link href="/artists/birthdays" className="text-[13px] font-semibold text-accent sm:text-[14px]">Ver todos →</Link>
            </div>
            <ul className="-mx-4 mt-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:mt-5 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0">
                {itens.map((a, i) => (
                    <li key={a.slug} className="w-[168px] shrink-0 sm:w-auto">
                        <Link href={`/artists/${a.slug}`} data-posicao={i + 1}
                            className="flex h-full flex-col items-center gap-2.5 border border-border bg-surface px-2.5 py-4 text-center hover:border-accent/60 sm:flex-row sm:gap-3.5 sm:p-3.5 sm:text-left">
                            <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full bg-background sm:h-16 sm:w-16">
                                {a.foto
                                    ? <Image src={a.foto} alt="" fill sizes="72px" className="object-cover object-top" />
                                    : <span aria-hidden className="flex h-full w-full items-center justify-center bg-accent text-[26px] font-bold text-[#0d0b0f]">{a.nome.charAt(0)}</span>}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[14px] font-bold sm:text-[15px]">{a.nome}</span>
                                <span className="mt-0.5 block text-[12px] font-semibold text-accent sm:text-[13px]">{a.quando}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}
