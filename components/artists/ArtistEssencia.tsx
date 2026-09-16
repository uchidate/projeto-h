import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { GroupSectionHeading } from '@/components/groups/GroupSectionHeading'

interface Props {
    eyebrow: string
    virada?: string
    porQueImporta?: string
    gravadora?: string
    obraChave?: string
    marca?: string
    // portaEntrada não entra aqui: o "Guia" (ArtistPremiumGateway), que sempre
    // aparece antes desta seção quando esse dado existe, já o exibe como card
    // clicável — repeti-lo aqui seria mostrar o mesmo fato duas vezes seguidas.
    tags?: string[]
    accent: string
    image?: { src: string; alt: string } | null
}

export function ArtistEssencia({ eyebrow, virada, porQueImporta, gravadora, obraChave, marca, tags, accent, image }: Props) {
    const t = useTranslations('profile.ui')
    const hasDuoCards = virada || porQueImporta
    const hasGrid = gravadora || obraChave || marca
    const hasTags = tags && tags.length > 0

    return (
        <div>
            <div className="mb-6"><GroupSectionHeading id="essencia-titulo" eyebrow={eyebrow} title={t('essencia.title')} accent={accent} /></div>

            {hasDuoCards && (
                <div className={`mb-4 grid gap-4 profile-measure ${image ? 'lg:grid-cols-[200px_minmax(0,1fr)_minmax(260px,0.38fr)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)]'}`}>
                    {image && (
                        <div className="relative hidden aspect-3/4 overflow-hidden lg:block">
                            <Image src={image.src} alt={image.alt} fill sizes="200px" className="object-cover" />
                        </div>
                    )}
                    {virada && (
                        <div className="profile-panel p-5 sm:p-6">
                            <p className="profile-kicker mb-3 text-accent">{t('essencia.turn')}</p>
                            <p className="text-[1.08rem] font-black leading-[1.42] tracking-tight text-foreground sm:text-[1.25rem]">{virada}</p>
                        </div>
                    )}
                    {porQueImporta && (
                        <div className="profile-panel p-5 sm:p-6">
                            <p className="profile-kicker mb-3 text-accent">{t('essencia.weight')}</p>
                            <p className="text-[0.95rem] leading-7 text-foreground-subtle">{porQueImporta}</p>
                        </div>
                    )}
                </div>
            )}

            {(hasGrid || hasTags) && (
                <div className="profile-panel profile-measure">
                    {hasGrid && (
                        <div className={`grid grid-cols-1 border-b border-border/70 sm:grid-cols-3 ${hasTags ? '' : 'border-b-0'}`}>
                            {gravadora && (
                                <div className="border-b border-border/70 p-4 sm:border-b-0 sm:border-r">
                                    <p className="profile-kicker mb-1">{t('essencia.label')}</p>
                                    <p className="text-[13px] font-semibold text-foreground leading-snug">{gravadora}</p>
                                </div>
                            )}
                            {obraChave && (
                                <div className="border-b border-border/70 p-4 sm:border-b-0 sm:border-r">
                                    <p className="profile-kicker mb-1">{t('essencia.keyWork')}</p>
                                    <p className="text-[13px] font-semibold text-foreground leading-snug">{obraChave}</p>
                                </div>
                            )}
                            {marca && (
                                <div className="p-4">
                                    <p className="profile-kicker mb-1">{t('essencia.signature')}</p>
                                    <p className="text-[13px] font-semibold text-foreground leading-snug">{marca}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {hasTags && (
                        <div className="flex flex-wrap gap-2 p-4">
                            {tags!.map(tag => (
                                <span key={tag} className="profile-chip border-accent/30 bg-accent/5 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-accent">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
