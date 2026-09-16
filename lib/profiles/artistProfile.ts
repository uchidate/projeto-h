import type { WPArtist } from '@/lib/wordpress/types'
import { localizePlace } from '@/lib/i18n/place'
import { labelsFor, type Labels } from '@/lib/i18n/labels'
import { intlLocale } from '@/lib/i18n/format'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { buildSocialEntries } from '@/lib/artists/socials'
import { getZodiac } from '@/lib/artists/zodiac'
import { splitContentForAd } from '@/lib/utils/injectAd'
import { extractYoutubeId, formatDate, getAge, parseAcfDate, stripHtml } from '@/lib/utils'
import { parseArtistAwards, parseArtistMilestones } from './structuredFields'

/** Linha de idade do hero: anos de vida para quem morreu, idade para quem está vivo. */
function buildHeroAgeMeta(
    { isDeceased, birthYear, deathYear, age }:
    { isDeceased: boolean; birthYear: number | null; deathYear: number | null; age: number | null },
    labels: Labels,
) {
    if (isDeceased && birthYear) return `${birthYear}–${deathYear}`
    if (age != null) return labels.t('age', { age })
    return null
}

export function buildArtistProfileModel(artist: WPArtist, today = new Date(), locale: Locale = DEFAULT_LOCALE) {
    const labels = labelsFor(locale)
    const dateLocale = intlLocale(locale)
    const name = stripHtml(artist.title.rendered) || artist.slug
    const acf = artist.acf ?? {}
    const content = artist.content.rendered
    const [contentBefore, contentAfter] = splitContentForAd(content, 3)
    // Artista falecido: idade e tempo de carreira param na data da morte. Sem isso
    // o perfil mostra "51 anos" e "25 anos de carreira" para quem morreu em 2023.
    const deathDate = acf.death_date ? parseAcfDate(acf.death_date) : null
    const isDeceased = deathDate != null && !Number.isNaN(deathDate.getTime())
    const referenceDate = isDeceased ? deathDate : today
    const age = getAge(acf.birth_date, referenceDate)
    const deathYear = isDeceased ? deathDate.getUTCFullYear() : null
    const birthYear = acf.birth_date ? parseAcfDate(acf.birth_date).getUTCFullYear() : null
    // Falecido: os anos de vida dizem mais do que uma idade congelada solta.
    const heroAgeMeta = buildHeroAgeMeta({ isDeceased, birthYear, deathYear, age }, labels)
    const zodiac = acf.birth_date ? getZodiac(acf.birth_date) : null
    const roleLabels = (acf.roles ?? []).map(labels.role)
    const debutYear = acf.debut_date ? parseAcfDate(acf.debut_date).getUTCFullYear() : null
    const curiosidades = acf.curiosidades ?? []
    const awards = parseArtistAwards(acf.awards)
    const milestones = parseArtistMilestones(acf.milestones)
    const storyChapters = acf.story_chapters ?? []
    const keyMetrics = (acf.key_metrics ?? []).filter(metric => metric.value && metric.label)
    const accent = acf.color || '#e91e8c'
    const essencia = {
        virada: acf.essencia_virada,
        porQueImporta: acf.essencia_por_que_importa,
        gravadora: acf.essencia_gravadora,
        obraChave: acf.essencia_obra_chave,
        marca: acf.essencia_marca,
        portaEntrada: acf.essencia_porta_entrada,
        tags: acf.essencia_tags,
    }

    const videoList: Array<{ title: string; url: string }> =
        Array.isArray(artist.videos_rest) && artist.videos_rest.length > 0
            ? artist.videos_rest
            : Array.isArray(acf.videos) && acf.videos.length > 0
                ? acf.videos
                : acf.mv_url
                    ? [{ title: name, url: acf.mv_url }]
                    : acf.youtube && extractYoutubeId(acf.youtube)
                        ? [{ title: name, url: acf.youtube }]
                        : []

    const hasBio = content.length > 10
    const heroCopy = hasBio
        ? (() => {
            const text = stripHtml(content).trim()
            const sentence = text.match(/^.{30,}?[.!?](?:\s|$)/)
            return sentence ? sentence[0].trim() : text.slice(0, 200)
        })()
        : null

    return {
        name,
        acf,
        contentBefore,
        contentAfter,
        age,
        zodiac,
        roleLabels,
        socialEntries: buildSocialEntries(acf),
        curiosidades,
        awards,
        milestones,
        storyChapters,
        keyMetrics,
        accent,
        debutYear,
        deathYear,
        isDeceased,
        careerStatement: acf.career_statement || null,
        careerStatementSub: acf.career_statement_sub || null,
        cinematicImage: acf.cinematic_image || null,
        editorialAnalysis: acf.editorial_analysis || null,
        bioQuote: acf.bio_quote_text && acf.bio_quote_author
            ? { text: acf.bio_quote_text, author: acf.bio_quote_author, context: acf.bio_quote_context }
            : null,
        essencia,
        videoList,
        heroCopy,
        heroMeta: [
            acf.name_hangul || null,
            heroAgeMeta,
            localizePlace(acf.birth_place, locale),
        ].filter(Boolean) as string[],
        quickFacts: [
            debutYear ? [labels.t('fact.debut'), String(debutYear)] : null,
            acf.birth_date ? [labels.t('fact.birth'), formatDate(acf.birth_date, dateLocale)] : null,
            isDeceased && acf.death_date ? [labels.t('fact.death'), formatDate(acf.death_date, dateLocale)] : null,
            acf.height ? [labels.t('fact.height'), `${acf.height} cm`] : null,
            zodiac ? [labels.t('fact.zodiac'), `${zodiac.emoji} ${zodiac.sign}`] : null,
        ].filter(Boolean) as [string, string][],
        biographyFacts: {
            birthDate: acf.birth_date,
            deathDate: acf.death_date,
            birthPlace: localizePlace(acf.birth_place, locale) ?? undefined,
            height: acf.height,
            mbti: acf.mbti,
            debutDate: acf.debut_date,
        },
        hasBio,
        hasEssencia: Object.values(essencia).some(value => Array.isArray(value) ? value.length > 0 : !!value),
        hasCuriosidades: curiosidades.length > 0,
        hasAwards: awards.length > 0,
        hasMilestones: milestones.length > 0,
        hasStoryChapters: storyChapters.length > 0,
        hasKeyMetrics: keyMetrics.length >= 3,
    }
}

export type ArtistProfileModel = ReturnType<typeof buildArtistProfileModel>
