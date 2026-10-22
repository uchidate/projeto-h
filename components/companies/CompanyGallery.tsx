import Image from 'next/image'

interface Props {
    name: string
    urls: string[]
}

/** Galeria simples de fotos (loja, produto, evento) — primeira imagem em destaque, grade compacta. */
export function CompanyGallery({ name, urls }: Props) {
    if (urls.length === 0) return null

    return (
        <section id="galeria">
            <div className="mb-5 border-b border-foreground pb-3">
                <p className="font-mono text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-muted">Imagens</p>
                <h2 className="text-xl font-black tracking-[-0.03em]">Galeria</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {urls.slice(0, 9).map((url, index) => {
                    const isHero = index === 0 && urls.length > 1
                    return (
                        <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer"
                            className={`group relative overflow-hidden rounded-xl bg-surface border border-border ${isHero ? 'col-span-2 aspect-video sm:row-span-2 sm:aspect-auto' : 'aspect-video'}`}>
                            <Image src={url} alt={`${name} — foto ${index + 1}`} fill
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                sizes={isHero ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 50vw, 33vw'} />
                        </a>
                    )
                })}
            </div>
        </section>
    )
}
