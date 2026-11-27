/** Transformações do HTML do artigo antes de desenhar a página: cartões relacionados, mídia, títulos e embeds. */
import type { WPPost } from '@/lib/wordpress/types'
import { stripHtml } from '@/lib/utils'
import { labelsFor } from '@/lib/i18n/labels'
import { FOOD_CATEGORY_LABELS, FOOD_CATEGORY_EMOJI } from '@/lib/wordpress/foods'
import { COMPANY_INDUSTRY_LABELS, COMPANY_INDUSTRY_EMOJI } from '@/lib/wordpress/companies'

export type ArticleHeading = { id: string; text: string; level: 2 | 3 }
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
    const roles = (artist.roles ?? []).slice(0, 2).map(role => labelsFor('pt').role(role, artist.gender))
    previews[`artists/${keySlug.toLowerCase()}`] = {
        label: 'Artista',
        title: artist.name,
        href: `/artists/${artist.slug}`,
        image: artist.image,
        description: roles.length > 0 ? roles.join(' · ') : 'Perfil',
        cta: 'Ver perfil',
    }
}

export function buildRelatedPreviewMap(post: WPPost): RelatedPreviewMap {
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

export function enhanceArticleHtml(source: string, relatedPreviews: RelatedPreviewMap = {}): { html: string; headings: ArticleHeading[] } {
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
        (_match, _quote, tipo: string, spotifyId: string) => {
            // Montado do tipo e do ID: o link copiado do app traz `?si=…`, que não vai para o player.
            const embedUrl = `https://open.spotify.com/embed/${tipo}/${spotifyId}?utm_source=generator&theme=0`
            return `<div class="oc-spotify-embed"><iframe src="${embedUrl}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`
        }
    )

    // Remove parágrafos vazios do Gutenberg
    html = html.replace(/<p[^>]*>\s*(?:&nbsp;| )?\s*<\/p>/gi, '')

    // Move blocos oc-related-content que aparecem antes do primeiro parágrafo real
    // para depois do primeiro parágrafo — não bloqueia a leitura logo no topo
    {
        // O grupo é casado inteiro: parar no primeiro `</div>` cortaria o bloco no meio.
        const item = String.raw`(?:<div class="oc-related-content(?!-group)[^"]*">[\s\S]*?<\/div>|<p class="oc-related-content[^"]*">[\s\S]*?<\/p>)`
        const grupo = `<div class="oc-related-content-group">${item}*<\\/div>`
        const relatedAtTopRe = new RegExp(`^(\\s*(?:${grupo}|${item})\\s*)+`, 'i')
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
