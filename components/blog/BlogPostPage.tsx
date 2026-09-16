import { intlLocale } from '@/lib/i18n/format'
import Image from 'next/image'
import { BrandDot } from '@/components/ui/BrandDot'
import Link from 'next/link'
import { Clock, Calendar, Eye, Tag, Film, User } from 'lucide-react'
import { QuizWidget } from '@/components/ui/QuizWidget'
import { QuizEmbedLoader } from '@/components/blog/QuizEmbedLoader'
import type { QuizCategory } from '@/lib/wordpress/quiz'
import type { WPPost } from '@/lib/wordpress/types'
import { formatDateTime, getWPImage, getWPTerms, stripHtml, readingTime } from '@/lib/utils'
import { catStyle } from '@/lib/blog/catStyle'
import { SITE_URL, SITE_NAME } from '@/lib/constants/site'
import { splitContentForAd, splitContentForAds } from '@/lib/utils/injectAd'
import { JsonLd } from '@/components/seo/JsonLd'
import { buildArticleSchema } from '@/lib/seo/jsonld'
import { ShareBar } from '@/components/ui/ShareBar'
import { EntityActionBar } from '@/components/ui/EntityActionBar'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import { BlogReadingProgress } from '@/components/blog/BlogReadingProgress'
import { BlogToc } from '@/components/blog/BlogToc'
import { ContentStateButton } from '@/components/features/ContentStateButton'
import { BlogBackToTop } from '@/components/blog/BlogBackToTop'
import { BlogSuggestedNext } from '@/components/blog/BlogSuggestedNext'
import { BlogTextShare } from '@/components/blog/BlogTextShare'
import { BlogMobileReadMore } from '@/components/blog/BlogMobileReadMore'
import { BlogDaysUntil } from '@/components/blog/BlogDaysUntil'
import { ROLE_LABELS } from '@/lib/artists/labels'
import { FOOD_CATEGORY_LABELS, FOOD_CATEGORY_EMOJI } from '@/lib/wordpress/foods'
import { COMPANY_INDUSTRY_LABELS, COMPANY_INDUSTRY_EMOJI } from '@/lib/wordpress/companies'
import { buildArticleModel } from '@/lib/blog/articleModel'
import { GutenbergArticleRenderer } from '@/components/blog/GutenbergArticleRenderer'
import { toRgba } from '@/lib/agencies/presentation'
import { ArticleSidebarAd } from '@/components/blog/ArticleSidebarAd'
import { BarraAncorada } from '@/components/ui/BarraAncorada'
import { metaDescription } from '@/lib/seo/metaDescription'

