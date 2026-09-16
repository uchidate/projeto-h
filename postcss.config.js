// Prefixo dos blocos Gutenberg (`<prefixo>/lyrics` -> `.wp-block-<prefixo>-lyrics`,
// `.<prefixo>-lyrics__column`). O HTML vem gravado nos posts pelo plugin, entao
// o CSS precisa usar o prefixo real; no codigo ele aparece como `__bloco__` e e
// trocado aqui, no build. Valor real em NEXT_PUBLIC_BLOCK_CSS_PREFIX.
const PREFIXO_BLOCO = process.env.NEXT_PUBLIC_BLOCK_CSS_PREFIX || 'bloco'

const prefixoDosBlocos = () => ({
    postcssPlugin: 'prefixo-dos-blocos',
    Once(root) {
        root.walkRules((rule) => {
            if (rule.selector.includes('__bloco__')) {
                rule.selector = rule.selector.replaceAll('__bloco__', PREFIXO_BLOCO)
            }
        })
    },
})
prefixoDosBlocos.postcss = true

module.exports = {
    plugins: [prefixoDosBlocos, require('@tailwindcss/postcss')],
};
