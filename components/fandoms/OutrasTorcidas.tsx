import Link from 'next/link'
import { contorno, tinta } from '@/lib/fandoms/cor'

export interface TorcidaVizinha { slug: string; nome: string; cor: string; grupo: string }

/** Torcidas para descobrir a seguir: mantém a pessoa navegando em vez de voltar à lista. */
export function OutrasTorcidas({ torcidas, coluna = false }: { torcidas: TorcidaVizinha[]; coluna?: boolean }) {
    if (torcidas.length === 0) return null
    return (
        <section aria-labelledby="outras-titulo">
            <h2 id="outras-titulo" className={coluna ? 'font-[family-name:var(--font-playfair)] text-[22px] font-extrabold' : 'font-[family-name:var(--font-playfair)] text-[28px] font-extrabold sm:text-[34px]'}>Descubra outras torcidas</h2>
            <ul className={`mt-4 grid gap-2.5 ${coluna ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4'}`}>
                {torcidas.map(t => (
                    <li key={t.slug}>
                        <Link href={`/fandoms/${t.slug}`} className={`flex flex-col px-3.5 py-2.5 transition-transform hover:-translate-y-0.5 shadow-[4px_4px_0_#15102b] dark:shadow-[4px_4px_0_#000] ${contorno(t.cor)}`} style={{ background: t.cor, color: tinta(t.cor) }}>
                            <span className="truncate text-[17px] font-black leading-tight">{t.nome}</span>
                            <span className="truncate text-[12px] font-bold opacity-85">{t.grupo}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    )
}
