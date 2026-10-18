import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { confiancaDaNota } from '@/lib/tmdb/avaliacao'

interface Props {
    nota: number
    /** `null` quando o TMDB não respondeu: mostra só a nota guardada, sem afirmar a origem. */
    votos?: number | null
    /** `photo`: sobre a imagem do hero (texto claro). `page`: sobre o fundo da página. */
    tone?: 'photo' | 'page'
    size?: number
}

/**
 * Nota com origem e amostra. A nota vem do TMDB; com poucos votos ela é a opinião de
 * poucas pessoas (Our Beautiful Summer: 10,0 com 1 voto), então a estrela fica apagada e o
 * número de votos aparece junto, em vez de uma nota cheia que parece consenso.
 */
export function NotaProducao({ nota, votos = null, tone = 'page', size = 16 }: Props) {
    const t = useTranslations('profile.production')
    const confianca = votos == null ? 'confiavel' : confiancaDaNota(votos)
    if (confianca === 'sem-votos') return null
    const poucos = confianca === 'poucos-votos'
    const principal = tone === 'photo' ? 'text-white' : 'text-foreground'
    const suave = tone === 'photo' ? 'text-white/60' : 'text-muted'

    return (
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5" title={poucos ? t('ratingFewVotesTitle') : undefined}>
            <span className={`flex items-center gap-1.5 font-bold ${poucos ? suave : principal}`}>
                <Star size={size} className={poucos ? 'text-current opacity-60' : 'text-amber-400'} fill="currentColor" aria-hidden />
                {Number(nota).toFixed(1).replace('.', ',')}<span className={`font-normal ${suave}`}>/10</span>
            </span>
            {votos != null && (
                <span className={`font-mono text-[11px] ${suave}`}>
                    {t(poucos ? 'ratingFewVotes' : 'ratingVotes', { count: votos })}
                </span>
            )}
        </span>
    )
}
