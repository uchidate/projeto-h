import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import Link from '@/components/i18n/LocalizedLink'
import type { EntidadeDoCard } from '@/components/blog/BlogEntityCard'

const CONVITE: Record<EntidadeDoCard['tipo'], string> = {
    grupo: 'Integrantes, discografia e as últimas notícias.',
    artista: 'Carreira, obras e as últimas notícias.',
    producao: 'Elenco, sinopse e onde assistir.',
}
const ROTULO: Record<EntidadeDoCard['tipo'], string> = { grupo: 'Perfil do grupo', artista: 'Perfil do artista', producao: 'Sobre a produção' }

/**
 * Depois do texto: um convite para a página de quem o artigo trata.
 *
 * Medido em 2026-11 (Umami, humanos, 28 dias): o cartão de perfis citados teve 7,4%
 * de cliques (48 de 653 exibições) e a barra "Sugerido para você", 1,5% (6 de 392).
 * Quem lê quer a ficha da pessoa ou do grupo, então este bloco ocupa o lugar da barra
 * quando o artigo tem um protagonista. Sem protagonista, a barra continua.
 */
export function BlogPerfilPrincipal({ entidade, color }: { entidade: EntidadeDoCard; color?: string | null }) {
    const accent = color || 'var(--color-accent)'
    return (
        <aside data-bloco="artigo-perfil-principal" aria-label={`${ROTULO[entidade.tipo]}: ${entidade.name}`} className="not-prose">
            <Link href={entidade.href} className="group flex items-center gap-4 border bg-surface p-3 transition-colors hover:bg-background sm:gap-5 sm:p-4" style={{ borderColor: accent }}>
                <span className="relative block aspect-3/4 w-20 shrink-0 overflow-hidden bg-background sm:w-24">
                    {entidade.image && <Image src={entidade.image} alt="" fill sizes="96px" className="object-cover object-top" />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: accent }}>{ROTULO[entidade.tipo]}</span>
                    <span className="mt-1 block text-[20px] font-extrabold leading-tight text-foreground sm:text-[24px]">{entidade.name}</span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted sm:text-[14px]">{CONVITE[entidade.tipo]}</span>
                    <span className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-black" style={{ color: accent }}>
                        Ver perfil <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                </span>
            </Link>
        </aside>
    )
}
