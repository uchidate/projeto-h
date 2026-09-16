'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BrandDot } from '@/components/ui/BrandDot'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { BotaoGoogle } from '@/components/features/BotaoGoogle'
import { trackLogin } from '@/lib/analytics'

export function LoginForm({ googleAtivo = false }: { googleAtivo?: boolean }) {
    const router = useRouter()
    const params = useSearchParams()
    const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
    const cadastroHref = `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}`

    const [form, setForm] = useState({ username: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        const res = await signIn('credentials', {
            username: form.username,
            password: form.password,
            redirect: false,
        })
        setLoading(false)
        if (res?.error) {
            setError('E-mail ou senha incorretos.')
        } else {
            trackLogin('senha')
            router.push(callbackUrl)
            router.refresh()
        }
    }

    return (
        <div className="page-wrap flex min-h-[70vh] items-center justify-center py-16">
            <div className="w-full max-w-sm">
                <div className="mb-8">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent mb-2">Conta</p>
                    <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em]">
                        Entrar<BrandDot />
                    </h1>
                    <p className="mt-2 text-[14px] text-muted">
                        Acesse favoritos, lista e seu painel personalizado.
                    </p>
                </div>

                {googleAtivo && (
                    <div className="mb-6">
                        <BotaoGoogle origem="entrar" callbackUrl={callbackUrl} rotulo="Entrar com Google" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="login-username" className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1.5">
                            E-mail ou usuário
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            autoComplete="username"
                            required
                            value={form.username}
                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                            className="w-full border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1.5">
                            Senha
                        </label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPwd ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="w-full border border-border bg-surface px-3 py-2.5 pr-10 text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                                placeholder="••••••••"
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-[13px] text-red-500 font-semibold">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-accent-a11y px-4 py-3 text-[13px] font-black text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        <LogIn size={15} />
                        {loading ? 'Entrando…' : 'Entrar'}
                    </button>
                </form>

                <p className="mt-6 text-center text-[13px] text-muted">
                    Ainda não tem conta?{' '}
                    <Link href={cadastroHref} className="text-accent font-bold hover:underline">
                        Criar conta
                    </Link>
                </p>
            </div>
        </div>
    )
}
