import Link from 'next/link'
import { htmlLang } from '@/lib/i18n/format'
import { Heart } from 'lucide-react'
import { getWPImage, stripHtml, getYear } from '@/lib/utils'
import type { Fandom } from '@/lib/wordpress/fandoms'
import { SearchInput } from '@/components/ui/SearchInput'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { JsonLd } from '@/components/seo/JsonLd'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { EspacoDoFa, type CartaoTorcida } from '@/components/fandoms/EspacoDoFa'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
    fandoms: Fandom[]
    search?: string
}

export function FandomsPage({ fandoms, search }: Props) {
    // Só o que o espaço do fã precisa, já em formato serializável para o componente de cliente.
    const cartoes: CartaoTorcida[] = fandoms.map(fandom => {
        const principal = fandom.groups[0]
        const imagem = principal ? getWPImage(principal._embedded, principal.featured_image_url) : null
        return {
            slug: fandom.slug, nome: fandom.name, cor: fandom.color ?? '#c39bff',
            grupos: fandom.groups.map(g => stripHtml(g.title.rendered)), grupoSlug: principal?.slug ?? null,
            foto: imagem?.src ?? null, ano: principal ? getYear(principal.acf?.debut_date) : null,
            encerrado: fandom.groups.every(g => g.acf?.active === false),
        }
    })
    return (
        <>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: `Fandoms K-Pop | ${SITE_NAME}`,
                description: 'Fandoms de K-Pop — cores oficiais, lightsticks e os grupos de cada torcida.',
                mainEntity: {
                    '@type': 'ItemList',
                    numberOfItems: fandoms.length,
                    itemListElement: fandoms.slice(0, 50).map((f, i) => ({ '@type': 'ListItem', position: i + 1, name: f.name, url: `${SITE_URL}/fandoms/${f.slug}` })),
                },
                url: `${SITE_URL}/fandoms`,
                inLanguage: htmlLang(),
                publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            }} />

            <div className="page-wrap py-6 sm:py-10">
                <span className="inline-block -rotate-2 bg-[#ffe14d] px-3 py-1 text-[12px] font-black tracking-[0.08em] text-[#15102b]">{fandoms.length} TORCIDAS</span>
                <h1 className="mt-3 font-[family-name:var(--font-playfair)] text-[38px] font-extrabold leading-[1] sm:text-[56px]">
                    <span className="sr-only">Fandoms K-Pop: </span>Qual é a sua <span className="text-[#ff5fa2]">torcida</span>? <span className="text-[#38e1c0]">✦</span>
                </h1>
                <p className="mt-3 max-w-2xl text-[16px] text-foreground/70">Fandom é o nome da torcida de um grupo de K-Pop: ARMY é a do BTS, BLINK a do BLACKPINK, ONCE a do TWICE. Marque a sua (ou as suas) e este espaço passa a ser seu, com novidades, datas e o quiz da sua torcida.</p>
                <div className="mt-5 max-w-sm">
                    <SearchInput placeholder="Buscar fandom..." current={search} />
                </div>
            </div>

            <div className="page-wrap pb-8">
                {fandoms.length === 0 ? (
                    <EmptyState
                        icon={<Heart size={48} />}
                        title="Nenhuma fandom encontrada"
                        description={search ? `Nenhum resultado para "${search}"` : 'Sem fandoms disponíveis'}
                        actionHref="/fandoms"
                        actionLabel="Ver todas"
                    />
                ) : (
                    <EspacoDoFa cartoes={cartoes} busca={search} />
                )}

                {fandoms.length > 0 && (
                    <section aria-labelledby="oque-fandom" className="mt-14 max-w-3xl space-y-3 text-[16px] leading-relaxed">
                        <h2 id="oque-fandom" className="font-[family-name:var(--font-playfair)] text-[26px] font-extrabold leading-tight sm:text-[30px]">O que é um fandom de K-Pop?</h2>
                        <p>Fandom é o conjunto de fãs de um artista ou grupo. No K-Pop cada torcida tem um nome oficial, uma cor e, em geral, um lightstick, o bastão de luz levado aos shows. O nome costuma ter uma história: ARMY, por exemplo, nasceu junto com o BTS, em 2013.</p>
                        <p>Aqui você encontra {fandoms.length} torcidas, cada uma com o grupo, a origem do nome, as próximas datas comemoradas (estreia do grupo e aniversário dos membros) e as últimas notícias. Quer testar o que sabe? Faça o <Link href="/quiz" className="font-bold underline">quiz de K-Pop</Link>.</p>
                    </section>
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
