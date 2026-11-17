import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Link from '@/components/i18n/LocalizedLink'
import { href as rota } from '@/lib/i18n/routes'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { formatNumber } from '@/lib/i18n/format'
import { labelsFor } from '@/lib/i18n/labels'
import { getWPImage, stripHtml, parseAcfDate } from '@/lib/utils'
import { AbasCelular } from '@/components/home/AbasCelular'
import type { WPArtist, WPGroup, WPProduction } from '@/lib/wordpress/types'

const POR_COLUNA = 5
const ROTULO = 'font-mono text-[11px] font-black uppercase tracking-[0.12em]'

type Linha = { chave: string; href: string; imagem: string | null; nome: string; sub: string; texto: string }

function Coluna({ titulo, verTodos, href, linhas }: { titulo: string; verTodos: string; href: string; linhas: Linha[] }) {
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
                            {l.texto && <span className="shrink-0 font-mono text-[13px] font-black text-accent">{l.texto}</span>}
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
 * "Em alta agora": três rankings curtos na mesma ordem das listagens /artists, /groups e /productions
 * (relevance_score: acesso real ao site + fama externa). A ordem vem pronta do WordPress; aqui não se
 * reordena. Até 2026-11-17 artistas e grupos eram reordenados pelo trending_score herdado da importação,
 * que nenhum script recalcula, e o número 0–150 aparecia ao lado sem dizer nada ao leitor.
 * Produção mostra a nota, que é informação para o leitor e não pretende explicar a posição.
 */
export async function HomePopulares({ artistas, grupos, producoes, hoje, locale = DEFAULT_LOCALE }: {
    artistas: WPArtist[]; grupos: WPGroup[]; producoes: WPProduction[]; hoje?: string; locale?: Locale
}) {
    const t = await getTranslations({ locale, namespace: 'home.populares' })
    const tt = await getTranslations({ locale, namespace: 'home.tipoDeGrupo' })
    const labels = labelsFor(locale)
    const numero = (n: number) => formatNumber(n, { maximumFractionDigits: 1 }, locale)

    const linhasArtistas: Linha[] = artistas.slice(0, POR_COLUNA).map(a => {
        const acf = a.acf ?? {}
        const papel = (acf.roles as string[] | undefined)?.[0]
        const anos = idade(acf.birth_date, hoje)
        return {
            chave: `a${a.id}`, href: rota('artist', { slug: a.slug }, locale), imagem: getWPImage(a._embedded, a.featured_image_url)?.src ?? null,
            nome: stripHtml(a.title.rendered), sub: [papel ? labels.role(papel, acf.gender) : null, anos].filter(Boolean).join(' · '),
            texto: '',
        }
    })
    const linhasGrupos: Linha[] = grupos.slice(0, POR_COLUNA).map(g => {
        const acf = g.acf ?? {}
        const tipo = acf.type ? (['girl_group', 'boy_group', 'co_ed', 'solo'].includes(acf.type) ? tt(acf.type as 'girl_group') : acf.type) : null
        const membros = Array.isArray(acf.members) && acf.members.length ? t('membros', { n: acf.members.length }) : null
        const ano = acf.debut_date ? (parseAcfDate(acf.debut_date)?.getUTCFullYear() ?? null) : null
        return {
            chave: `g${g.id}`, href: rota('group', { slug: g.slug }, locale), imagem: getWPImage(g._embedded, g.featured_image_url)?.src ?? null,
            nome: stripHtml(g.title.rendered), sub: [tipo, membros, ano].filter(Boolean).join(' · '),
            texto: '',
        }
    })
    const linhasProducoes: Linha[] = producoes.slice(0, POR_COLUNA).map(p => {
        const acf = p.acf ?? {}
        const nota = typeof acf.rating === 'number' && acf.rating > 0 ? acf.rating : null
        return {
            chave: `p${p.id}`, href: rota('production', { slug: p.slug }, locale), imagem: getWPImage(p._embedded, p.featured_image_url)?.src ?? null,
            nome: stripHtml(p.title.rendered), sub: [acf.network, acf.year].filter(Boolean).join(' · '),
            texto: nota ? `★ ${numero(nota)}` : '',
        }
    })
    if (linhasArtistas.length + linhasGrupos.length + linhasProducoes.length === 0) return null
    // Coluna vazia não vira aba.
    const colunas = [
        { chave: 'artistas', titulo: t('artistas'), href: rota('artists', undefined, locale), linhas: linhasArtistas },
        { chave: 'grupos', titulo: t('grupos'), href: rota('groups', undefined, locale), linhas: linhasGrupos },
        { chave: 'producoes', titulo: t('producoes'), href: rota('productions', undefined, locale), linhas: linhasProducoes },
    ].filter(c => c.linhas.length > 0)
    return (
        <section aria-label={t('titulo')}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-[26px] font-medium leading-[1.1] tracking-[-0.01em] text-foreground lg:text-[30px]">{t('titulo')}</h2>
                <span className="border border-accent px-2 py-1 font-mono text-[11px] font-black uppercase leading-none tracking-[0.12em] text-accent">{t('tag')}</span>
            </div>
            <AbasCelular rotulo={t('titulo')} abas={colunas.map(c => ({ chave: c.chave, rotulo: c.titulo }))} className="grid gap-3.5 lg:grid-cols-3 lg:gap-5">
                {colunas.map(c => <Coluna key={c.chave} titulo={c.titulo} verTodos={t('verTodos')} href={c.href} linhas={c.linhas} />)}
            </AbasCelular>
        </section>
    )
}
