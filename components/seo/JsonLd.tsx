'use client'

import { omitNulls, serializeJsonLd } from '@/lib/seo/serialize'

export { omitNulls }

type Props = { data: Record<string, unknown> }

// JSON.stringify já omite chaves com valor `undefined`, mas mantém `null`
// literal — campos ACF vazios (ex: numberOfEpisodes de um filme sem
// episódios) chegam como null e viravam "campo": null no schema.org, um
// tipo inválido para a maioria das propriedades (Google reporta como erro
// de rich results). O replacer abaixo omite os dois casos igualmente.
export function JsonLd({ data }: Props) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
        />
    )
}
