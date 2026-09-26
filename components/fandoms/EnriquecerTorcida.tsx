import type { WPGroup } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { GroupSpotifyEmbed } from '@/components/groups/GroupSpotifyEmbed'

const TITULO = 'font-[family-name:var(--font-playfair)] text-[28px] font-extrabold leading-tight sm:text-[34px]'

interface Props { grupo: WPGroup; nome: string; cor: string; ink: string }

function dadosDe(grupo: WPGroup) {
    const acf = (grupo.acf ?? {}) as Record<string, unknown>
    const texto = (k: string) => (typeof acf[k] === 'string' && (acf[k] as string).trim() ? (acf[k] as string).trim() : null)
    return {
        curiosidades: Array.isArray(acf.curiosidades) ? (acf.curiosidades as unknown[]).filter((c): c is string => typeof c === 'string' && c.trim().length > 0) : [],
        significado: texto('name_meaning'),
        spotify: texto('spotify'),
        redes: [
            { rotulo: 'YouTube', href: texto('youtube') },
            { rotulo: 'Instagram', href: texto('instagram') },
            { rotulo: 'X', href: texto('twitter') },
            { rotulo: 'TikTok', href: texto('tiktok') },
        ].filter((r): r is { rotulo: string; href: string } => !!r.href && /^https?:\/\//.test(r.href)),
    }
}

/** A história do nome da torcida e as curiosidades do grupo, em cartões. Cada bloco some se o dado não existir. */
export function HistoriaEDicas({ grupo, nome, cor, ink }: Props) {
    const { curiosidades } = dadosDe(grupo)
    if (curiosidades.length === 0) return null
    const menciona = (c: string) => c.toLowerCase().includes(nome.toLowerCase())
    const doNome = curiosidades.find(menciona) ?? null
    const outras = curiosidades.filter(c => c !== doNome).slice(0, 5)
    const grupoNome = stripHtml(grupo.title.rendered)

    return (
        <>
            {doNome && (
                <section aria-labelledby="nome-titulo">
                    <h2 id="nome-titulo" className={TITULO}>De onde vem o nome {nome}?</h2>
                    <p className="mt-5 p-5 text-[17px] font-medium leading-relaxed shadow-[6px_6px_0_#15102b] dark:shadow-[6px_6px_0_#000] sm:p-7 sm:text-[19px]" style={{ background: cor, color: ink }}>{doNome}</p>
                </section>
            )}
            {outras.length > 0 && (
                <section aria-labelledby="curiosidades-titulo">
                    <h2 id="curiosidades-titulo" className={TITULO}>Você sabia? 💡</h2>
                    <p className="mt-1 text-[14px] text-muted">Curiosidades sobre o {grupoNome}, para quem é {nome}.</p>
                    <ol className="mt-5 grid gap-4 md:grid-cols-2">
                        {outras.map((c, i) => (
                            <li key={i} className="flex gap-4 border-2 border-border bg-surface p-4">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[16px] font-black" style={{ background: cor, color: ink }}>{i + 1}</span>
                                <span className="text-[15px] leading-relaxed">{c}</span>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </>
    )
}

/** Ouvir e seguir: o Spotify do grupo e os links oficiais. */
export function OuvirESeguir({ grupo, cor, ink }: Omit<Props, 'nome'>) {
    const { spotify, redes } = dadosDe(grupo)
    if (!spotify && redes.length === 0) return null
    const grupoNome = stripHtml(grupo.title.rendered)
    return (
        <section aria-labelledby="ouvir-titulo">
            <h2 id="ouvir-titulo" className={TITULO}>Ouça com a torcida 🎧</h2>
            {spotify && <div className="mt-5"><GroupSpotifyEmbed spotifyUrl={spotify} name={grupoNome} accent={cor} /></div>}
            {redes.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                    <span className="text-[13px] font-black uppercase tracking-[0.08em] text-muted">Siga o {grupoNome}</span>
                    {redes.map(r => (
                        <a key={r.rotulo} href={r.href} target="_blank" rel="noopener noreferrer" className="touch-target inline-flex items-center px-4 py-2.5 text-[13px] font-black" style={{ background: cor, color: ink }}>{r.rotulo} ↗</a>
                    ))}
                </div>
            )}
        </section>
    )
}
