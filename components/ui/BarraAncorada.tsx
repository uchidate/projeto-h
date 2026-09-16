import type { CSSProperties, ReactNode } from 'react'

/**
 * Barra que gruda logo abaixo do cabeçalho e o acompanha quando ele se esconde.
 *
 * ── Por que existe ──────────────────────────────────────────────────────────
 *
 * Sete componentes posicionavam-se pelo mesmo contrato de variáveis CSS, cada
 * um escrevendo `top` e a classe à mão. Nada obrigava o próximo a fazer igual —
 * e em 2026-09-11 dois esqueceram: a barra de tags do artigo ficou pairando no
 * meio da imagem de capa, e o card "Sugerido para você" usava `92` fixo no
 * código, número que ficou errado quando `--site-header-h` virou constante.
 *
 * O padrão dos dois erros é o mesmo: a regra existia, estava documentada, e
 * dependia de alguém lembrar. Aqui ela vira a única forma de escrever a barra.
 *
 * ── O contrato ──────────────────────────────────────────────────────────────
 *
 * `--site-header-h`   espaço reservado pelo cabeçalho. CONSTANTE — foi indo a
 *                     zero ao esconder o nav que produziu um CLS de 23.
 * `--reading-bar-h`   altura da barra de leitura, ou zero quando ela some.
 * `--section-bar-h`   altura da faixa de seção, ou zero onde ela não existe.
 * `--site-header-offset`  deslocamento visual, aplicado por `translate` na
 *                     classe `.segue-header`. Nunca em `top`: animar `top`
 *                     recalcula layout a cada quadro e cada quadro entra no CLS.
 */

type Props = {
    children: ReactNode
    /**
     * `fixed` sai do fluxo e cobre o conteúdo; `sticky` empurra enquanto rola.
     * Barra de navegação quer `fixed`; cabeçalho de seção costuma querer
     * `sticky`.
     */
    posicao?: 'fixed' | 'sticky'
    /** Empilha abaixo da barra de leitura, quando ela existir na página. */
    abaixoDaBarraDeLeitura?: boolean
    /**
     * Empilha abaixo da faixa de seção (`ResponsiveFilterBar`), quando a página
     * tiver uma. A variável vale zero nas páginas sem faixa, então marcar isto
     * é seguro mesmo onde a faixa não existe.
     */
    abaixoDaFaixaDeSecao?: boolean
    /** Espaço extra além do cabeçalho, em pixels — ex.: a faixa de categorias. */
    deslocamento?: number
    /** Camada. O padrão fica abaixo da barra de leitura (320) de propósito. */
    z?: number
    className?: string
    /**
     * Posicionamento HORIZONTAL calculado em runtime — `left` e `width` do card
     * que acompanha a coluna do artigo, por exemplo.
     *
     * `top` e `zIndex` são aplicados DEPOIS e vencem de propósito: são o
     * contrato, e é justamente escrevê-los à mão que produziu os dois bugs
     * descritos acima.
     */
    style?: CSSProperties
}

export function BarraAncorada({
    children,
    posicao = 'sticky',
    abaixoDaBarraDeLeitura = false,
    abaixoDaFaixaDeSecao = false,
    deslocamento = 0,
    z = 300,
    className = '',
    style,
}: Props) {
    // Montado em `calc` no CSS, não calculado em JS: assim a barra acompanha o
    // cabeçalho no mesmo quadro em que ele se move, sem depender de um evento
    // de scroll chegar ao React.
    const partes = ['var(--site-header-h, 64px)']
    if (abaixoDaBarraDeLeitura) partes.push('var(--reading-bar-h, 0px)')
    if (abaixoDaFaixaDeSecao) partes.push('var(--section-bar-h, 0px)')
    if (deslocamento) partes.push(`${deslocamento}px`)

    return (
        <div
            className={`segue-header ${posicao} ${className}`}
            style={{ ...style, top: `calc(${partes.join(' + ')})`, zIndex: z }}
        >
            {children}
        </div>
    )
}
