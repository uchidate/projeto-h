import { CollapsibleProse } from '@/components/profiles/CollapsibleProse'
import { SectionHeader } from '@/app/(site)/agencies/[slug]/components/SectionHeader'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyAbout({ view }: { view: AgencyView }) {
    const { contentHtml, contentLead, contentRest, excerptText, aboutFallback } = view
    return (
        <section id="sobre" className="scroll-mt-(--scroll-anchor-offset,106px)">
            <SectionHeader label="Perfil institucional" title="Contexto e trajetória" count={null} />
            <div className="mt-6 border-l-2 border-(--ac) pl-4 sm:pl-6">
                {contentHtml ? (
                    <div className="max-w-4xl">
                        <div
                            className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent prose-a:no-underline dark:prose-invert prose-a:hover:underline"
                            dangerouslySetInnerHTML={{ __html: contentLead }}
                        />
                        {contentRest && (
                            <CollapsibleProse label="Continuar a leitura">
                                <div
                                    className="profile-prose prose prose-base max-w-none prose-headings:font-black prose-a:text-accent dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: contentRest }}
                                />
                            </CollapsibleProse>
                        )}
                    </div>
                ) : (
                    <p className="text-[15px] leading-[1.85] text-foreground/80 max-w-3xl">{excerptText || aboutFallback}</p>
                )}
            </div>
        </section>
    )
}
