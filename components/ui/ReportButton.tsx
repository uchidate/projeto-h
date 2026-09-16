'use client'

import { useTranslations } from 'next-intl'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Flag, X, Check, Loader2 } from 'lucide-react'

type TargetType = 'artist' | 'group' | 'production'
type Category = 'foto_errada' | 'membro_errado' | 'dado_incorreto' | 'outro'

interface Props {
    targetType: TargetType
    targetId: number
    variant?: 'default' | 'dark'
}

const CATEGORY_OPTIONS: { value: Category }[] = [
    { value: 'foto_errada' },
    { value: 'membro_errado' },
    { value: 'dado_incorreto' },
    { value: 'outro' },
]

export function ReportButton({ targetType, targetId, variant = 'default' }: Props) {
    const tc = useTranslations('client')
    const [isOpen, setIsOpen] = useState(false)
    const [category, setCategory] = useState<Category>('dado_incorreto')
    const [message, setMessage] = useState('')
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

    const close = () => {
        setIsOpen(false)
        setStatus('idle')
        setMessage('')
        setCategory('dado_incorreto')
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setStatus('sending')
        try {
            const res = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_type: targetType, target_id: targetId, category, message }),
            })
            if (!res.ok) throw new Error('failed')
            setStatus('sent')
        } catch {
            setStatus('error')
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={
                    variant === 'dark'
                        ? 'touch-target flex min-w-(--tap-target-min) items-center justify-center border border-white/25 bg-black/30 text-white/70 backdrop-blur-xs transition-colors hover:border-white/50 hover:text-white'
                        : 'touch-target flex min-w-(--tap-target-min) items-center justify-center border border-border text-muted transition-colors hover:border-accent hover:text-accent'
                }
                aria-label={tc('report.buttonLabel')}
                title={tc('report.buttonTitle')}
            >
                <Flag size={14} />
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-500 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
                        onClick={close}
                        aria-hidden="true"
                    />
                    <div
                        className="animate-fadeInUp relative w-full max-w-md overflow-hidden border border-border bg-background shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label={tc('report.dialogLabel')}
                    >
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <p className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest text-foreground">
                                <Flag size={14} className="text-accent" /> Reportar erro
                            </p>
                            <button type="button" onClick={close} className="text-muted hover:text-foreground" aria-label={tc('common.close')}>
                                <X size={16} />
                            </button>
                        </div>

                        {status === 'sent' ? (
                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                <Check size={28} className="text-accent" />
                                <p className="text-[14px] font-semibold text-foreground">{tc('report.sent')}</p>
                                <p className="text-[13px] text-muted">{tc('report.willReview')}</p>
                                <button
                                    type="button"
                                    onClick={close}
                                    className="mt-2 border border-border px-3 py-1.5 text-[12px] font-bold text-muted hover:border-foreground hover:text-foreground"
                                >
                                    {tc('common.close')}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-4">
                                <div>
                                    <label htmlFor="report-category" className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted">
                                        {tc('report.whatsWrong')}
                                    </label>
                                    <select
                                        id="report-category"
                                        value={category}
                                        onChange={e => setCategory(e.target.value as Category)}
                                        className="w-full border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-hidden focus:border-accent"
                                    >
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{tc(`report.category.${opt.value}`)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="report-message" className="mb-1 block text-[11px] font-black uppercase tracking-widest text-muted">
                                        {tc('report.details')}
                                    </label>
                                    <textarea
                                        id="report-message"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        maxLength={1000}
                                        rows={3}
                                        placeholder={tc('report.placeholder')}
                                        className="w-full resize-none border border-border bg-background px-3 py-2 text-[14px] text-foreground outline-hidden placeholder:text-muted focus:border-accent"
                                    />
                                </div>

                                {status === 'error' && (
                                    <p className="text-[13px] text-red-500">{tc('report.error')}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'sending'}
                                    className="flex items-center justify-center gap-2 border border-accent bg-accent/10 px-3 py-2.5 text-[13px] font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-60"
                                >
                                    {status === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                                    {tc('report.submit')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
