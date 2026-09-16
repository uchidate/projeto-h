import { SectionTitleBar } from '@/components/ui/SectionTitleBar'

interface Props {
    id: string
    eyebrow?: React.ReactNode
    title: React.ReactNode
    accent: string
}

/**
 * Título de seção no registro specimen: fio de cabeça em toda a largura, com o
 * rótulo numerado empilhado sobre o display serifado na mesma coluna.
 *
 * Antes era uma barra vertical de 2px na cor do artista à esquerda. Repetida em
 * ~19 seções, a barra virava a assinatura da página inteira — e cor sólida como
 * divisor é vocabulário de dashboard, não de impresso. O fio separa; a cor fica
 * reservada para onde carrega significado (eyebrow, links, dados).
 */
export function GroupSectionHeading({ id, eyebrow, title, accent }: Props) {
    return (
        <div id={id} className="border-t pt-5" style={{ borderColor: `${accent}33` }}>
            <SectionTitleBar eyebrow={eyebrow} title={title} />
        </div>
    )
}
