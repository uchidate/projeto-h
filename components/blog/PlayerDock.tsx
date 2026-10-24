'use client'

import { useTranslations } from 'next-intl'

export interface DadosDoDock {
    titulo: string
    pausado: boolean
    capa?: string
    numero?: number
    total?: number
    posicao: number
    duracao: number
}

interface Props extends DadosDoDock {
    onAlternar: () => void
    onIr: () => void
    onFechar: () => void
    onAnterior?: () => void
    onProxima?: () => void
    onBuscar: (segundos: number) => void
}

const BOTAO = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

function tempo(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Barra fixa que acompanha a faixa que está tocando enquanto o fã rola o texto. É um elemento
 * `fixed` (não `sticky` dentro do fluxo), então não treme com a rolagem nem com o cabeçalho que
 * esconde e volta. O som continua no player da própria faixa; aqui ficam os controles, a capa,
 * a posição na tracklist e a barra de progresso.
 */
export function PlayerDock({ titulo, pausado, capa, numero, total, posicao, duracao, onAlternar, onIr, onFechar, onAnterior, onProxima, onBuscar }: Props) {
    const t = useTranslations('client.playerDock')
    const pct = duracao > 0 ? Math.min(100, (posicao / duracao) * 100) : 0
    return (
        <div
            role="region"
            aria-label={t('region')}
            data-player-dock
            className="not-prose fixed bottom-[calc(var(--bottom-nav-h,0px)+8px)] left-3 right-16 z-[210] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgb(0_0_0/0.28)] ring-1 ring-[var(--color-accent)]/30 lg:bottom-6 lg:left-6 lg:right-auto lg:w-[28rem]"
        >
            <div className="flex items-center gap-3 p-2 pr-1">
                <button type="button" onClick={onIr} aria-label={t('goTo', { title: titulo })} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                    <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {capa && <img src={capa} alt="" className="!m-0 block h-full w-full max-w-none object-cover" />}
                        <span className={`oc-eq absolute bottom-1 left-1 ${pausado ? 'oc-eq--pausado' : ''}`} aria-hidden="true"><i /><i /><i /></span>
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[var(--color-foreground)]" aria-live="polite">{titulo}</span>
                        <span className="block truncate text-xs text-[var(--color-muted)]">
                            {numero && total ? t('trackOf', { n: numero, total }) : t('album')} · {pausado ? t('paused') : t('playing')}
                        </span>
                    </span>
                </button>
                {onAnterior && <button type="button" onClick={onAnterior} className={`${BOTAO} hidden sm:inline-flex`} aria-label={t('previous')}><span aria-hidden="true">⏮</span></button>}
                <button type="button" onClick={onAlternar} className={`${BOTAO} h-11 w-11 bg-[var(--color-accent)] !text-white hover:!bg-[var(--color-accent)] hover:opacity-90`} aria-label={pausado ? t('play') : t('pause')}>
                    <span aria-hidden="true">{pausado ? '▶' : '❚❚'}</span>
                </button>
                {onProxima && <button type="button" onClick={onProxima} className={`${BOTAO} hidden sm:inline-flex`} aria-label={t('next')}><span aria-hidden="true">⏭</span></button>}
                <button type="button" onClick={onFechar} className={BOTAO} aria-label={t('close')}><span aria-hidden="true">✕</span></button>
            </div>
            <div className="flex items-center gap-2 px-3 pb-2 text-[11px] tabular-nums text-[var(--color-muted)]">
                <span>{tempo(posicao)}</span>
                <input
                    type="range"
                    min={0}
                    max={Math.max(1, Math.floor(duracao / 1000))}
                    value={Math.floor(posicao / 1000)}
                    onChange={(e) => onBuscar(Number(e.target.value))}
                    aria-label={t('seek')}
                    disabled={duracao <= 0}
                    className="h-1 flex-1 cursor-pointer accent-[var(--color-accent)]"
                    style={{ background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-border) ${pct}%)` }}
                />
                <span>{tempo(duracao)}</span>
            </div>
        </div>
    )
}
