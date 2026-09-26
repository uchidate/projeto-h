import type { ReactNode } from 'react'
import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import type { ArticleModel } from '@/lib/blog/articleModel'

/** `cardGrupo` (variante B do teste) entra na primeira quebra de anúncio, logo antes dela; em texto curto, sem quebra, vai ao fim do corpo. */
export function GutenbergArticleRenderer({ model, cardGrupo }: { model: ArticleModel; cardGrupo?: ReactNode }) {
    const primeiraQuebra = cardGrupo
        ? (model.blocks.find(b => model.adBreakAfter.has(b.id)) ?? model.blocks[model.blocks.length - 1])?.id
        : undefined
    return (
        <div className="prose dark:prose-invert max-w-none sm:[&_p]:text-justify" data-article-model-version={model.version}>
            {model.blocks.map((block) => (
                <div
                    key={block.id}
                    id={block.name === 'core/heading' && !/\sid=/.test(block.html) ? block.id : undefined}
                    data-article-block={block.name}
                >
                    <div dangerouslySetInnerHTML={{ __html: block.html }} />
                    {block.id === primeiraQuebra && cardGrupo}
                    {model.adBreakAfter.has(block.id) && ADSENSE.slots.inline && (
                        <div className="not-prose my-8"><AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="article_body" /></div>
                    )}
                </div>
            ))}
        </div>
    )
}
