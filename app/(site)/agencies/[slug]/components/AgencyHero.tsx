import Image from 'next/image'
import { ExternalLink, Globe, Users, Calendar, Star, Music2 } from 'lucide-react'
import type { AgencyView } from '@/app/(site)/agencies/[slug]/lib/carregarAgencia'

export function AgencyHero({ view }: { view: AgencyView }) {
    const { name, mark, logo, acf, isBig4, tierLabel, entityLabel, originYear, allArtists, allGroups, heroImages } = view
    return (
        <div className="page-wrap pt-4 sm:pt-6">
            <div className="relative h-[56svh] min-h-[420px] max-h-[560px] overflow-hidden border border-foreground/10 sm:h-[62vh] sm:min-h-[480px] sm:max-h-[620px]">
            {/* Mosaico editorial: uma imagem principal e duas de apoio. */}
            {heroImages.length > 0 ? (
                <div className="absolute inset-0 grid grid-cols-[minmax(0,1.65fr)_minmax(118px,0.85fr)] sm:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)] sm:grid-rows-2">
                    {heroImages.map((img, i) => (
                        <div key={i} className={`relative min-w-0 overflow-hidden border-white/10 ${i === 0 ? 'row-span-2 border-r' : i === 1 ? 'border-b' : 'hidden sm:block'}`}>
                            <Image
                                src={img.src}
                                alt=""
                                fill
                                priority={i === 0}
                                className="object-cover object-top transition-transform duration-1400 motion-safe:hover:scale-[1.025] motion-reduce:transition-none"
                                sizes={i === 0 ? '(max-width: 640px) 68vw, 72vw' : '(max-width: 640px) 32vw, 28vw'}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="absolute inset-0 [background:var(--ac-15)]" />
            )}

            {/* Gradient layers */}
            <div className="absolute inset-0" style={{
                background: `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.5) 65%, var(--color-background,#0a0a0a) 100%)`
            }} />
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-black/50" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end">
                <div className="px-5 pb-7 sm:px-8 sm:pb-10">
                    <div className="flex items-end gap-4 sm:gap-7">
                        {/* Logo / fallback mark */}
                        {logo ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden border-2 border-white/20 bg-black/60 backdrop-blur-xs sm:h-28 sm:w-28">
                                <Image src={logo.src} alt={`${name} — logo`} fill priority className="object-contain p-2.5" sizes="(max-width: 640px) 64px, 112px" />
                            </div>
                        ) : (
                            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-2 border-white/20 bg-black/55 backdrop-blur-xs sm:h-28 sm:w-28">
                                <span className="absolute text-[52px] sm:text-[72px] font-black -tracking-widest text-white/5">
                                    {mark}
                                </span>
                                <span className="relative border border-white/15 bg-white/10 px-2.5 py-1.5 font-mono text-[12px] sm:text-[14px] font-black tracking-[0.16em] text-white/65">
                                    {mark}
                                </span>
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="border border-white/25 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-xs">
                                    {entityLabel}
                                </span>
                                {tierLabel && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-xs [background:var(--ac-brand)]">
                                        {isBig4 && <Star size={9} fill="currentColor" />}
                                        {tierLabel}
                                    </span>
                                )}
                                {originYear && (
                                    <span className="border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[10px] text-white/60 backdrop-blur-xs">
                                        origem {originYear}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-[32px] font-black leading-none tracking-tight text-white drop-shadow-lg sm:text-[56px]">
                                {name}
                            </h1>
                            {acf.name_hangul && (
                                <p className="font-mono text-[15px] sm:text-[18px] text-white/50 tracking-[0.08em] mt-1.5">
                                    {acf.name_hangul}
                                </p>
                            )}

                            {/* Quick stats strip */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[10px] text-white/60 sm:mt-4 sm:gap-x-5 sm:text-[11px]">
                                {originYear && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={11} className="opacity-60" />
                                        trajetória desde <strong className="text-white">{originYear}</strong>
                                    </span>
                                )}
                                {allGroups.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Music2 size={11} className="opacity-60" />
                                        <strong className="text-white">{allGroups.length}</strong> grupos cobertos
                                    </span>
                                )}
                                {allArtists.length > 0 && (
                                    <span className="flex items-center gap-1.5">
                                        <Users size={11} className="opacity-60" />
                                        <strong className="text-white">{allArtists.length}</strong> perfis no acervo
                                    </span>
                                )}
                                {acf.website && (
                                    <a href={acf.website} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-white/50 hover:text-white transition-colors">
                                        <Globe size={11} /> Site oficial <ExternalLink size={9} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    )
}
