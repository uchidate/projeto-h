'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { BrandDot } from '@/components/ui/BrandDot'
import { registerUser } from '@/lib/wordpress/userApi'
import { BotaoGoogle } from '@/components/features/BotaoGoogle'
import { trackCadastro, trackLogin } from '@/lib/analytics'

export function CadastroForm({ googleAtivo = false }: { googleAtivo?: boolean }) {
    const router = useRouter()
    const params = useSearchParams()
    const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        if (form.password.length < 8) {
            setError('A senha deve ter no mínimo 8 caracteres.')
            return
        }
        setLoading(true)
        try {
            await registerUser(form)
            // A conta existe a partir daqui, mesmo que o login automático abaixo falhe.
            trackCadastro('senha')
            const res = await signIn('credentials', {
                username: form.email,
                password: form.password,
                redirect: false,
            })
            if (res?.error) {
                setError('Conta criada! Faça login para continuar.')
                router.push(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`)
            } else {
                trackLogin('senha')
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-wrap flex min-h-[70vh] items-center justify-center py-16">
            <div className="w-full max-w-sm">
                <div className="mb-8">
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-accent mb-2">Conta</p>
                    <h1 className="text-[32px] font-black leading-tight tracking-[-0.03em]">
                        Criar conta<BrandDot />
                    </h1>
                    <p className="mt-2 text-[14px] text-muted">
                        Crie uma conta para sincronizar favoritos, Quero ver e seu painel em qualquer dispositivo.
                    </p>
                </div>

                {googleAtivo && (
                    <div className="mb-6">
                        <BotaoGoogle origem="cadastro" callbackUrl={callbackUrl} rotulo="Criar conta com Google" />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1.5">Nome</label>
                        <input
                            type="text"
                            required
                            autoComplete="name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                            placeholder="Seu nome"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1.5">E-mail</label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="w-full border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black uppercase tracking-wider text-muted mb-1.5">Senha</label>
                        <div className="relative">
                            <input
                                type={showPwd ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="w-full border border-border bg-surface px-3 py-2.5 pr-10 text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden"
                                placeholder="Mínimo 8 caracteres"
                            />
                            <button type="button" onClick={() => setShowPwd(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-[13px] text-red-500 font-semibold">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-accent-a11y px-4 py-3 text-[13px] font-black text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                        <UserPlus size={15} />
                        {loading ? 'Criando conta…' : 'Criar conta'}
                    </button>
                </form>

                <p className="mt-6 text-center text-[13px] text-muted">
                    Já tem conta?{' '}
                    <Link href={`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-accent font-bold hover:underline">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    )
}
