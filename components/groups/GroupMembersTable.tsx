import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { href } from '@/lib/i18n/routes'
import type { Locale } from '@/lib/i18n/config'
import { intlLocale } from '@/lib/i18n/format'
import { formatDate } from '@/lib/utils'
import type { LinhaIntegrante } from '@/lib/seo/integrantes'

interface Props {
    groupName: string
    linhas: LinhaIntegrante[]
}

/**
 * Idade e posição dos integrantes em tabela semântica.
 *
 * Buscas por membros são 61% das impressões das páginas de grupo. O cartão
 * visual não dá ao Google linhas e colunas; a tabela dá. É HTML de servidor
 * (sem estado, sem JavaScript) e visível: não é texto escondido para robô.
 */
export function GroupMembersTable({ groupName, linhas }: Props) {
    const t = useTranslations('profile')
    const locale = useLocale() as Locale
    if (linhas.length === 0) return null
    const vazio = t('blocks.membersTable.empty')

    return (
        <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left text-[14px]">
                <caption className="mb-3 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                    {t('blocks.membersTable.caption', { group: groupName })}
                </caption>
                <thead>
                    <tr className="border-b border-border/70 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        <th scope="col" className="py-2 pr-4 font-normal">{t('blocks.membersTable.member')}</th>
                        <th scope="col" className="py-2 pr-4 font-normal">{t('blocks.membersTable.birth')}</th>
                        <th scope="col" className="py-2 pr-4 font-normal">{t('blocks.membersTable.age')}</th>
                        <th scope="col" className="py-2 font-normal">{t('blocks.membersTable.position')}</th>
                    </tr>
                </thead>
                <tbody>
                    {linhas.map(l => (
                        <tr key={l.slug} className="border-b border-border/50 last:border-b-0">
                            <th scope="row" className="py-3 pr-4 font-semibold text-foreground">
                                <Link href={href('artist', { slug: l.slug }, locale)} className="hover:text-accent transition-colors">
                                    {l.nome}
                                </Link>
                                {l.hangul && <span className="ml-2 text-[12px] font-normal text-muted">{l.hangul}</span>}
                            </th>
                            <td className="py-3 pr-4 text-muted">
                                {l.nascimento
                                    ? <time dateTime={l.nascimento}>{formatDate(l.nascimento, intlLocale(locale))}</time>
                                    : vazio}
                            </td>
                            <td className="py-3 pr-4 font-mono">{l.idade ?? vazio}</td>
                            <td className="py-3 text-muted">{l.posicoes.length ? l.posicoes.join(', ') : vazio}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
