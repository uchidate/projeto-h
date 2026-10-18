/**
 * Marca do site (o "H" com onda de components/ui/BrandMark) em elementos que o
 * `next/og` consegue desenhar: ícones do app e imagem padrão de compartilhamento.
 * Fica separada do componente de tela porque o satori só aceita estilo inline.
 */
export function MarcaOg({ tamanho, cor = '#ffffff' }: { tamanho: number; cor?: string }) {
    return (
        <svg viewBox="0 0 38 38" width={tamanho} height={tamanho} fill="none">
            <rect x="4" y="7" width="6" height="24" rx="3" fill={cor} />
            <rect x="28" y="7" width="6" height="24" rx="3" fill={cor} />
            <path d="M10 19 C13 14, 17 14, 19 19 C21 24, 25 24, 28 19" stroke="#ff2d78" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
    )
}

/** Quadrado escuro com a marca centralizada, no tamanho pedido (ícone do app e da tela de início). */
export function IconeOg({ lado }: { lado: number }) {
    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
            <MarcaOg tamanho={Math.round(lado * 0.66)} />
        </div>
    )
}
