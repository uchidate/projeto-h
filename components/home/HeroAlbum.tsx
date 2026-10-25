import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { postLink } from '@/components/home/postLink'
import type { Locale } from '@/lib/i18n/config'
import type { CapaAlbum } from '@/lib/home/capa-album'

const FAIXAS_VISIVEIS = 5

/** Ficha do lançamento e as primeiras faixas, direto da capa: cada faixa leva ao trecho do artigo com o player dela. */
export async function HeroAlbum({ album, slug, locale }: { album: CapaAlbum; slug: string; locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'home.hero' })
    const { fichas, faixas } = album
    const base = postLink(slug, locale).href
    return (
        <div className="mt-4">
            {fichas.length > 0 && (
                <dl className="grid grid-cols-2 border border-border sm:grid-cols-4">
                    {fichas.map(f => (
                        <div key={f.rotulo} className="min-w-0 border-b border-border px-3 py-2 last:border-b-0 odd:border-r sm:border-b-0 sm:border-r sm:last:border-r-0">
                            <dt className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{f.rotulo}</dt>
                            <dd className="mt-0.5 text-[14px] font-extrabold leading-tight text-foreground">{f.valor}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <p className="mb-1 mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-accent">{t('asFaixas', { n: faixas.length })}</p>
            <ol>
                {faixas.slice(0, FAIXAS_VISIVEIS).map((f, i) => (
                    <li key={f.id} className="border-b border-border">
                        <Link href={`${base}#${f.id}`} className="group flex items-center gap-3 py-1.5">
                            <span aria-hidden className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-foreground text-[8px] text-background">▶</span>
                            <span className="w-3 shrink-0 font-mono text-[10px] text-muted">{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground group-hover:text-accent">{f.titulo}</span>
                            {f.clipe && <span className="shrink-0 border border-accent px-1.5 py-0.5 font-mono text-[9px] font-black uppercase leading-none tracking-[0.12em] text-accent">{t('clipe')}</span>}
                            {f.duracao && <span className="w-9 shrink-0 text-right font-mono text-[11px] text-muted">{f.duracao}</span>}
                        </Link>
                    </li>
                ))}
            </ol>
            {faixas.length > FAIXAS_VISIVEIS && (
                <Link href={base} className="mt-1.5 inline-block font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted hover:text-accent">{t('maisFaixas', { n: faixas.length - FAIXAS_VISIVEIS })}</Link>
            )}
        </div>
    )
}
