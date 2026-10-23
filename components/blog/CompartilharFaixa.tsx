'use client'

import { useState } from 'react'

/** Copia (ou compartilha) o link direto da faixa, com a âncora do cartão. */
export function CompartilharFaixa({ id, titulo }: { id: string; titulo: string }) {
    const [copiado, setCopiado] = useState(false)

    async function compartilhar() {
        const url = `${window.location.origin}${window.location.pathname}#${id}`
        try {
            if (typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches) {
                await navigator.share({ title: titulo, url })
                return
            }
            await navigator.clipboard.writeText(url)
            setCopiado(true)
            window.setTimeout(() => setCopiado(false), 2000)
        } catch {
            // compartilhamento cancelado ou área de transferência indisponível: nada a fazer
        }
    }

    return (
        <button
            type="button"
            onClick={compartilhar}
            aria-label={`Copiar o link da faixa ${titulo}`}
            className="absolute right-3 top-[2.5rem] inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-xs font-semibold text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
            <span aria-live="polite">{copiado ? 'Link copiado' : 'Compartilhar'}</span>
        </button>
    )
}
