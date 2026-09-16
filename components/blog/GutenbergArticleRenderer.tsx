import { AdSlotInline } from '@/components/ui/AdSlotInline'
import { ADSENSE } from '@/lib/config/ads'
import type { ArticleModel } from '@/lib/blog/articleModel'

export function GutenbergArticleRenderer({ model }: { model: ArticleModel }) {
    return (
        <div className="prose dark:prose-invert max-w-none sm:[&_p]:text-justify" data-article-model-version={model.version}>
            {model.blocks.map((block) => (
                <div
                    key={block.id}
                    id={block.name === 'core/heading' && !/\sid=/.test(block.html) ? block.id : undefined}
                    data-article-block={block.name}
                >
                    <div dangerouslySetInnerHTML={{ __html: block.html }} />
                    {model.adBreakAfter.has(block.id) && ADSENSE.slots.inline && (
                        <div className="not-prose my-8"><AdSlotInline slot={ADSENSE.slots.inline} layout="content" analyticsPlacement="article_body" /></div>
                    )}
                </div>
            ))}
        </div>
    )
}
