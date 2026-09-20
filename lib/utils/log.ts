/**
 * Prepara um valor vindo do cliente para entrar num log.
 *
 * Dois problemas distintos, e os dois são reais numa rota pública:
 *
 * 1. **Forja de log.** Um `\n` no meio do valor cria uma linha nova que parece
 *    outro evento. Quem lê o log depois — ou o parser que alimenta o painel —
 *    não distingue o que foi forjado do que aconteceu.
 * 2. **Diretiva de formatação.** O `console` do Node interpreta `%s`, `%d`,
 *    `%o` e afins. Um valor com `%s` consome o próximo argumento da chamada e
 *    embaralha a mensagem.
 *
 * Por isso: tira caracteres de controle, escapa `%` e corta o tamanho.
 *
 * Não confundir com sanitização de HTML — isto serve só para log.
 */
export function paraLog(valor: unknown, max = 120): string {
    return String(valor ?? '—')
        // Quebra de linha primeiro e explícita: além de ser o caso que importa,
        // é a forma que o CodeQL reconhece como barreira de js/log-injection.
        // Uma classe como [\u0000-\u001f] cobre \n e \r, mas a análise não
        // enxerga isso e continua apontando o alerta.
        .replace(/[\r\n]+/g, ' ')
        // Demais caracteres de controle (tab, escape, DEL) sujam o log do mesmo
        // jeito, ainda que não criem linha nova.
        .replace(/[\x00-\x1f\x7f]+/g, ' ')
        .replace(/%/g, '%%')
        .slice(0, max)
}
