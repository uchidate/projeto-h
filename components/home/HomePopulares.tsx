import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import { href as rota } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { labelsFor } from '@/lib/i18n/labels'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import type { WPArtist, WPGroup, WPProduction } from '@/lib/wordpress/types'

const ROTULO = 'font-mono text-[11px] font-black uppercase tracking-[0.12em]'

type Linha = { chave: string; href: string; imagem: string | null; nome: string; sub: string; valor: number | null; texto: string }

function Coluna({ titulo, verTodos, href, linhas, escala }: { titulo: string; verTodos: string; href: string; linhas: Linha[]; escala: number }) {
    if (linhas.length === 0) return null
    return (
        <section aria-label={titulo} className="min-w-0 border border-border border-t-[3px] border-t-accent bg-[var(--color-home-card)] px-5 pb-2 pt-4">
            <div className="mb-1.5 flex items-baseline justify-between">
                <h3 className={`${ROTULO} text-accent`}>{titulo}</h3>
                <Link href={href} className={`${ROTULO} text-muted hover:text-accent`}>{verTodos}</Link>
            </div>
            <ol>
                {linhas.map((l, i) => (
                    <li key={l.chave} className={`border-b border-border last:border-b-0 ${i === 0 ? '-mx-5 bg-accent/5 px-5' : ''}`}>
                        <Link href={l.href} className={`group flex items-center gap-3.5 ${i === 0 ? 'py-4' : 'py-3'}`}>
                            <span className="w-5 shrink-0 font-serif text-[22px] font-bold leading-none text-accent">{i + 1}</span>
                            <span className={`relative shrink-0 overflow-hidden bg-surface ${i === 0 ? 'h-16 w-16' : 'h-12 w-12'}`}>
                                {l.imagem && <Image src={l.imagem} alt="" fill sizes="64px" className="object-cover object-top" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className={`block font-extrabold leading-snug text-foreground group-hover:text-accent ${i === 0 ? 'line-clamp-2 font-serif text-[17px] font-medium lg:text-[19px]' : 'truncate text-[15px]'}`}>{l.nome}</span>
                                {l.sub && <span className={`mt-0.5 block text-[12px] leading-snug text-muted ${i === 0 ? 'line-clamp-2' : 'truncate'}`}>{l.sub}</span>}
                            </span>
                            {l.valor !== null && (
                                <span className="w-14 shrink-0 text-right">
                                    <span className="block font-mono text-[13px] font-black text-accent">{l.texto}</span>
                                    <span aria-hidden className="mt-1 block h-[3px] bg-accent/15">
                                        <span className="block h-full bg-accent" style={{ width: `${Math.max(8, Math.min(100, (l.valor / escala) * 100))}%` }} />
                                    </span>
                                </span>
                            )}
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
    )
}

function idade(nascimento: unknown, hojeIso: string | undefined) {
    if (typeof nascimento !== 'string' || !nascimento || !hojeIso) return null
    const hoje = new Date(`${hojeIso}T12:00:00Z`)
    const d = parseAcfDate(nascimento)
    if (!d) return null
    let a = hoje.getUTCFullYear() - d.getUTCFullYear()
    if (hoje.getUTCMonth() < d.getUTCMonth() || (hoje.getUTCMonth() === d.getUTCMonth() && hoje.getUTCDate() < d.getUTCDate())) a--
    return a
}

/**
 * "Populares na Coreia agora": três rankings curtos. A barra e o número de artistas e grupos são o
 * trending_score do WordPress (0–150). Produções não expõem esse campo na API, então o número é a nota
 * e a barra a nota sobre 10; a ordem delas já vem do trending_score.
 */
export async function HomePopulares({ artistas, grupos, producoes, hoje, locale = DEFAULT_LOCALE }: {
    artistas: WPArtist[]; grupos: WPGroup[]; producoes: WPProduction[]; hoje?: string; locale?: Locale
}) {
    const t = await getTranslations({ locale, namespace: 'home.populares' })
    const tt = await getTranslations({ locale, namespace: 'home.tipoDeGrupo' })
    const labels = labelsFor(locale)
    const numero = (n: number) => n.toLocaleString(locale === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 1 })

    const linhasArtistas: Linha[] = [...artistas].filter(a => (a.acf?.trending_score ?? 0) > 0).sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0)).slice(0, 5).map(a => {
        const acf = a.acf ?? {}
        const papel = (acf.roles as string[] | undefined)?.[0]
        const anos = idade(acf.birth_date, hoje)
        return {
            chave: `a${a.id}`, href: rota('artist', { slug: a.slug }, locale), imagem: getWPImage(a._embedded, a.featured_image_url)?.src ?? null,
            nome: stripHtml(a.title.rendered), sub: [papel ? labels.role(papel, acf.gender) : null, anos].filter(Boolean).join(' · '),
            valor: acf.trending_score ?? null, texto: String(acf.trending_score ?? ''),
        }
    })
    const linhasGrupos: Linha[] = [...grupos].filter(g => (g.acf?.trending_score ?? 0) > 0).sort((a, b) => (b.acf?.trending_score ?? 0) - (a.acf?.trending_score ?? 0)).slice(0, 5).map(g => {
        const acf = g.acf ?? {}
        const tipo = acf.type ? (['girl_group', 'boy_group', 'co_ed', 'solo'].includes(acf.type) ? tt(acf.type as 'girl_group') : acf.type) : null
        const membros = Array.isArray(acf.members) && acf.members.length ? t('membros', { n: acf.members.length }) : null
        const ano = acf.debut_date ? (parseAcfDate(acf.debut_date)?.getUTCFullYear() ?? null) : null
        return {
            chave: `g${g.id}`, href: rota('group', { slug: g.slug }, locale), imagem: getWPImage(g._embedded, g.featured_image_url)?.src ?? null,
            nome: stripHtml(g.title.rendered), sub: [tipo, membros, ano].filter(Boolean).join(' · '),
            valor: acf.trending_score ?? null, texto: String(acf.trending_score ?? ''),
        }
    })
    const linhasProducoes: Linha[] = producoes.slice(0, 3).map(p => {
        const acf = p.acf ?? {}
        const nota = typeof acf.rating === 'number' && acf.rating > 0 ? acf.rating : null
        return {
            chave: `p${p.id}`, href: rota('production', { slug: p.slug }, locale), imagem: getWPImage(p._embedded, p.featured_image_url)?.src ?? null,
            nome: stripHtml(p.title.rendered), sub: [acf.network, acf.year].filter(Boolean).join(' · '),
            valor: nota, texto: nota ? `★ ${numero(nota)}` : '',
        }
    })
    if (linhasArtistas.length + linhasGrupos.length + linhasProducoes.length === 0) return null
    return (
        <section aria-label={t('titulo')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[26px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground lg:text-[30px]">{t('titulo')}</h2>
                <span className="border border-accent px-2 py-1 font-mono text-[11px] font-black uppercase leading-none tracking-[0.12em] text-accent">{t('tag')}</span>
            </div>
            <div className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
                <Coluna titulo={t('artistas')} verTodos={t('verTodos')} href={rota('artists', undefined, locale)} linhas={linhasArtistas} escala={150} />
                <Coluna titulo={t('grupos')} verTodos={t('verTodos')} href={rota('groups', undefined, locale)} linhas={linhasGrupos} escala={150} />
                <Coluna titulo={t('producoes')} verTodos={t('verTodos')} href={rota('productions', undefined, locale)} linhas={linhasProducoes} escala={10} />
            </div>
        </section>
    )
}
