/**
 * Fotos da loja revendedora koksara chegam com logo, selo "100% authentic" e moldura preta pintados na imagem.
 * A API de afiliados da Shopee devolve só essa foto, então o card dá zoom e a borda e o logo ficam fora do quadro.
 * Auditoria de 2026-11-01 nos produtos dos guias: 41 produtos da loja 457864097. Produto novo dessa loja entra aqui.
 */
const FOTO_COM_MARCA_DA_LOJA = new Set([
    35289, 29512, 35446, 35496, 35442, 35339, 35291, 35460, 35551, 35347, 29508, 29509, 29511, 35283, 35286, 35337,
    35331, 35468, 35471, 35338, 35307, 35504, 35282, 35542, 35470, 35567, 35559, 35341, 35355, 35285, 35288, 35280,
    35447, 35381, 35488, 35372, 35294, 35380, 35354, 35336, 35565,
])

/** Classe de zoom do `object-cover` (o contêiner já tem overflow-hidden); vazia quando a foto é limpa. */
export function zoomDaFoto(productId: number): string {
    return FOTO_COM_MARCA_DA_LOJA.has(productId) ? 'scale-[1.3]' : ''
}
