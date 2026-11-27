/**
 * Destino depois do login ou do cadastro. `callbackUrl` vem da barra de
 * endereços: sem este filtro, um link montado por terceiros usava a nossa tela
 * de login para entregar o visitante em outro site.
 *
 * Aceita caminho ou URL do próprio site e devolve sempre um caminho. Quem
 * decide é o parser de URL do navegador, o mesmo que vai navegar: comparar
 * prefixos deixa passar `/\outro.com` e `/<tab>/outro.com`.
 */
export function destinoSeguro(valor: string, reserva: string, origem: string): string {
    try {
        const url = new URL(valor, origem)
        // `/.//outro.com` é do site, mas o caminho resultante (`//outro.com`) não.
        if (url.origin !== origem || url.pathname.startsWith('//')) return reserva
        return `${url.pathname}${url.search}${url.hash}`
    } catch {
        return reserva
    }
}
