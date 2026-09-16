import { htmlLang } from '@/lib/i18n/format'
import { SITE_NAME, SITE_URL } from '@/lib/constants/site'

type BreadcrumbItem = { name: string; url: string }

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }
}

type OrganizationSchemaInput = {
    name: string
    url: string
    logo?: string | null
    description?: string
    foundingDate?: number
    sameAs?: string[]
}

export function buildOrganizationSchema({ name, url, logo, description, foundingDate, sameAs }: OrganizationSchemaInput) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        url,
        ...(logo && { logo }),
        ...(description && { description }),
        ...(foundingDate && { foundingDate: String(foundingDate) }),
        ...(sameAs && sameAs.length > 0 && { sameAs }),
    }
}

type ArticleSchemaInput = {
    type: 'NewsArticle' | 'BlogPosting'
    headline: string
    description: string
    url: string
    datePublished: string
    dateModified: string
    image?: string | null
    author: { type: 'Person' | 'Organization'; name: string; url?: string }
    publisher: { name: string; url: string }
    articleSection?: string
}

export function buildArticleSchema({
    type, headline, description, url, datePublished, dateModified,
    image, author, publisher, articleSection,
}: ArticleSchemaInput) {
    return {
        '@context': 'https://schema.org',
        '@type': type,
        headline,
        description,
        url,
        datePublished,
        dateModified,
        ...(image && { image: { '@type': 'ImageObject', url: image } }),
        author: {
            '@type': author.type,
            name: author.name,
            ...(author.url && { url: author.url }),
        },
        publisher: { '@type': 'Organization', name: publisher.name, url: publisher.url },
        inLanguage: htmlLang(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        ...(articleSection && { articleSection }),
    }
}

type RecipeSchemaInput = {
    name: string
    nameKorean?: string | null
    description?: string
    image?: string | null
    url: string
    category?: string | null
    region?: string | null
    ingredients?: string[]
    keywords?: string[]
    isVegetarian?: boolean
    isVegan?: boolean
    datePublished?: string
    dateModified?: string
}

// Schema.org Recipe simplificado: só declara campos que refletem dado real
// do CPT food (sem inventar recipeInstructions/prepTime que não temos).
export function buildRecipeSchema({
    name, nameKorean, description, image, url, category, region,
    ingredients, keywords, isVegetarian, isVegan, datePublished, dateModified,
}: RecipeSchemaInput) {
    const suitableForDiet = isVegan
        ? 'https://schema.org/VeganDiet'
        : isVegetarian
            ? 'https://schema.org/VegetarianDiet'
            : undefined

    return {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: nameKorean ? `${name} (${nameKorean})` : name,
        url,
        ...(description && { description }),
        ...(image && { image: [image] }),
        recipeCuisine: 'Korean',
        ...(category && { recipeCategory: category }),
        ...(region && { keywords: [region, ...(keywords ?? [])].join(', ') }),
        ...(!region && keywords && keywords.length > 0 && { keywords: keywords.join(', ') }),
        ...(ingredients && ingredients.length > 0 && { recipeIngredient: ingredients }),
        ...(suitableForDiet && { suitableForDiet }),
        author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        ...(datePublished && { datePublished }),
        ...(dateModified && { dateModified }),
    }
}
