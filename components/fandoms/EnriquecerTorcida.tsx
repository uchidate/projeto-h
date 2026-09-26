import type { WPGroup } from '@/lib/wordpress/types'

// Só o dado usado por NomeDaTorcida.
const TITULO = 'font-[family-name:var(--font-playfair)] text-[28px] font-extrabold leading-tight sm:text-[34px]'

interface Props { grupos: WPGroup[]; nome: string; cor: string; ink: string }

function dadosDe(grupo: WPGroup) {
    const acf = (grupo.acf ?? {}) as Record<string, unknown>
    return { curiosidades: Array.isArray(acf.curiosidades) ? (acf.curiosidades as unknown[]).filter((c): c is string => typeof c === 'string' && c.trim().length > 0) : [] }
}

/** A história do nome da torcida: é a única curiosidade que é da torcida e não do grupo (o resto já está na ficha do grupo). */
export function NomeDaTorcida({ grupos, nome, cor, ink }: Props) {
    // Torcida com vários grupos: procura a história do nome em todos.
    const doNome = grupos.flatMap(g => dadosDe(g).curiosidades).find(c => c.toLowerCase().includes(nome.toLowerCase())) ?? null
    if (!doNome) return null
    return (
        <section aria-labelledby="nome-titulo">
            <h2 id="nome-titulo" className={TITULO}>De onde vem o nome {nome}?</h2>
            <p className="mt-5 p-5 text-[17px] font-medium leading-relaxed shadow-[6px_6px_0_#15102b] dark:shadow-[6px_6px_0_#000] sm:p-7 sm:text-[19px]" style={{ background: cor, color: ink }}>{doNome}</p>
        </section>
    )
}
