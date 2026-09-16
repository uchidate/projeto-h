'use client'

/**
 * Entrada por Google.
 *
 * Acima do formulário, e não abaixo: o caminho de menor atrito precisa ser o
 * primeiro que a pessoa vê. Embaixo, ele só é encontrado por quem já desistiu
 * de preencher — tarde demais para evitar a desistência.
 *
 * Só é renderizado quando o provider existe (ver googleConfigurado em
 * lib/auth.ts). Um botão que leva a erro de configuração é pior do que
 * nenhum botão.
 */

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { trackAutenticacaoGoogleIniciada } from '@/lib/analytics'

export function BotaoGoogle({ callbackUrl, rotulo, origem }: { callbackUrl: string; rotulo: string; origem: 'entrar' | 'cadastro' }) {
    const [indo, setIndo] = useState(false)

    return (
        <div className="space-y-4">
            <button
                type="button"
                disabled={indo}
                onClick={() => { setIndo(true); trackAutenticacaoGoogleIniciada(origem); void signIn('google', { callbackUrl }) }}
                className="w-full flex items-center justify-center gap-2.5 border border-border bg-surface px-4 py-3 text-[13px] font-black transition-colors hover:border-accent disabled:opacity-60"
            >
                {/* SVG inline: o logo oficial vem de um domínio que a CSP não
                    libera, e um <img> quebrado num botão de login parece site
                    fora do ar. */}
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.4 6.6-16.3z" />
                    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.2l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.5 46 24 46z" />
                    <path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.3-3.1.7-4.4v-5.7H4.5C2.9 17.1 2 20.4 2 24s.9 6.9 2.5 10.1l7.3-5.7z" />
                    <path fill="#EA4335" d="M24 10.4c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 3.9 29.9 2 24 2 15.5 2 8.1 6.8 4.5 13.9l7.3 5.7c1.7-5.2 6.5-9.2 12.2-9.2z" />
                </svg>
                {indo ? 'Abrindo…' : rotulo}
            </button>

            <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted">ou</span>
                <span className="h-px flex-1 bg-border" />
            </div>
        </div>
    )
}
