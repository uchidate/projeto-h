import { SITE_NAME } from '@/lib/constants/site'
import { useTranslations } from 'next-intl'
import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { BlockHeader } from '@/components/blocks/BlockHeader'
import { highlightProse } from '@/lib/profiles/highlightProse'
import { toRgba } from '@/lib/theme/color'

interface Props {
    content: string
    accent: string
    groupName: string
}

function parseEditorial(raw: string): { quote: string | null; body: string } {
    const quoteMatch = raw.match(/\[QUOTE\]([\s\S]*?)\[\/QUOTE\]\s*/i)
    const quote = quoteMatch?.[1]?.trim() ?? null

    const stripped = raw
        .replace(/\[QUOTE\][\s\S]*?\[\/QUOTE\]\s*/i, '')
        .replace(/\[DESTAQUE\]([\s\S]*?)\[\/DESTAQUE\]/gi, '<strong class="text-foreground">$1</strong>')
        .trim()

    // Converte blocos de texto separados por dupla quebra em parágrafos
    const body = stripped
        .split(/\n{2,}/)
        .flatMap(block => {
            const trimmed = block.trim()
            if (!trimmed) return []
            const lines = trimmed.split('\n')
            const parts: string[] = []
            // Primeira linha inteiramente **título** vira heading de seção,
            // esteja o bloco isolado ou colado ao parágrafo seguinte.
            const headingMatch = lines[0].trim().match(/^\*\*([^*]+)\*\*$/)
            if (headingMatch) {
                parts.push(`<h3 class="editorial-section-heading">${headingMatch[1]}</h3>`)
                lines.shift()
            }
            const rest = lines.join('\n').trim()
            if (rest) {
                // **bold** inline dentro de parágrafo; quebras simples → <br>
                const withBold = rest.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>')
                parts.push(`<p>${withBold.replace(/\n/g, '<br />')}</p>`)
            }
            return parts
        })
        .join('\n')

    return { quote, body }
}

export function GroupEditorialAnalysis({ content, accent, groupName }: Props) {
    const t = useTranslations('profile.ui')
    if (!content) return null

    const { quote, body } = parseEditorial(content)
    const highlightedBody = highlightProse(body, groupName)

    return (
        <section id="analise" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <BlockHeader title={t('analysis.title')} eyebrow={t('analysis.eyebrow')} tone="muted"
                meta={<span className="font-mono text-[10px] uppercase leading-4 tracking-widest text-muted">{SITE_NAME}</span>} />

            {quote && (
                <blockquote
                    className="profile-content-measure relative mb-6 py-1 pl-5 text-[17px] font-semibold italic leading-normal text-foreground/90 sm:text-xl"
                    style={{ borderLeft: `3px solid ${accent}` }}
                >
                    <span className="absolute -left-0.5 -top-2 text-5xl font-black leading-none select-none"
                        style={{ color: toRgba(accent, 0.25) }}>
                        &ldquo;
                    </span>
                    {quote}
                    <span className="not-italic text-foreground/40"> &rdquo;</span>
                </blockquote>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .editorial-body { counter-reset: editorial-tese; }
                .editorial-body h3.editorial-section-heading {
                    counter-increment: editorial-tese;
                    position: relative;
                    font-size: 17px;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    color: var(--color-foreground);
                    margin: 2rem 0 0.55rem;
                    padding: 0.55rem 0 0 2.1rem;
                    border-top: 2px solid ${toRgba(accent, 0.35)};
                }
                .editorial-body h3.editorial-section-heading::before {
                    content: "0" counter(editorial-tese);
                    position: absolute;
                    left: 0;
                    top: 0.72rem;
                    font-family: var(--font-mono, monospace);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.08em;
                    color: ${accent};
                }
                .editorial-body h3.editorial-section-heading:first-child { margin-top: 0; }
                .editorial-body p { margin: 0 0 0.85rem; line-height: 1.7; font-size: 1rem; color: var(--color-foreground); opacity: 0.87; }
            ` }} />
            <CollapsibleProse label={t('analysis.read')}>
                <div
                    className="editorial-body profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline dark:prose-invert prose-a:hover:underline"
                    dangerouslySetInnerHTML={{ __html: highlightedBody }}
                />
            </CollapsibleProse>

            <p className="profile-content-measure mt-4 text-right font-mono text-[10px] uppercase leading-4 tracking-widest text-muted">
                {t('analysis.credit')}
            </p>
        </section>
    )
}
