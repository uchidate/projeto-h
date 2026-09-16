import { useTranslations } from 'next-intl'
import { JsonLd } from '@/components/seo/JsonLd'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import { InfoCardGrid } from '@/components/blocks/InfoCardGrid'

export type EntityFAQItem = {
    question: string
    answer: string
}

interface EntityFAQProps {
    items: EntityFAQItem[]
    className?: string
    eyebrow?: string
    title?: string
    /** Sai sem <section id="faq"> própria — para quem já tem wrapper de seção. */
    unwrapped?: boolean
}

export function EntityFAQ({
    items,
    className = '',
    eyebrow,
    title,
    unwrapped = false,
}: EntityFAQProps) {
    const t = useTranslations('profile.faqDefaults')
    if (items.length === 0) return null

    // `unwrapped`: quem já é embrulhado por um wrapper de seção (perfil de
    // artista) pede o conteúdo sem <section> própria, para não aninhar seção
    // dentro de seção nem duplicar o id. As demais páginas — grupos, fandoms,
    // produções, agências — seguem com o elemento próprio, sem mudança.
    const Wrapper = unwrapped ? 'div' : 'section'

    return (
        <Wrapper {...(unwrapped ? {} : { id: 'faq' })} className={className}>
            <JsonLd
                data={{
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: items.map(item => ({
                        '@type': 'Question',
                        name: item.question,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: item.answer,
                        },
                    })),
                }}
            />
            <BlockHeader title={title ?? t('title')} eyebrow={eyebrow ?? t('eyebrow')} tone="muted" size="lg" />
            <InfoCardGrid columns={3} items={items.map(item => ({ key: item.question, title: item.question, body: <p>{item.answer}</p> }))} />
        </Wrapper>
    )
}
