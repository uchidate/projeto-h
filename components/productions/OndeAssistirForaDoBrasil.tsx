import { useLocale, useTranslations } from 'next-intl'
import type { Disponibilidade } from '@/lib/tmdb/watchProviders'
import { AtribuicaoJustWatch } from '@/components/productions/AtribuicaoJustWatch'

/**
 * Resposta direta para quem busca "onde assistir" um título que não está em
 * nenhum streaming no Brasil.
 *
 * Medido em 2026-10 (Search Console, 28 dias): "onde assistir", "online",
 * "completo" e "ep 1" respondem por boa parte dos cliques de O Retorno de um
 * Gangster no Ensino Médio — e o TMDB não lista nenhum provedor no Brasil para
 * ele (Hulu nos EUA; wavve, Watcha e TVING na Coreia). O cartão de plataformas
 * não existe sem dado, e a resposta ficava a ~5 telas de rolagem, onde só 32%
 * chegam. Aqui a resposta honesta ("não está disponível por aqui") vem logo
 * abaixo do topo e diz onde existe.
 *
 * Só renderiza quando o TMDB conhece o título (alguma região) e nenhuma delas é
 * o Brasil: ausência de dado não vira "indisponível".
 */
export function OndeAssistirForaDoBrasil({ disponibilidade, className = '' }: { disponibilidade: Disponibilidade | null; className?: string }) {
    const t = useTranslations('profile.production.summary')
    const locale = useLocale()
    if (!disponibilidade || disponibilidade.brasil.length > 0 || disponibilidade.fora.length === 0) return null
    const regioes = new Intl.DisplayNames([locale], { type: 'region' })

    return (
        <div data-bloco="ficha-producao-onde-assistir-fora" className={`min-w-0 max-w-[760px] border border-border bg-surface p-4 sm:p-6 ${className}`}>
            <h2 className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted">{t('whereToWatch')}</h2>
            <p className="text-[16px] font-bold leading-snug text-foreground">{t('notInBrazil')}</p>
            <p className="mt-3 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-muted">{t('availableAbroad')}</p>
            <ul className="mt-2 flex flex-col gap-1.5">
                {disponibilidade.fora.map(r => (
                    <li key={r.regiao} className="text-[15px] leading-snug text-foreground/90">
                        <span className="font-semibold">{regioes.of(r.regiao) ?? r.regiao}:</span> {r.provedores.join(', ')}
                    </li>
                ))}
            </ul>
            <AtribuicaoJustWatch className="mt-3.5 block" />
        </div>
    )
}
