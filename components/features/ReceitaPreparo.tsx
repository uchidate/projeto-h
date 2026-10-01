import type { Receita } from '@/lib/receitas/tipos'

function formatarTempo(min: number): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

// Conteúdo visível que sustenta o recipeInstructions do schema: o Google
// exige que o JSON-LD corresponda ao que o leitor vê na página.
export function ReceitaPreparo({ nome, receita }: { nome: string; receita: Receita }) {
    const total = receita.preparoMin + receita.cozimentoMin
    return (
        <section id="como-preparar" className="mt-10" aria-labelledby="como-preparar-titulo">
            <h2 id="como-preparar-titulo" className="text-[24px] font-black tracking-[-0.02em]">
                Como preparar {nome}
            </h2>

            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[12px]">
                <div><dt className="text-muted uppercase tracking-[0.06em]">Rende</dt><dd className="text-[15px] font-bold">{receita.porcoes} porções</dd></div>
                <div><dt className="text-muted uppercase tracking-[0.06em]">Preparo</dt><dd className="text-[15px] font-bold">{formatarTempo(receita.preparoMin)}</dd></div>
                <div><dt className="text-muted uppercase tracking-[0.06em]">Cozimento</dt><dd className="text-[15px] font-bold">{formatarTempo(receita.cozimentoMin)}</dd></div>
                <div><dt className="text-muted uppercase tracking-[0.06em]">Total</dt><dd className="text-[15px] font-bold">{formatarTempo(total)}</dd></div>
            </dl>

            <h3 className="mt-8 text-[18px] font-bold">Ingredientes</h3>
            <ul className="mt-3 space-y-1.5 text-[15px]">
                {receita.ingredientes.map(i => (
                    <li key={i.item} className="flex gap-2">
                        <span className="font-semibold tabular-nums">{i.quantidade}</span>
                        <span className="text-foreground/80">{i.item}</span>
                    </li>
                ))}
            </ul>

            <h3 className="mt-8 text-[18px] font-bold">Modo de preparo</h3>
            <ol className="mt-3 space-y-3 text-[15px] leading-relaxed">
                {receita.passos.map((passo, i) => (
                    <li key={i} className="flex gap-3">
                        <span className="font-mono text-[12px] font-black text-accent pt-1">{String(i + 1).padStart(2, '0')}</span>
                        <span>{passo}</span>
                    </li>
                ))}
            </ol>

            {receita.dicas && receita.dicas.length > 0 && (
                <>
                    <h3 className="mt-8 text-[18px] font-bold">Dicas</h3>
                    <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[15px] text-foreground/80">
                        {receita.dicas.map(d => <li key={d}>{d}</li>)}
                    </ul>
                </>
            )}

            <p className="mt-6 font-mono text-[11px] text-muted leading-relaxed">
                Quantidades e tempos conferidos em {receita.fontes.map((f, i) => (
                    <span key={f.url}>{i > 0 && (i === receita.fontes.length - 1 ? ' e ' : ', ')}<a href={f.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{f.nome}</a></span>
                ))}; texto adaptado pela redação.
            </p>
        </section>
    )
}
