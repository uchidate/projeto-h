import { forwardRef, type ComponentProps } from 'react'
import NextLink from 'next/link'
import { useLocale } from 'next-intl'
import type { Locale } from '@/lib/i18n/config'
import { localizarCaminho } from '@/lib/i18n/localizar-caminho'

/**
 * Substituto de `next/link` que leva o link para a versão do idioma atual.
 * O `href` continua sendo escrito como caminho em português (`/artists/${slug}`);
 * fora do português vira `/en/...` pelo registro de rotas. Qualquer outra forma
 * de `href` (objeto, URL externa, âncora) passa sem alteração.
 */
const LocalizedLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function LocalizedLink({ href, ...props }, ref) {
    const locale = useLocale() as Locale
    return <NextLink ref={ref} href={typeof href === 'string' ? localizarCaminho(href, locale) : href} {...props} />
})

export default LocalizedLink
