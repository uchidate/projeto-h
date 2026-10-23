export interface FaixaDoIndice {
    id: string
    titulo: string
}

/**
 * Atalhos para as faixas de um artigo de álbum: o fã que quer ouvir uma música pula direto
 * para ela em vez de rolar o texto. No celular é uma faixa que rola de lado.
 */
export function IndiceDeFaixas({ faixas }: { faixas: FaixaDoIndice[] }) {
    return (
        <nav aria-label="Faixas do álbum" className="not-prose -mx-4 my-6 px-4 sm:mx-0 sm:px-0" data-indice-de-faixas={faixas.length}>
            <ol className="!m-0 !flex !flex-row !list-none !gap-2 !overflow-x-auto !p-0 !pb-2 sm:!flex-wrap sm:!overflow-visible">
                {faixas.map(({ id, titulo }) => (
                    <li key={id} className="!m-0 !p-0 shrink-0 before:!content-none">
                        <a
                            href={`#${id}`}
                            className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-foreground)] no-underline transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                        >
                            {titulo}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    )
}
