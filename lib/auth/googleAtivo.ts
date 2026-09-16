/**
 * O login com Google está configurado neste ambiente?
 *
 * Lido em TEMPO DE EXECUÇÃO. As credenciais do Google existem só no servidor
 * (producao.env), nunca no build — e é assim que tem de ser, porque o segredo
 * não pode entrar na imagem.
 *
 * Quem chamar isto precisa estar numa rota dinâmica. Em 2026-09-13 as páginas
 * /entrar e /cadastro liam as variáveis direto e eram pré-renderizadas no build:
 * o HTML nasceu com o botão desligado e ficou congelado em cache, mesmo depois
 * de as credenciais serem configuradas e o provider `google` aparecer ativo em
 * /api/auth/providers.
 */
export function googleAtivo(): boolean {
    return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
}
