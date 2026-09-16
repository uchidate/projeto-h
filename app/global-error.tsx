'use client'

import { htmlLang } from '@/lib/i18n/format'
import { capturarErro } from '@/lib/sentryCliente'
import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        capturarErro(error)
    }, [error])

    return (
        <html lang={htmlLang()}>
            <body>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', gap: 16 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 900 }}>Algo deu errado</h1>
                    <p style={{ color: '#666', fontSize: 14 }}>O erro foi registrado automaticamente.</p>
                    <button onClick={reset} style={{ padding: '8px 20px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                        Tentar novamente
                    </button>
                </div>
            </body>
        </html>
    )
}
