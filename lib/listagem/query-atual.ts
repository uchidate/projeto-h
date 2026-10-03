// Query da URL lida no momento do evento, no navegador. Os controles das
// listagens só precisam dela ao montar o próximo endereço; `useSearchParams()`
// faria a página estática exigir Suspense e entregar o conteúdo só no cliente.
export function queryAtual(): URLSearchParams {
    return new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search)
}
