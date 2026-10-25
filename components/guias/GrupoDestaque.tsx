import Image from 'next/image'
import Link from 'next/link'
import type { WPGroup } from '@/lib/wordpress/types'
import { getWPImage, stripHtml } from '@/lib/utils'

const MONO = 'font-mono text-[10px] font-bold uppercase tracking-[0.14em]'
const TIPO: Record<string, string> = { girl_group: 'Girl group', boy_group: 'Boy group', co_ed: 'Grupo misto', solo: 'Solo' }

const data = (d?: string) => {
    const m = d?.replace(/\D/g, '').match(/^(\d{4})(\d{2})(\d{2})$/)
    return m ? `${m[3]}/${m[2]}/${m[1]}` : undefined
}

/** Abertura do guia de integrantes de um grupo: ficha do grupo (campos do próprio perfil) antes da grade de integrantes. */
export function GrupoDestaque({ group, agencia, exIntegrantes, integrantes }: { group: WPGroup; agencia?: string; exIntegrantes: string[]; integrantes: number }) {
    const a = group.acf
    const imagem = getWPImage(group._embedded, group.featured_image_url)
    const nome = stripHtml(group.title.rendered)
    const encerrado = a?.active === false || !!a?.disbandment_date
    const marcos = (((a as { key_metrics?: Array<{ value: string; label: string }> } | undefined)?.key_metrics) ?? []).slice(0, 3)
    const ficha = [
        { k: 'Estreia', v: data(a?.debut_date) },
        { k: 'Integrantes', v: integrantes ? String(integrantes) : undefined },
        { k: 'Agência', v: agencia },
        { k: 'Fandom', v: a?.fandom_name },
        { k: 'Lightstick', v: a?.lightstick },
        { k: 'Situação', v: encerrado ? 'Encerrado' : a?.active ? 'Em atividade' : undefined },
    ].filter(f => f.v && !(f.k === 'Estreia' && marcos.some(m => /estreia/i.test(m.label))))
    return (
        <section aria-label={`Perfil do grupo ${nome}`} className="grid gap-6 border border-border bg-surface/40 p-4 sm:grid-cols-[260px_1fr] sm:gap-8 sm:p-6 lg:grid-cols-[360px_1fr] lg:gap-10 lg:p-8">
            <Link href={`/groups/${group.slug}`} className="relative block aspect-4/3 w-full overflow-hidden bg-surface sm:aspect-4/5 lg:aspect-4/3">
                {imagem && <Image src={imagem.src} alt={imagem.alt || nome} fill priority sizes="(max-width: 640px) 100vw, 360px" className="object-cover object-top" />}
            </Link>
            <div className="flex min-w-0 flex-col gap-5">
                <div>
                    <p className={`text-accent ${MONO}`}>{TIPO[a?.type ?? ''] ?? 'Grupo'}</p>
                    <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-[32px] font-bold leading-tight sm:text-[40px]">
                        {nome}{a?.name_hangul && <span className="ml-3 text-[18px] font-normal text-muted">{a.name_hangul}</span>}
                    </h2>
                </div>
                {a?.name_meaning && <p className="max-w-2xl border-l-2 border-accent pl-4 text-[15px] leading-7 text-foreground/80">{stripHtml(a.name_meaning)}</p>}
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
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] lg:grid-cols-3">
                        {ficha.map(f => (
                            <div key={f.k}>
                                <dt className={`text-muted ${MONO}`}>{f.k}</dt>
                                <dd className="mt-1 font-semibold leading-snug text-foreground">{f.v}</dd>
                            </div>
                        ))}
                    </dl>
                )}
                {exIntegrantes.length > 0 && <p className="text-[13px] leading-6 text-muted"><span className={`mr-2 ${MONO}`}>Ex-integrantes</span>{exIntegrantes.join(', ')}</p>}
                <div className="mt-auto pt-1">
                    <Link href={`/groups/${group.slug}`} className="touch-target inline-flex h-11 items-center border border-foreground px-5 text-[14px] font-semibold text-foreground transition-colors hover:border-accent hover:text-accent">
                        Ver página do grupo →
                    </Link>
                </div>
            </div>
        </section>
    )
}
