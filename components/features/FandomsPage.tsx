import { htmlLang } from '@/lib/i18n/format'
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import type { Fandom } from '@/lib/wordpress/fandoms'
import { SearchInput } from '@/components/ui/SearchInput'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
    fandoms: Fandom[]
    search?: string
}

export function FandomsPage({ fandoms, search }: Props) {
    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: `Fandoms K-Pop | ${SITE_NAME}`,
                description: 'Fandoms de K-Pop — cores oficiais, lightsticks e os grupos de cada torcida.',
                url: `${SITE_URL}/fandoms`,
                inLanguage: htmlLang(),
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />

            <div className="border-b border-border/40">
                <div className="page-wrap py-6 sm:py-10">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em] mb-1">K-Pop</p>
                    <h1 className="text-[28px] sm:text-[40px] font-black tracking-[-0.03em] leading-tight">Fandoms</h1>
                    <p className="text-[14px] leading-relaxed text-foreground/70 mt-3 max-w-2xl">
                        Cor oficial e os grupos de cada torcida do K-Pop, de ARMY a ONCE.
                    </p>
                    <div className="mt-5 max-w-sm">
                        <SearchInput placeholder="Buscar fandom..." current={search} />
                    </div>
                </div>
            </div>

            <div className="page-wrap py-8">
                {fandoms.length === 0 ? (
                    <EmptyState
                        icon={<Heart size={48} />}
                        title="Nenhuma fandom encontrada"
                        description={search ? `Nenhum resultado para "${search}"` : 'Sem fandoms disponíveis'}
                        actionHref="/fandoms"
                        actionLabel="Ver todas"
                    />
                ) : (
                    /* Antes: 155 cards idênticos, cada um com o mesmo ícone de
                       coração, e a única variação sendo a cor da borda. O dado que
                       torna a página utilizável — qual grupo é a torcida — não
                       aparecia em lugar nenhum, e "1 grupo" se repetia em ~150 dos
                       155, ocupando linha sem informar nada.

                       Agora cada célula mostra o rosto do grupo, o nome do fandom e
                       o grupo a que ele pertence. A cor oficial deixa de ser enfeite
                       de borda e vira o fio da célula — é a identidade do fandom, o
                       dado mais próprio que temos. Sem moldura: com fio, uma última
                       linha incompleta encerra a lista em vez de abrir um buraco. */
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {fandoms.map(fandom => {
                            const principal = fandom.groups[0]
                            const imagem = principal ? getWPImage(principal._embedded, principal.featured_image_url) : null
                            const nomes = fandom.groups.map(g => stripHtml(g.title.rendered))
                            /* Dado medido antes de desenhar: cor 98%, debut 100%,
                               encerrados 24%, lightstick 0%. O ano situa a torcida
                               numa era e o encerrado é uma distinção real que estava
                               invisível — a torcida de um grupo dissolvido não é a
                               mesma coisa que a de um grupo em atividade. */
                            const ano = principal ? getYear(principal.acf?.debut_date) : null
                            const encerrado = fandom.groups.every(g => g.acf?.active === false)
                            const legenda = nomes.length > 2 ? `${nomes.length} grupos` : nomes.join(' · ')
                            return (
                                <Link key={fandom.slug} href={`/fandoms/${fandom.slug}`}
                                    className="group flex items-center gap-3 border-t-2 py-3.5 transition-colors hover:bg-surface/40"
                                    style={{ borderTopColor: fandom.color ?? 'var(--color-border)' }}>
                                    <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-surface">
                                        {imagem ? (
                                            <Image src={imagem.src} alt="" fill sizes="44px"
                                                className={`object-cover object-top ${encerrado ? 'opacity-55 grayscale' : ''}`} />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center"
                                                style={{ background: fandom.color ? `${fandom.color}22` : undefined }}>
                                                <Heart size={16} style={{ color: fandom.color ?? undefined }} className={fandom.color ? '' : 'text-muted/40'} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-bold leading-tight transition-colors group-hover:text-accent">
                                            {fandom.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] text-muted">
                                            {legenda}{ano ? ` · ${ano}` : ''}
                                        </p>
                                        {encerrado && (
                                            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted/70">
                                                encerrado
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {fandoms.length > 0 && ADSENSE.slots.inline && (
                    <div className="mt-10">
                        <AdSlotInline slot={ADSENSE.slots.inline} layout="feed" analyticsPlacement="fandoms_feed" />
                    </div>
                )}
            </div>
        </>
    )
}