type ArticleHeading = { id: string; text: string; level: 2 | 3 }
type RelatedPreview = {
    label: string
    title: string
    href: string
    image: string | null
    description: string
    cta: string
}
type RelatedArtist = NonNullable<WPPost['related_entities']>['artists'][number]
type RelatedPreviewMap = Record<string, RelatedPreview>

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function relatedPreviewKey(href: string) {
    const match = href.match(/\/(artists|productions|groups|comidas|empresas)\/([^/?#]+)/i)
    if (!match) return null
    try {
        return `${match[1].toLowerCase()}/${decodeURIComponent(match[2]).toLowerCase()}`
    } catch {
        return `${match[1].toLowerCase()}/${match[2].toLowerCase()}`
    }
}

function addHtmlClass(attrs: string, className: string) {
    if (/\bclass=/.test(attrs)) {
        return attrs.replace(/\bclass=(["'])(.*?)\1/i, (_match, quote, classes) => {
            if (String(classes).split(/\s+/).includes(className)) return `class=${quote}${classes}${quote}`
            return `class=${quote}${classes} ${className}${quote}`
        })
    }
    return `${attrs} class="${className}"`
}

function imageOrientationFromAttrs(attrs: string) {
    const width = Number(String(attrs).match(/\bwidth=(["']?)(\d+)\1/i)?.[2] ?? 0)
    const height = Number(String(attrs).match(/\bheight=(["']?)(\d+)\1/i)?.[2] ?? 0)
    if (!width || !height) return 'unknown'
    if (height > width * 1.12) return 'portrait'
    if (width > height * 1.12) return 'landscape'
    return 'square'
}

function renderRelatedPreview(preview: RelatedPreview) {
    const image = preview.image
        ? `<span class="oc-related-content__image"><img src="${escapeHtml(preview.image)}" alt="${escapeHtml(preview.title)}" loading="lazy" /></span>`
        : '<span class="oc-related-content__image oc-related-content__image--empty" aria-hidden="true"></span>'
    return `<div class="oc-related-content oc-related-content--preview"><a href="${escapeHtml(preview.href)}" class="oc-related-content__link">${image}<span class="oc-related-content__body"><span class="oc-related-content__eyebrow">${escapeHtml(preview.label)}</span><strong>${escapeHtml(preview.title)}</strong><span class="oc-related-content__meta">${escapeHtml(preview.description).toUpperCase()}</span><span class="oc-related-content__cta">${escapeHtml(preview.cta)} →</span></span></a></div>`
}

function addArtistPreview(previews: RelatedPreviewMap, artist: RelatedArtist, keySlug: string) {
    const roles = (artist.roles ?? []).slice(0, 2).map(role => artistRoleLabel(role, artist.gender))
    previews[`artists/${keySlug.toLowerCase()}`] = {
        label: 'Artista',
        title: artist.name,
        href: `/artists/${artist.slug}`,
        image: artist.image,
        description: roles.length > 0 ? roles.join(' · ') : 'Perfil',
        cta: 'Ver perfil',
    }
}

function buildRelatedPreviewMap(post: WPPost): RelatedPreviewMap {
    const previews: RelatedPreviewMap = {}
    post.related_entities?.artists?.forEach(artist => {
        addArtistPreview(previews, artist, artist.slug)
        artist.aliases?.forEach(alias => addArtistPreview(previews, artist, alias))
    })
    post.related_entities?.productions?.forEach(prod => {
        previews[`productions/${prod.slug.toLowerCase()}`] = {
            label: 'Produção',
            title: prod.title,
            href: `/productions/${prod.slug}`,
            image: prod.image,
            description: 'Produção',
            cta: 'Ver página',
        }
    })
    post.related_entities?.groups?.forEach(group => {
        previews[`groups/${group.slug.toLowerCase()}`] = {
            label: 'Grupo',
            title: group.name,
            href: `/groups/${group.slug}`,
            image: group.image,
            description: 'K-Pop',
            cta: 'Ver perfil',
        }
    })
    post.related_entities?.foods?.forEach(food => {
        const catLabel = food.category ? (FOOD_CATEGORY_LABELS[food.category] ?? food.category) : 'Culinária coreana'
        const catEmoji = food.category ? (FOOD_CATEGORY_EMOJI[food.category] ?? '🍽️') : '🍽️'
        previews[`comidas/${food.slug.toLowerCase()}`] = {
            label: 'Comida coreana',
            title: food.title,
            href: `/comidas/${food.slug}`,
            image: food.image,
            description: `${catEmoji} ${catLabel}${food.spicy_level ? ` · ${'🌶'.repeat(Math.min(food.spicy_level, 3))}` : ''}`,
            cta: 'Conhecer prato',
        }
    })
    post.related_entities?.companies?.forEach(company => {
        const indLabel = company.industry ? (COMPANY_INDUSTRY_LABELS[company.industry] ?? company.industry) : 'Empresa coreana'
        const indEmoji = company.industry ? (COMPANY_INDUSTRY_EMOJI[company.industry] ?? '🏢') : '🏢'
        previews[`empresas/${company.slug.toLowerCase()}`] = {
            label: company.is_chaebol ? 'Chaebol' : 'Empresa',
            title: company.title,
            href: `/empresas/${company.slug}`,
            image: company.image,
            description: `${indEmoji} ${indLabel}`,
            cta: 'Ver empresa',
        }
    })
    return previews
}

function artistRoleLabel(role: string, gender?: 'male' | 'female' | null) {
    if (role === 'singer') return gender === 'female' ? 'Cantora' : gender === 'male' ? 'Cantor' : 'Cantor(a)'
    if (role === 'actor') return gender === 'female' ? 'Atriz' : gender === 'male' ? 'Ator' : 'Ator/Atriz'
    return ROLE_LABELS[role] ?? role
}

function headingId(text: string) {
    return stripHtml(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 72)
}

function markdownInlineToHtml(s: string): string {
    // **texto** → <strong> apenas se houver texto real dentro (não vazio, sem quebras)
    // Ignora * soltos como "2-3x" ou "x*y" que não são markdown
    return s
        .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
}

function enhanceArticleHtml(source: string, relatedPreviews: RelatedPreviewMap = {}): { html: string; headings: ArticleHeading[] } {
    const headings: ArticleHeading[] = []
    const usedIds = new Map<string, number>()

    // Converte **bold** e *italic* markdown nos nós de texto do HTML.
    // Só toca texto entre tags (não atributos) e só quando há ** ou * real.
    let html = source.replace(/>([^<]+)</g, (match, text) => {
        if (!text.includes('*')) return match
        return '>' + markdownInlineToHtml(text) + '<'
    })

    html = html.replace(
        /<p>\s*<strong>(?:Conteúdo|Perfil) relacionado:<\/strong>([\s\S]*?)<\/p>/gi,
        (_match, linksHtml) => {
            const links = [...String(linksHtml).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
            if (links.length === 0) return _match

            const blocks = links.map(([, attrs, content]) => {
                const href = String(attrs).match(/\shref=(["'])(.*?)\1/i)?.[2] ?? ''
                const preview = href ? relatedPreviews[relatedPreviewKey(href) ?? ''] : null
                if (preview) return renderRelatedPreview(preview)
                return `<p class="oc-related-content"><span>Explore também</span><a${attrs}>${content}</a></p>`
            })

            if (blocks.length === 1) return blocks[0]
            return `<div class="oc-related-content-group">${blocks.join('')}</div>`
        },
    )

    html = html.replace(/<figure([^>]*)>([\s\S]*?<img\b([^>]*)>[\s\S]*?)<\/figure>/gi, (_match, attrs, inner, imgAttrs) => {
        const orientation = imageOrientationFromAttrs(imgAttrs)
        let nextAttrs = addHtmlClass(String(attrs), 'oc-article-media')
        if (orientation !== 'unknown') {
            nextAttrs = addHtmlClass(nextAttrs, `oc-article-media--${orientation}`)
        }
        return `<figure${nextAttrs}>${inner}</figure>`
    })

    html = html.replace(/<p([^>]*)>\s*(<img\b([^>]*)>)\s*<\/p>/gi, (_match, attrs, img, imgAttrs) => {
        const orientation = imageOrientationFromAttrs(imgAttrs)
        let nextAttrs = addHtmlClass(String(attrs), 'oc-article-media')
        if (orientation !== 'unknown') {
            nextAttrs = addHtmlClass(nextAttrs, `oc-article-media--${orientation}`)
        }
        return `<p${nextAttrs}>${img}</p>`
    })

    html = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, rawLevel, attrs, content) => {
        const level = Number(rawLevel) as 2 | 3
        const currentId = String(attrs).match(/\sid=(["'])(.*?)\1/i)?.[2]
        const baseId = currentId || headingId(content) || `secao-${headings.length + 1}`
        const count = usedIds.get(baseId) ?? 0
        usedIds.set(baseId, count + 1)
        const id = count > 0 ? `${baseId}-${count + 1}` : baseId
        const cleanAttrs = String(attrs).replace(/\sid=(["']).*?\1/i, '')
        headings.push({ id, text: stripHtml(content), level })
        return `<h${level}${cleanAttrs} id="${id}">${content}</h${level}>`
    })

    // Spotify links → embed iframe
    // Detecta <p> ou <a> standalone com URL open.spotify.com/{artist|album|track|playlist}/ID
    html = html.replace(
        /<p[^>]*>\s*<a\b[^>]*href=(["'])https?:\/\/open\.spotify\.com\/(artist|album|track|playlist)\/([A-Za-z0-9]+)[^"']*\1[^>]*>[\s\S]*?<\/a>\s*<\/p>/gi,
        (_match) => {
            const hrefMatch = _match.match(/href=(["'])([^"']+)\1/i)
            const spotifyUrl = hrefMatch?.[2] ?? ''
            if (!spotifyUrl) return _match
            const embedUrl = spotifyUrl.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/') + '?utm_source=generator&theme=0'
            return `<div class="oc-spotify-embed"><iframe src="${embedUrl}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`
        }
    )

    // Remove parágrafos vazios do Gutenberg
    html = html.replace(/<p[^>]*>\s*(?:&nbsp;| )?\s*<\/p>/gi, '')

    // Move blocos oc-related-content que aparecem antes do primeiro parágrafo real
    // para depois do primeiro parágrafo — não bloqueia a leitura logo no topo
    {
        const relatedAtTopRe = /^(\s*(?:<div class="oc-related-content[^"]*">[\s\S]*?<\/div>|<p class="oc-related-content[^"]*">[\s\S]*?<\/p>)\s*)+/i
        const topMatch = html.match(relatedAtTopRe)
        if (topMatch) {
            const movedBlocks = topMatch[0]
            const rest = html.slice(movedBlocks.length)
            const firstParaEnd = rest.indexOf('</p>')
            if (firstParaEnd !== -1) {
                html = rest.slice(0, firstParaEnd + 4) + '\n' + movedBlocks.trim() + rest.slice(firstParaEnd + 4)
            } else {
                html = rest + movedBlocks
            }
        }
    }

    let leadAdded = false
    html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, content) => {
        if (leadAdded || /oc-related-content/.test(attrs) || stripHtml(content).length < 80) return match
        leadAdded = true
        const nextAttrs = /\bclass=/.test(attrs)
            ? attrs.replace(/\bclass=(["'])(.*?)\1/i, 'class=$1$2 oc-article-lead$1')
            : `${attrs} class="oc-article-lead"`
        return `<p${nextAttrs}>${content}</p>`
    })

    return { html, headings }
}


interface Props {
    post: WPPost
    relatedPosts?: WPPost[]
}

export function BlogPostPage({ post, relatedPosts = [] }: Props) {
    /* Hallmark · macrostructure: Long Document · genre: editorial · theme: editorial tokens
     * audience: leitores de cultura coreana · use: leitura e descoberta · tone: editorial
     * pre-emit critique: P5 H4 E4 S5 R4 V4
     */
    const title = stripHtml(post.title.rendered)
    const excerpt = stripHtml(post.excerpt.rendered)
    const summary = post.acf?.subtitle?.trim() || excerpt
    const image = getWPImage(post._embedded, post.featured_image_url)
    const categories = getWPTerms(post._embedded, 'category')
    const tags = getWPTerms(post._embedded, 'post_tag')
    const author = post._embedded?.author?.[0]
    const mins = post.acf?.reading_time
        ?? readingTime(post.content?.rendered ?? '')
    const postUrl = `${SITE_URL}/blog/${post.slug}`
    const wasUpdated = Boolean(post.modified) && post.modified.slice(0, 16) !== post.date.slice(0, 16)
    const cat = categories[0]
    const isNewsPost = categories.some(category => category.slug === 'noticias-k-pop')
    const articleSection = isNewsPost
        ? (categories.find(category => category.slug === 'noticias-k-pop')?.name ?? cat?.name)
        : cat?.name
    const cs = catStyle(cat?.slug)
    // Quando o artigo tem um único protagonista claro (grupo ou, na ausência de
    // grupo, artista solo) com cor oficial cadastrada, ela substitui a cor
    // genérica da categoria — "veste" o artigo na identidade do protagonista
    // sem tocar no resto do tema. Grupo tem prioridade sobre artista solo.
    const primaryGroupColor = post.related_entities?.groups?.length === 1
        ? post.related_entities.groups[0].color ?? null
        : (post.related_entities?.groups?.length ?? 0) === 0 && post.related_entities?.artists?.length === 1
            ? post.related_entities.artists[0].color ?? null
            : null
    const accentColor = primaryGroupColor ?? cs.color

    const relatedPreviews = buildRelatedPreviewMap(post)
    const structuredModel = post.article_blocks?.length ? buildArticleModel(post.article_blocks) : null
    const enhancedContent = structuredModel
        ? { html: '', headings: structuredModel.headings }
        : enhanceArticleHtml(post.content.rendered, relatedPreviews)
    const [articleLead, restContent] = splitContentForAd(enhancedContent.html, 1)
    // Densidade conservadora: uma tela real de leitura entre unidades e no
    // máximo duas no corpo; leaderboard/sidebar já monetizam o restante.
    const contentSegments = splitContentForAds(restContent, {
        minParagraphs: 7,
        everyParagraphs: 5,
        maxAds: 2,
        minCharsBetweenAds: 1200,
        minTailChars: 600,
    })

    const BLOG_TO_QUIZ_CATEGORY: Record<string, QuizCategory> = {
        'k-pop':    'k-pop',
        'k-drama':  'k-drama',
        'dorama':   'k-drama',
        'cultura':  'cultura',
        'gastronomia': 'cultura',
        'historia': 'historia',
        'k-film':   'k-drama',
    }
    const quizCategory: QuizCategory = BLOG_TO_QUIZ_CATEGORY[cat?.slug ?? ''] ?? 'k-pop'
    // O primeiro item já aparece como sugestão individual logo após a leitura.
    // Evitar repeti-lo mantém o encerramento editorial útil e menos mecânico.
    const moreRelatedPosts = relatedPosts.slice(1, 5)

    return (
        <>
            <JsonLd
                data={buildArticleSchema({
                    type: isNewsPost ? 'NewsArticle' : 'BlogPosting',
                    headline: title,
                    description: metaDescription(summary),
                    url: postUrl,
                    datePublished: post.date,
                    dateModified: post.modified,
                    image: image?.src,
                    author: author
                        ? { type: 'Person', name: author.name }
                        : { type: 'Organization', name: SITE_NAME, url: SITE_URL },
                    publisher: { name: SITE_NAME, url: SITE_URL },
                    articleSection,
                })}
            />
            <BlogBackToTop />
            <BlogTextShare shareUrl={postUrl} />
            <BlogDaysUntil />
            <BlogReadingProgress
                title={title}
                catName={cat?.name}
                catSlug={cat?.slug}
                catColor={accentColor}
                mins={mins}
                postUrl={postUrl}
                postId={post.id}
            />

            {/* Barra de contexto editorial: categoria + tags do artigo.
              *
              * Ocupa DE PROPOSITO o mesmo `top` da ReadingBar, com z-index
              * menor: no topo do artigo aparecem as tags, e quando a leitura
              * comeca a ReadingBar cobre este espaco com progresso, titulo e
              * compartilhar. No celular, empilhar as duas custaria 74px de
              * cromo fixo — quase 9% da tela.
              *
              * Por isso as duas precisam do mesmo ancoramento. Em
              * 2026-09-11 so a ReadingBar tinha: ela subiu junto com o
              * cabecalho ao rolar, esta ficou parada em 93px, e o que deveria
              * estar coberto apareceu flutuando no meio da imagem de capa. */}
            {(cat || tags.length > 0) && (
                <BarraAncorada posicao="fixed" z={308} className="left-1/2 -translate-x-1/2 w-full max-w-[1440px] bg-background border-b border-border/50">
                    <div className="page-wrap flex items-center gap-0 h-9 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {cat && (
                            <Link
                                href={`/blog?category=${cat.slug}`}
                                className="shrink-0 flex items-center h-full pr-3 mr-3 border-r border-border/50 font-mono text-[9px] font-black uppercase tracking-[0.14em] hover:opacity-80 transition-opacity"
                                style={{ color: accentColor }}
                            >
                                {cat.name}
                            </Link>
                        )}
                        {tags.slice(0, 8).map(tag => {
                            const ts = catStyle(tag.slug)
                            return (
                                <Link
                                    key={tag.id}
                                    href={`/blog?tag=${tag.slug}`}
                                    className="shrink-0 mr-1.5 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                                    style={{ color: ts.color, backgroundColor: ts.bg }}
                                >
                                    {tag.name}
                                </Link>
                            )
                        })}
                    </div>
                </BarraAncorada>
            )}
            <div aria-hidden="true" className="h-9" />

            {/* ── Mobile hero estilo Globo: texto acima, foto full-width abaixo ── */}
            <div className="lg:hidden bg-background px-4 pt-4 pb-3 border-b border-border">
                {cat && (
                    <span className="mb-2 inline-block font-mono text-[9px] font-black uppercase tracking-[0.14em]"
                        style={{ color: cs.color }}>
                        {cat.name}
                    </span>
                )}
                {/* Título mobile: mesmo texto do <h1> desktop, em outro bloco do DOM
                    (o CSS mostra um por breakpoint). Como <h1>, o par virava "múltiplos
                    H1" para crawler — que não aplica breakpoint e enxerga os dois; o
                    Bing acusou 45 páginas assim. Aqui vai role/aria-level: leitor de
                    tela em mobile continua anunciando um cabeçalho nível 1, e o
                    documento tem uma única tag <h1>, a do cabeçalho desktop. */}
                <p role="heading" aria-level={1}
                    className="min-w-0 wrap-anywhere font-black text-[clamp(1.75rem,8vw,2.2rem)] leading-[1.06] tracking-[-0.035em] text-foreground mb-3">
                    {title}<BrandDot />
                </p>
                {summary && (
                    <p className="text-[14px] leading-relaxed text-muted mb-3">{summary}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted border-t border-border pt-2">
                    {author && <span className="font-semibold text-foreground">{author.name}</span>}
                    <time dateTime={post.date} className="flex items-center gap-1">
                        <Calendar size={10} /> {formatDateTime(post.date)}
                    </time>
                    {wasUpdated && (
                        <time dateTime={post.modified} className="flex items-center gap-1">
                            Atualizado em {formatDateTime(post.modified)}
                        </time>
                    )}
                    <span className="flex items-center gap-1"><Clock size={10} /> {mins} min</span>
                </div>
            </div>
            {image && (
                <div
                    className="oc-hero-media lg:hidden relative w-full aspect-4/3 overflow-hidden bg-surface"
                    style={primaryGroupColor ? { boxShadow: `0 24px 48px -24px ${toRgba(primaryGroupColor, 0.5)}` } : undefined}
                >
                    <Image src={image.src} alt={title} fill priority
                        sizes="100vw" className="object-cover" />
                </div>
            )}

            <div className="page-wrap py-0 sm:py-5 lg:py-6">
                <div className="oc-article-shell sm:border sm:border-border bg-background">
                    <nav aria-label="Caminho de navegação" className="hidden border-b border-border px-4 py-2 sm:block sm:px-6 lg:px-8">
                        <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted">
                            <li><Link href="/" className="transition-colors hover:text-foreground">Início</Link></li>
                            <li className="text-muted/50">/</li>
                            <li><Link href="/blog" className="transition-colors hover:text-foreground">Artigos</Link></li>
                            <li className="text-muted/50">/</li>
                            <li className="truncate sm:overflow-visible sm:whitespace-normal text-foreground">{title}</li>
                        </ol>
                    </nav>

                    {/* Cabeçalho ocupa a largura editorial inteira; a sidebar começa abaixo. */}
                    <header className="hidden px-8 pt-10 lg:block">
                        {cat && (
                            <span className="mb-3 inline-block font-mono text-[9px] font-black uppercase tracking-[0.16em]"
                                style={{ color: cs.color }}>
                                {cat.name}
                            </span>
                        )}
                        <h1 className="mb-5 min-w-0 max-w-[1120px] wrap-anywhere text-[clamp(3.25rem,4.2vw,4rem)] font-black leading-[0.98] tracking-[-0.055em] text-foreground">
                            {title}<BrandDot />
                        </h1>
                        {summary && (
                            <p className="mb-7 max-w-[900px] text-[17px] leading-[1.6] text-muted xl:text-[19px]">
                                {summary.slice(0, 240)}
                            </p>
                        )}

                        {/* Byline — logo abaixo do subtítulo, antes da imagem */}
                        <div className="hidden lg:flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 mb-6">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
                                {author && (
                                    <span className="flex items-center gap-2 font-semibold text-foreground">
                                        <span className="font-mono text-[10px] font-black text-accent">{author.name.charAt(0).toUpperCase()}</span>
                                        {author.name}
                                    </span>
                                )}
                                <time dateTime={post.date} className="flex items-center gap-1.5">
                                    <Calendar size={12} /> {formatDateTime(post.date)}
                                </time>
                                {wasUpdated && (
                                    <time dateTime={post.modified} className="flex items-center gap-1.5">
                                        Atualizado em {formatDateTime(post.modified)}
                                    </time>
                                )}
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} /> {mins} min
                                </span>
                                {(post.acf?.views ?? 0) >= 100 && (
                                    <span className="flex items-center gap-1.5">
                                        <Eye size={12} /> {post.acf!.views!.toLocaleString(intlLocale())} visualizações
                                    </span>
                                )}
                            </div>
                            <EntityActionBar>
                                <ContentStateButton objectId={post.id} objectType="post" state="saved" label="Salvar leitura" activeLabel="Salvo" />
                                <ShareBar url={postUrl} title={title} />
                            </EntityActionBar>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-10 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:pb-8 lg:pt-0 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-stretch xl:gap-10">

                    {/* ── Coluna principal ── */}
                    <div className="min-w-0">
                        {/* Desktop image — depois da autoria, antes do conteúdo */}
                        {image && (
                            <figure
                                className="oc-hero-media hidden lg:block relative mb-10 w-full overflow-hidden bg-surface aspect-video"
                                style={primaryGroupColor ? { boxShadow: `0 32px 64px -28px ${toRgba(primaryGroupColor, 0.5)}` } : undefined}
                            >
                                <Image src={image.src} alt={image.alt || title} fill priority
                                    sizes="(max-width: 1280px) 100vw, calc(100vw - 360px)"
                                    className="object-cover" />
                            </figure>
                        )}

                        {/* Leaderboard após o bloco título–autoria–imagem: mantém alta
                            viewability sem separar a capa do título nem disputar o LCP. */}
                        {ADSENSE.slots.leaderboard && (
                            <AdSlotInline
                                slot={ADSENSE.slots.leaderboard}
                                layout="leaderboard"
                                analyticsPlacement="article_leaderboard"
                            />
                        )}

                        {enhancedContent.headings.length > 2 && (
                            <details className="group mb-7 rounded-md border border-border bg-surface xl:hidden">
                                <summary className="flex cursor-pointer select-none items-center justify-between gap-4 p-4 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-foreground list-none [&::-webkit-details-marker]:hidden">
                                    <span>O que você vai encontrar <span className="text-muted font-semibold normal-case">· {enhancedContent.headings.length} seções</span></span>
                                    <svg className="h-3.5 w-3.5 text-muted transition-transform group-open:rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4l4 4 4-4" /></svg>
                                </summary>
                                <div className="border-t border-border p-4">
                                    <BlogToc headings={enhancedContent.headings} />
                                </div>
                            </details>
                        )}

                        {/* Article content */}
                        <article
                            className="wp-article-content oc-article-reading-column w-full"
                            style={primaryGroupColor ? { '--color-accent': primaryGroupColor } as React.CSSProperties : undefined}
                        >
                            <BlogMobileReadMore>
                                {structuredModel ? (
                                    <>
                                        <GutenbergArticleRenderer model={structuredModel} />
                                    </>
                                ) : (
                                    <>
                                        <div className="prose dark:prose-invert max-w-none sm:[&_p]:text-justify" dangerouslySetInnerHTML={{ __html: articleLead }} />
                                        {contentSegments.map((segment, i) => (
                                            <div key={i}>
                                                {i > 0 && ADSENSE.slots.inline && <div className="my-8"><AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="article_body" /></div>}
                                                <div className="prose dark:prose-invert max-w-none sm:[&_p]:text-justify" dangerouslySetInnerHTML={{ __html: segment }} />
                                            </div>
                                        ))}
                                    </>
                                )}

                                {/* Quiz embed inline — ativado por campo ACF no WP */}
                                {post.acf?.quiz_embed_category && (
                                    <QuizEmbedLoader
                                        category={(post.acf.quiz_embed_category as QuizCategory)}
                                        count={5}
                                    />
                                )}

                                {/* Tags / Explorar por tema */}
                                {tags.length > 0 && (
                                    <div className="mt-10 pt-8 border-t border-border">
                                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted mb-3">Explorar por tema</p>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map(tag => {
                                                const ts = catStyle(tag.slug)
                                                return (
                                                    <Link key={tag.id} href={`/blog?tag=${tag.slug}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-80"
                                                        style={{ color: ts.color, backgroundColor: ts.bg }}>
                                                        <Tag size={9} />
                                                        {tag.name}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Entidades relacionadas / Explore também */}
                                {(() => {
                                    const entities = post.related_entities
                                    const uniqueArtists = (entities?.artists ?? []).filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)
                                    const hasArtists = uniqueArtists.length > 0
                                    const hasProductions = (entities?.productions?.length ?? 0) > 0
                                    const hasFoods = (entities?.foods?.length ?? 0) > 0
                                    const hasCompanies = (entities?.companies?.length ?? 0) > 0
                                    if (!hasArtists && !hasProductions && !hasFoods && !hasCompanies) return null
                                    return (
                                        <div className="mt-8 border-t border-border pt-8">
                                            <p className="mb-4 text-xs font-black uppercase tracking-widest text-muted">Explore também</p>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                {uniqueArtists.map(artist => (
                                                    <Link key={artist.id} href={`/artists/${artist.slug}`}
                                                        className="group flex items-center gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:border-accent/40">
                                                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-hover">
                                                            {artist.image
                                                                ? <Image src={artist.image} alt={artist.name} fill sizes="40px" className="object-cover object-top" />
                                                                : <User className="h-5 w-5 text-muted m-auto mt-2.5" />
                                                            }
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-black text-foreground transition-colors group-hover:text-accent">{artist.name}</span>
                                                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Artista</span>
                                                        </span>
                                                    </Link>
                                                ))}
                                                {(entities?.productions ?? []).map(prod => (
                                                    <Link key={prod.id} href={`/productions/${prod.slug}`}
                                                        className="group flex items-center gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:border-accent/40">
                                                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-hover">
                                                            {prod.image
                                                                ? <Image src={prod.image} alt={prod.title} fill sizes="40px" className="object-cover" />
                                                                : <Film className="h-5 w-5 text-muted m-auto mt-2.5" />
                                                            }
                                                        </span>
                                                        <span className="min-w-0">
                                                            <span className="block truncate text-sm font-black text-foreground transition-colors group-hover:text-accent">{prod.title}</span>
                                                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Produção</span>
                                                        </span>
                                                    </Link>
                                                ))}
                                                {(entities?.foods ?? []).map(food => {
                                                    const catEmoji = food.category ? (FOOD_CATEGORY_EMOJI[food.category] ?? '🍽️') : '🍽️'
                                                    const catLabel = food.category ? (FOOD_CATEGORY_LABELS[food.category] ?? 'Culinária') : 'Culinária'
                                                    return (
                                                        <Link key={food.id} href={`/comidas/${food.slug}`}
                                                            className="group flex items-center gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:border-accent/40">
                                                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-hover flex items-center justify-center">
                                                                {food.image
                                                                    ? <Image src={food.image} alt={food.title} fill sizes="40px" className="object-cover" />
                                                                    : <span className="text-[18px]">{catEmoji}</span>
                                                                }
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-black text-foreground transition-colors group-hover:text-accent">{food.title}</span>
                                                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                                                                    {catLabel}{food.spicy_level ? ` · ${'🌶'.repeat(Math.min(food.spicy_level, 3))}` : ''}
                                                                </span>
                                                            </span>
                                                        </Link>
                                                    )
                                                })}
                                                {(entities?.companies ?? []).map(company => {
                                                    const indEmoji = company.industry ? (COMPANY_INDUSTRY_EMOJI[company.industry] ?? '🏢') : '🏢'
                                                    const indLabel = company.industry ? (COMPANY_INDUSTRY_LABELS[company.industry] ?? 'Empresa') : 'Empresa'
                                                    return (
                                                        <Link key={company.id} href={`/empresas/${company.slug}`}
                                                            className="group flex items-center gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:border-accent/40">
                                                            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-hover flex items-center justify-center">
                                                                {company.image
                                                                    ? <Image src={company.image} alt={company.title} fill sizes="40px" className="object-contain p-1" />
                                                                    : <span className="text-[18px]">{indEmoji}</span>
                                                                }
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate text-sm font-black text-foreground transition-colors group-hover:text-accent">{company.title}</span>
                                                                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
                                                                    {company.is_chaebol ? 'Chaebol · ' : ''}{indLabel}
                                                                </span>
                                                            </span>
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* CTA compartilhamento */}
                                <div className="mt-4 rounded-md border border-border bg-surface p-5">
                                    <p className="font-bold text-foreground mb-1">Gostou? Compartilhe com outros fãs.</p>
                                    <p className="text-[12px] text-muted mb-4">Cada compartilhamento ajuda a comunidade a descobrir mais conteúdo sobre cultura coreana.</p>
                                    <EntityActionBar>
                                        <ShareBar url={postUrl} title={title} />
                                        <span className="text-border/50 text-[11px] hidden sm:inline">·</span>
                                        <ContentStateButton objectId={post.id} objectType="post" state="saved" label="Salvar leitura" activeLabel="Salvo" />
                                        <ContentStateButton objectId={post.id} objectType="post" state="read" label="Marcar como lido" activeLabel="Lido" />
                                    </EntityActionBar>
                                </div>
                            </BlogMobileReadMore>
                        </article>

                        {/* Sugerido para você — logo abaixo do botão SAIBA MAIS, vira sticky ao subir */}
                        {relatedPosts[0] && (
                            <div data-bloco="artigo-sugerido" className="mx-4 mt-6 mb-4 sm:mx-6 sm:mt-8 lg:mx-8">
                                {/* Passa a LISTA, nao o primeiro: a escolha final pula o que este
                                  * visitante ja leu, e isso so o navegador sabe. */}
                                <BlogSuggestedNext candidatos={relatedPosts} stopAtId="blog-suggested-stop" />
                            </div>
                        )}

                        {ADSENSE.slots.post_suggestion && (
                            <div className="mx-4 my-6 sm:mx-6 lg:mx-8">
                                <AdSlotInline
                                    slot={ADSENSE.slots.post_suggestion}
                                    layout="feed"
                                    analyticsPlacement="article_post_suggestion"
                                />
                            </div>
                        )}

                        {/* Author box */}
                        {author && (
                            <div id="blog-suggested-stop" className="mt-10 flex items-start gap-4 rounded-md border border-border bg-surface p-5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-[15px] font-black text-background">
                                    {author.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-muted mb-0.5">Escrito por</p>
                                    <p className="font-bold text-foreground text-[14px]">{author.name}</p>
                                    <p className="text-[12px] text-muted mt-0.5">Publicado em {formatDateTime(post.date)}{wasUpdated ? ` · Atualizado em ${formatDateTime(post.modified)}` : ''}</p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ── Sidebar ── */}
                    <aside
                        aria-label="Informações do artigo"
                        className="hidden xl:flex xl:flex-col"
                        style={{
                            position: 'sticky',
                            top: 'calc(var(--site-sticky-top, 92px) + var(--section-bar-h, 44px) + 36px + 8px)',
                            height: 'calc(100vh - var(--site-sticky-top, 92px) - var(--section-bar-h, 44px) - 36px - 24px)',
                        }}
                    >
                        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
                            {/* Artigos longos + viewport alta recebem inventário vertical;
                                curtos e notebooks baixos preservam o retângulo 300×250. */}
                            {ADSENSE.slots.article_sidebar && (
                                <ArticleSidebarAd
                                    slot={ADSENSE.slots.article_sidebar}
                                    readingMinutes={mins}
                                />
                            )}

                            {enhancedContent.headings.length > 2 && (
                                <div className="rounded-md border border-border bg-surface p-4">
                                    <BlogToc headings={enhancedContent.headings} />
                                </div>
                            )}

                            <div className="overflow-hidden rounded-xl border border-border bg-surface">
                                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
                                    <p className="text-caption font-black uppercase tracking-widest text-muted">Achados</p>
                                    <Link href="/blog" className="text-caption flex items-center gap-0.5 font-bold text-accent hover:underline">Ver tudo →</Link>
                                </div>
                                <p className="border border-x-0 border-t-0 border-accent/20 bg-accent/4 px-3 py-2 text-[10px] leading-relaxed text-muted">
                                    <strong className="text-foreground">Publicidade afiliada:</strong> podemos receber comissão por compras feitas por links desta vitrine, sem custo extra para você.
                                </p>
                            </div>

                            {categories.length > 1 && (
                                <div className="rounded-md border border-border bg-surface p-4">
                                    <p className="mb-3 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-muted">Categorias</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {categories.map(c => {
                                            const cs2 = catStyle(c.slug)
                                            return (
                                                <Link key={c.id} href={`/blog?category=${c.slug}`}
                                                    className="px-2 py-0.5 text-[11px] font-semibold transition-colors hover:brightness-95"
                                                    style={{ color: cs2.color, backgroundColor: cs2.bg }}>
                                                    {c.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </aside>
                    </div>

                {/* Quiz CTA — categoria do artigo */}
                <div id={author ? undefined : 'blog-suggested-stop'} className="mt-8">
                    <QuizWidget category={quizCategory} />
                </div>

                {/* Posts relacionados */}
                {moreRelatedPosts.length > 0 && (
                    <div data-bloco="artigo-leia-tambem" className="mt-10 border-t border-border pt-8 pb-8">
                        <div className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
                            <div className="min-w-0">
                                <p className="mb-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-accent">Continue lendo</p>
                                <h2 className="min-w-0 wrap-anywhere font-serif text-[clamp(1.6rem,3vw,2.15rem)] font-semibold leading-none tracking-[-0.035em] text-foreground">Leia também<BrandDot /></h2>
                            </div>
                            <Link href={cat ? `/blog?category=${cat.slug}` : '/blog'} className="shrink-0 whitespace-nowrap font-mono text-[10px] font-black uppercase tracking-[0.12em] text-accent transition-colors hover:text-accent-strong">Ver mais →</Link>
                        </div>
                        <div className="grid grid-cols-1 border-t border-border px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
                            {moreRelatedPosts.map((rp, index) => {
                                const rpImg = getWPImage(rp._embedded, rp.featured_image_url)
                                const rpTitle = stripHtml(rp.title.rendered)
                                const rpExcerpt = stripHtml(rp.excerpt?.rendered ?? '').slice(0, 100)
                                const rpCats = getWPTerms(rp._embedded, 'category')
                                const rpCat = rpCats[0]
                                return (
                                    <Link key={rp.id} href={`/blog/${rp.slug}`}
                                        className="group grid min-w-0 grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-border py-4 lg:grid-cols-1 lg:grid-rows-[112px_auto] lg:px-5 lg:py-5 lg:first:pl-0 lg:last:pr-0 lg:not-last:border-r">
                                        <div className="relative h-[88px] w-[88px] overflow-hidden bg-surface lg:h-28 lg:w-full">
                                            {rpImg ? (
                                                <Image src={rpImg.src} alt={rpImg.alt || rpTitle} fill
                                                    className="object-cover"
                                                    sizes="(max-width: 1024px) 88px, 28vw" />
                                            ) : (
                                                <div className="flex h-full w-full items-end border border-border bg-surface p-3" aria-hidden="true">
                                                    <span className="font-serif text-3xl leading-none text-muted/50">{String(index + 1).padStart(2, '0')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 self-center lg:self-start">
                                            {rpCat && (
                                                <span className="mb-1.5 block font-mono text-[9px] font-black uppercase tracking-[0.14em] text-accent">
                                                    {rpCat.name}
                                                </span>
                                            )}
                                            <span className="line-clamp-3 block text-[15px] font-bold leading-tight text-foreground transition-colors group-hover:text-accent sm:text-[16px]">
                                                {rpTitle}
                                            </span>
                                            {rpExcerpt && (
                                                <span className="mt-1.5 hidden text-[12px] leading-relaxed text-muted sm:line-clamp-2">
                                                    {rpExcerpt}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}

                </div>
            </div>
        </>
    )
}
