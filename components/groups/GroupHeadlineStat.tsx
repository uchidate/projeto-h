import { useTranslations } from 'next-intl'
import { intlLocale } from '@/lib/i18n/format'


import { ExternalLink } from 'lucide-react'

interface Props {
    value: string
    label: string
    context?: string
    asOf?: string
    sourceUrl?: string
    accent: string
}

/** Separa o valor em prefixo + núcleo numérico + sufixo, para animar só o número. */
function parseValue(raw: string) {
    // Datas (ex: "20/10/2015") não são contagens — exibir estático.
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(raw)) return { prefix: '', number: null, suffix: raw, decimals: 0 }
    const match = raw.match(/^(\D*)([\d.,]+)(\D*)$/)
    if (!match) return { prefix: '', number: null, suffix: raw, decimals: 0 }
    const [, prefix, numberStr, suffix] = match
    const number = Number(numberStr.replace(/\./g, '').replace(',', '.'))
    // Preserva as casas decimais da fonte (ex: "1,2 bi") — arredondar para inteiro perderia a precisão.
    const decimals = numberStr.includes(',') ? numberStr.split(',')[1].length : 0
    return { prefix, number: Number.isFinite(number) ? number : null, suffix, format: numberStr, decimals }
}

/** Ano não leva separador de milhar: "2007" virava "2.007" no card-manchete. */
function isYear(value: number, decimals: number, raw: string) {
    return decimals === 0 && raw.length === 4 && Number.isInteger(value) && value >= 1900 && value <= 2100
}

function formatNumber(value: number, decimals: number, raw: string) {
    if (isYear(value, decimals, raw)) return String(value)
    return value.toLocaleString(intlLocale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Card-manchete do "Em números": numeral fantasma de fundo + revelação do valor.
 *
 *  A contagem animada foi removida de propósito. Estes números aparecem com data
 *  de referência e link de fonte — animar de 0 até o valor real exibia dados
 *  falsos ("0,85 milhão" onde a fonte diz 1,17) durante quase um segundo, e
 *  qualquer captura ou olhada de relance pegava o número errado. A revelação
 *  agora é só de opacidade: nada se move no dado, apenas no seu surgimento. */
export function GroupHeadlineStat({ value, label, context, asOf, sourceUrl, accent }: Props) {
    const t = useTranslations('profile.ui')
    const { prefix, number, suffix, decimals, format } = parseValue(value)
    const display = number === null ? value : formatNumber(number, decimals, format)

    return (
        // Sem numeral fantasma de fundo: era 130–170px dentro de um container com
        // overflow-hidden, então saía sempre cortado — no topo com -top-6, na borda
        // quando centrado. Ornamento que não sobrevive à própria caixa é defeito.
        <div className="py-7 pr-8 sm:py-9">
            <dt className="font-mono text-[9px] font-black uppercase leading-4 tracking-[0.14em] text-muted">{label}</dt>
            <dd className="mt-2">
                <strong className="block text-[56px] font-black leading-[0.92] tracking-[-0.04em] sm:text-[76px]" style={{ color: accent }}>
                    {prefix}{display}{suffix}
                </strong>
                {context && <span className="mt-3 block max-w-[52ch] text-[13px] leading-6 text-foreground/65">{context}</span>}
                <span className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] font-black uppercase tracking-[0.11em]">
                    {asOf && <span className="text-muted">ref. {asOf}</span>}
                    {sourceUrl && (
                        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted underline decoration-border underline-offset-4 hover:text-foreground">
                            {t('source')} <ExternalLink size={9} />
                        </a>
                    )}
                </span>
            </dd>
        </div>
    )
}
