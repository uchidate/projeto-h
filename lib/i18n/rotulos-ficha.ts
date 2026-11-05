import { getTranslations } from 'next-intl/server'
import { DEFAULT_LOCALE, type Locale } from './config'
import { rotuloDoSetor, setorNormalizado } from '@/lib/wordpress/companies'
import { FOOD_CATEGORY_LABELS } from '@/lib/wordpress/foods'

/** As chaves vêm do WordPress (dinâmicas), então o tipo estrito das mensagens não se aplica. */
function rotuloDe(t: unknown, chave: string): string | null {
    const solto = t as ((k: string) => string) & { has: (k: string) => boolean }
    return solto.has(chave) ? solto(chave) : null
}

/** Rótulo do setor da empresa no idioma, ou null se desconhecido. Português mantém o mapa original. */
export async function rotuloDoSetorEm(industry: string | null | undefined, locale: Locale): Promise<string | null> {
    if (locale === DEFAULT_LOCALE) return rotuloDoSetor(industry)
    const chave = setorNormalizado(industry)
    if (!chave) return null
    return rotuloDe(await getTranslations({ locale, namespace: 'entity.company.industries' }), chave)
}

/** Rótulo da categoria do prato no idioma, ou null se desconhecida. */
export async function rotuloDaCategoriaEm(category: string | null | undefined, locale: Locale): Promise<string | null> {
    if (!category) return null
    if (locale === DEFAULT_LOCALE) return FOOD_CATEGORY_LABELS[category] ?? null
    return rotuloDe(await getTranslations({ locale, namespace: 'entity.food.categories' }), category)
}
