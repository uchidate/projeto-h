import { SITE_NAME } from '@/lib/constants/site'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, baseOG, baseTwitter } from '@/lib/constants/site'
import { POSITION_LABELS } from '@/lib/constants/positions'

export const revalidate = 3600

const POSITION_DESCRIPTIONS: Record<string, string> = {
    leader: 'porta-voz oficial do grupo, escolhido pela agência',
    main_vocal: 'voz técnica mais forte do grupo',
    lead_vocal: 'apoio vocal direto ao main vocal',
    sub_vocal: 'canta sem centralidade técnica principal',
    main_dancer: 'referência técnica de coreografia',
    lead_dancer: 'apoio direto na coreografia',
    main_rapper: 'referência técnica de rap',
    sub_rapper: 'apoio no rap',
    visual: 'rosto mais associado à imagem pública do grupo',
    center: 'posição física central em coreografias e capas',
    maknae: 'membro mais novo do grupo',
}

export const metadata: Metadata = {
    title: 'Posições em Grupos de K-Pop',
    description: `Veja quem é líder, main vocal, visual, center e maknae em cada grupo de k-pop cadastrado no ${SITE_NAME}.`,
    alternates: { canonical: `${SITE_URL}/positions` },
    openGraph: baseOG(`${SITE_URL}/positions`),
    twitter: baseTwitter(),
}

export default function PositionsIndexPage() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">Posições em Grupos de K-Pop</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
                Cada posição define uma função real dentro do grupo — não é rótulo de perfil.{' '}
                <Link href="/blog/posicoes-grupo-kpop-lider-vocal-visual-maknae-guia" className="underline decoration-dotted underline-offset-2 hover:text-accent">
                    Entenda o sistema completo
                </Link>.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(POSITION_LABELS).map(([value, label]) => (
                    <Link
                        key={value}
                        href={`/positions/${value}`}
                        className="group border border-border bg-surface p-4 transition-colors hover:border-accent"
                    >
                        <p className="font-bold text-foreground group-hover:text-accent">{label}</p>
                        <p className="mt-0.5 text-xs text-muted">{POSITION_DESCRIPTIONS[value]}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
