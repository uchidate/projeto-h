/**
 * Tolerância do React a tradutores de página (Google Tradutor, tradução do
 * Chrome, WebView de apps).
 *
 * O tradutor troca os nós de texto por `<font>` sem avisar o React. Na próxima
 * atualização o React pede `removeChild`/`insertBefore` sobre o nó ORIGINAL, que
 * já não é filho daquele pai, e o navegador lança
 * "NotFoundError: Failed to execute 'removeChild' on 'Node'" — a página inteira
 * cai no error boundary. Sentry PHP-3 (49 eventos desde 2026-06, visitantes de
 * fora traduzindo a ficha) e PHP-2B (WebView Android).
 *
 * Contorno da issue facebook/react#11538: quando o nó já não pertence ao pai,
 * a operação vira no-op em vez de exceção. O DOM que o tradutor montou fica como
 * está; o React segue funcionando. Instalado uma única vez, só no navegador.
 */

const INSTALADO = Symbol.for('site.toleranciaTradutor')

export function instalarToleranciaTradutor(prototipo: Node | undefined = typeof Node === 'function' ? Node.prototype : undefined): boolean {
    if (!prototipo) return false
    const alvo = prototipo as Node & { [INSTALADO]?: boolean }
    if (alvo[INSTALADO]) return false

    const removeChildOriginal = prototipo.removeChild
    prototipo.removeChild = function <T extends Node>(this: Node, filho: T): T {
        if (filho.parentNode !== this) return filho
        return removeChildOriginal.call(this, filho) as T
    }

    const insertBeforeOriginal = prototipo.insertBefore
    prototipo.insertBefore = function <T extends Node>(this: Node, novo: T, referencia: Node | null): T {
        if (referencia && referencia.parentNode !== this) return novo
        return insertBeforeOriginal.call(this, novo, referencia) as T
    }

    alvo[INSTALADO] = true
    return true
}
