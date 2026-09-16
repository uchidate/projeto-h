'use client'

import { SessionProvider as NextAuthProvider } from 'next-auth/react'
import { SincronizaPendentes } from '@/components/providers/SincronizaPendentes'

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <NextAuthProvider>
            {/*
              * Dentro do provider e fora das páginas: a fusão precisa do
              * useSession e tem que acontecer em qualquer rota onde o login
              * termine, não só em /entrar — o callbackUrl devolve o usuário
              * para a página onde ele estava favoritando.
              */}
            <SincronizaPendentes />
            {children}
        </NextAuthProvider>
    )
}
