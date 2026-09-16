import { ContentStateButton } from '@/components/features/ContentStateButton'
import { ReadingBar } from '@/components/ui/ReadingBar'

interface Props {
    title?: string
    catName?: string
    catSlug?: string
    catColor?: string
    mins?: number
    postUrl?: string
    postId?: number
}

export function BlogReadingProgress({ title, catName, catSlug, catColor, postUrl, postId }: Props) {
    const isRich = !!(title && postUrl)

    if (!isRich) return null

    return (
        <ReadingBar
            backHref="/blog"
            backLabel="Artigos"
            tagLabel={catName}
            tagHref={catSlug ? `/blog?category=${catSlug}` : '/blog'}
            tagColor={catColor}
            title={title!}
            pageUrl={postUrl!}
            actions={postId ? (
                <div className="hidden sm:block">
                    <ContentStateButton objectId={postId} objectType="post" state="saved" label="Salvar" activeLabel="Salvo" />
                </div>
            ) : undefined}
        />
    )
}
