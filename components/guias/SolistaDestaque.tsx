import Image from 'next/image'
import Link from 'next/link'
import type { WPArtist } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'
import { labelsFor } from '@/lib/i18n/labels'

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'

const data = (d?: string) => {
    const m = d?.replace(/\D/g, '').match(/^(\d{4})(\d{2})(\d{2})$/)
    return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined
}

/**
 * Abertura do guia de um artista: foto, frase de carreira, marcos e ficha rápida, tudo vindo do próprio perfil
 * (campos editoriais já apurados), mais a porta para o perfil completo, que é a página que importa.
 * Sem os campos editoriais, cai para foto, nome e resumo.
 */
export function SolistaDestaque({ artist, grupo, resumo }: { artist: WPArtist; grupo?: string; resumo?: string }) {
    const a = artist.acf
    const imagem = getWPImage(artist._embedded, artist.featured_image_url)
    const nome = stripHtml(artist.title.rendered)
    const labels = labelsFor()
    const funcoes = (a?.roles as string[] | undefined)?.map(r => labels.role(r, a?.gender)).filter(Boolean).slice(0, 3).join(', ')
    const ficha = [
        { k: 'Nascimento', v: [data(a?.birth_date), (a?.birth_place as string | undefined)?.split(',')[0]].filter(Boolean).join(' · ') },
        { k: 'Estreia', v: data(a?.debut_date) },
        { k: 'Agência', v: a?.essencia_gravadora as string | undefined },
        { k: 'Funções', v: funcoes },
    ].filter(f => f.v)
    const marcos = ((a?.key_metrics ?? []) as Array<{ value: string; label: string }>).slice(0, 3)
    const frase = a?.career_statement as string | undefined
    const sub = a?.career_statement_sub as string | undefined
    const porta = a?.essencia_porta_entrada as string | undefined
    return (
        <section aria-label={`Perfil de ${nome}`} className="grid gap-6 border border-border bg-surface/40 p-4 sm:grid-cols-[220px_1fr] sm:gap-8 sm:p-6 lg:grid-cols-[300px_1fr] lg:gap-10 lg:p-8">
            <Link href={`/artists/${artist.slug}`} className="relative block aspect-3/4 w-full max-w-[240px] overflow-hidden bg-surface sm:max-w-none">
                {imagem && <Image src={imagem.src} alt={imagem.alt || nome} fill priority sizes="(max-width: 640px) 240px, 300px" className="object-cover object-top" />}
            </Link>
            <div className="flex min-w-0 flex-col gap-5">
                <div>
                    <p className={`text-accent ${MONO}`}>Perfil{grupo ? ` · ${grupo}` : ''}</p>
                    <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-[32px] font-bold leading-tight sm:text-[40px]">
                        {nome}{a?.name_hangul && <span className="ml-3 text-[18px] font-normal text-muted">{a.name_hangul}</span>}
                    </h2>
                </div>

                {frase
                    ? <blockquote className="border-l-2 border-accent pl-4">
                        <p className="font-[family-name:var(--font-playfair)] text-[19px] leading-snug text-foreground sm:text-[22px]">{frase}</p>
                        {sub && <p className="mt-2 text-[14px] leading-6 text-muted">{sub}</p>}
                    </blockquote>
                    : resumo && <p className="max-w-xl text-[15px] leading-7 text-muted">{resumo}</p>}

                {marcos.length > 0 && (
                    <dl className="grid gap-px border border-border bg-border sm:grid-cols-3">
                        {marcos.map(m => (
                            <div key={`${m.value}-${m.label}`} className="bg-background p-3.5">
                                <dt className="font-[family-name:var(--font-playfair)] text-[22px] font-bold leading-none text-foreground">{m.value}</dt>
                                <dd className="mt-1.5 text-[12px] leading-snug text-muted">{m.label}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                {ficha.length > 0 && (
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] lg:grid-cols-4">
                        {ficha.map(f => (
                            <div key={f.k}>
                                <dt className={`text-muted ${MONO}`}>{f.k}</dt>
                                <dd className="mt-1 font-semibold leading-snug text-foreground">{f.v}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
                    <Link href={`/artists/${artist.slug}`} className="touch-target inline-flex h-11 items-center border border-foreground px-5 text-[14px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                        Ver perfil completo →
                    </Link>
                    {porta && <p className="text-[13px] text-muted"><span className={`mr-2 ${MONO}`}>Comece por</span><span className="font-semibold text-foreground">{porta}</span></p>}
                </div>
            </div>
        </section>
    )
}
