/** Próximas datas que a torcida comemora: aniversário de estreia do grupo e aniversário dos membros. */
export interface DataProxima {
    tipo: 'estreia' | 'aniversario'
    quem: string
    /** dd/mm */
    dia: string
    /** Dias a partir de hoje (0 = hoje). */
    dias: number
    /** Anos completados na data (estreia) ou idade que a pessoa faz (aniversário). */
    anos: number
}

interface Entrada { nome: string; data?: string | null; encerrado?: boolean }

function partes(d: string | null | undefined): { a: number; m: number; d: number } | null {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec((d ?? '').replace(/-/g, ''))
    if (!m) return null
    const [a, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
    return a > 1900 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31 ? { a, m: mes, d: dia } : null
}

/** Meia-noite UTC do dia civil, para diferenças exatas em dias sem efeito de fuso ou horário de verão. */
const utc = (a: number, m: number, d: number) => Date.UTC(a, m - 1, d)

function calcular(quem: string, tipo: DataProxima['tipo'], data: string | null | undefined, hoje: { a: number; m: number; d: number }, limite: number): DataProxima | null {
    const p = partes(data)
    if (!p) return null
    let ano = hoje.a
    let dias = Math.round((utc(ano, p.m, p.d) - utc(hoje.a, hoje.m, hoje.d)) / 86_400_000)
    if (dias < 0) { ano += 1; dias = Math.round((utc(ano, p.m, p.d) - utc(hoje.a, hoje.m, hoje.d)) / 86_400_000) }
    if (dias > limite) return null
    return { tipo, quem, dia: `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}`, dias, anos: ano - p.a }
}

/** As datas mais próximas (até `limite` dias), da mais perto para a mais longe. `hoje` no formato AAAA-MM-DD (dia civil de Brasília). */
export function proximasDatas(grupos: Entrada[], membros: Entrada[], hoje: string, limite = 90, max = 4): DataProxima[] {
    const [a, m, d] = hoje.split('-').map(Number)
    const h = { a, m, d }
    const lista: DataProxima[] = []
    for (const g of grupos) if (!g.encerrado) { const x = calcular(g.nome, 'estreia', g.data, h, limite); if (x && x.anos > 0) lista.push(x) }
    for (const p of membros) if (!p.encerrado) { const x = calcular(p.nome, 'aniversario', p.data, h, limite); if (x) lista.push(x) }
    return lista.sort((x, y) => x.dias - y.dias || x.quem.localeCompare(y.quem)).slice(0, max)
}
