/**
 * Tamanho do título do hero pela extensão do nome.
 *
 * Um corpo único (40/56/76 px) serve a "Mimi" e quebra em cinco linhas em "O Retorno
 * de um Gangster no Ensino Médio", que empurrava os botões para fora da primeira
 * tela no celular. Cada faixa mantém ~3 linhas no máximo na largura útil do hero.
 *
 * Classes literais por faixa: o Tailwind não enxerga nomes montados em tempo de execução.
 */
const FAIXAS = [
    { ate: 16, classe: 'text-[40px] sm:text-[56px] lg:text-[76px]' },
    { ate: 28, classe: 'text-[34px] sm:text-[46px] lg:text-[60px]' },
    { ate: 42, classe: 'text-[28px] sm:text-[38px] lg:text-[50px]' },
    { ate: Infinity, classe: 'text-[24px] sm:text-[32px] lg:text-[42px]' },
] as const

export function classeDoTituloHero(titulo: string): string {
    const n = [...titulo.trim()].length
    return (FAIXAS.find(f => n <= f.ate) ?? FAIXAS[FAIXAS.length - 1]).classe
}
