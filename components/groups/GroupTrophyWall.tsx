'use client'

import { useTranslations } from 'next-intl'

import { Trophy, Music2, Star, Globe, Crown, Zap, Play } from 'lucide-react'
import { BlockHeader } from '@/components/blocks/BlockHeader'

interface Props {
    curiosidades: string[]
    accent: string
    groupName: string
    /** Valores já exibidos como métrica em "Em números" — o fato equivalente é
     *  omitido aqui para o leitor não encontrar o mesmo número duas vezes. */
    shownMetricValues?: string[]
}

/** Só valores com 3+ dígitos são distintivos o bastante para deduplicar:
 *  "1,17 milhão" e "385.501" identificam um fato; "45", "nº 2" e "1ª" não. */
function isDistinctive(value: string) {
    return (value.match(/\d/g) ?? []).length >= 3
}

type Category = 'youtube' | 'billboard' | 'guinness' | 'live' | 'royal' | 'streaming' | 'record'

// A categoria é distinguida pelo ícone e pelo rótulo, não por cor própria: sete
// cores de categoria brigavam com o accent único do artista e faziam a seção
// parecer de outro site. A cor aqui é sempre a do perfil.
const CATEGORY_META: Record<Category, { label: string; icon: React.ReactNode }> = {
    youtube:   { label: 'YouTube',   icon: <Play className="h-3.5 w-3.5" /> },
    billboard: { label: 'Billboard', icon: <Music2 className="h-3.5 w-3.5" /> },
    guinness:  { label: 'Guinness',  icon: <Trophy className="h-3.5 w-3.5" /> },
    live:      { label: 'Ao Vivo',   icon: <Zap className="h-3.5 w-3.5" /> },
    royal:     { label: 'Realeza',   icon: <Crown className="h-3.5 w-3.5" /> },
    streaming: { label: 'Streaming', icon: <Globe className="h-3.5 w-3.5" /> },
    record:    { label: 'Recorde',   icon: <Star className="h-3.5 w-3.5" /> },
}

// Termos curtos e ambíguos exigem limite de palavra: "rei" como substring casa
// dentro de "fevereiro" e "Coreia", rotulando fatos comuns como Realeza.
const WORD = (term: string) => new RegExp(`\\b${term}\\b`)

function detectCategory(text: string): Category {
    const t = text.toLowerCase()
    if (t.includes('youtube') || t.includes('visualizaç') || WORD('mv').test(t) || t.includes('views')) return 'youtube'
    if (t.includes('billboard') || t.includes('chart') || t.includes('hot 100')) return 'billboard'
    if (t.includes('guinness') || t.includes('mundial')) return 'guinness'
    if (t.includes('coachella') || t.includes('tour') || t.includes('show') || t.includes('apresent')) return 'live'
    if (WORD('rei').test(t) || WORD('mbe').test(t) || t.includes('buckingham') || t.includes('condecorou')) return 'royal'
    if (t.includes('spotify') || t.includes('stream') || t.includes('bilh')) return 'streaming'
    return 'record'
}

export function GroupTrophyWall({ curiosidades, accent, groupName, shownMetricValues = [] }: Props) {
    const tc = useTranslations('client')
    const dedupeKeys = shownMetricValues.filter(isDistinctive).map(v => v.toLowerCase())
    const facts = curiosidades
        .filter(c => !c.startsWith('HISTÓRICO|'))
        .filter(c => {
            const text = c.toLowerCase()
            return !dedupeKeys.some(key => text.includes(key))
        })
    if (facts.length === 0) return null

    return (
        // Medida no <section>: cabeçalho, grade e rodapé partilham a mesma borda
        // direita. Aplicá-la só na grade deixa o rodapé pendurado 240px além.
        <section id="conquistas" className="profile-measure">
            <BlockHeader title={tc('trophy.title')} eyebrow={tc('common.dossier')} tone="muted"
                icon={<Trophy className="h-4 w-4" style={{ color: accent }} />}
                meta={<p className="font-mono text-[10px] uppercase tracking-widest text-muted">{tc('trophy.count', { count: facts.length })}</p>} />

            {/* Fio de cabeça por entrada em vez de caixa fechada: a voz editorial
                separa por régua e respiro, não por moldura. Contagem ímpar faz o
                último ocupar as duas colunas para não ficar pendurado. */}
            <div className="grid gap-x-10 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                {facts.map((text, i) => {
                    const cat = detectCategory(text)
                    const meta = CATEGORY_META[cat]
                    return (
                        <div key={i} className="flex flex-col border-t border-border/70 py-5">
                            <div className="flex items-center gap-2" style={{ color: accent }}>
                                {meta.icon}
                                <span className="font-mono text-[10px] font-black uppercase leading-4 tracking-[0.12em]">
                                    {meta.label}
                                </span>
                            </div>
                            <p className="mt-2.5 max-w-[52ch] text-[14px] leading-[1.65] text-foreground/85">
                                {text}
                            </p>
                        </div>
                    )
                })}
            </div>

            <p className="mt-3 text-right font-mono text-[10px] uppercase leading-4 tracking-widest text-muted">
                {groupName} · conquistas verificadas
            </p>
        </section>
    )
}
