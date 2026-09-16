'use client'

import { capturarErro } from '@/lib/sentryCliente'
import Link from 'next/link'
import { useEffect } from 'react'

export default function SiteError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        capturarErro(error, {
            tags: { error_boundary: 'site' },
            extra: error.digest ? { digest: error.digest } : undefined,
        })
    }, [error])

    return (
        <div className="page-wrap py-24 text-center">
            <p className="font-mono text-[11px] text-muted tracking-[0.08em] uppercase mb-4">Erro interno</p>
            <h1 className="text-[48px] font-black tracking-[-0.04em] leading-none mb-4">
                Algo deu errado<span className="text-accent">.</span>
            </h1>
            <p className="text-[15px] text-muted max-w-md mx-auto mb-8">
                Ocorreu um erro inesperado. Tente novamente ou volte à página inicial.
            </p>
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={reset}
                    className="font-mono text-[12px] font-semibold border border-border px-5 py-2.5 hover:border-accent hover:text-accent transition-colors"
                >
                    Tentar novamente
                </button>
                <Link
                    href="/"
                    className="font-mono text-[12px] font-semibold border border-accent-a11y bg-accent-a11y text-white px-5 py-2.5 hover:opacity-90 transition-opacity"
                >
                    Página inicial →
                </Link>
            </div>
        </div>
    )
}
