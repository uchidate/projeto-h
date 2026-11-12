import type { Receita } from '@/lib/receitas/tipos'

const TEXTOS = {
    pt: { titulo: (n: string) => `Como preparar ${n}`, rende: 'Rende', porcoes: (n: number) => `${n} porções`, preparo: 'Preparo', cozimento: 'Cozimento', total: 'Total', ingredientes: 'Ingredientes', modo: 'Modo de preparo', dicas: 'Dicas', adaptada: 'Receita adaptada de', conferidos: ', com técnica e tempos conferidos em ', e: ' e ', fim: '. Texto redigido pela equipe.' },
    ja: { titulo: (n: string) => `${n}の作り方`, rende: '分量', porcoes: (n: number) => `${n}人分`, preparo: '下準備', cozimento: '調理', total: '合計', ingredientes: '材料', modo: '作り方', dicas: 'ポイント', adaptada: 'レシピの出典：', conferidos: '。技法と時間の確認：', e: '、', fim: '。文章は編集部が書いたものです。' },
    en: { titulo: (n: string) => `How to make ${n}`, rende: 'Serves', porcoes: (n: number) => `${n} servings`, preparo: 'Prep', cozimento: 'Cook', total: 'Total', ingredientes: 'Ingredients', modo: 'Method', dicas: 'Tips', adaptada: 'Recipe adapted from', conferidos: ', with technique and timings checked against ', e: ' and ', fim: '. Text written by our team.' },
}

function formatarTempo(min: number, locale = 'pt'): string {
    const h = Math.floor(min / 60)
    const m = min % 60
    if (locale === 'ja') return h ? `${h}時間${m ? `${m}分` : ''}` : `${m}分`
    return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`
}

// Conteúdo visível que sustenta o recipeInstructions do schema: o Google
// exige que o JSON-LD corresponda ao que o leitor vê na página.
export function ReceitaPreparo({ nome, receita, locale = 'pt' }: { nome: string; receita: Receita; locale?: string }) {
    const x = TEXTOS[locale === 'pt' ? 'pt' : locale === 'ja' ? 'ja' : 'en']
    const total = receita.preparoMin + receita.cozimentoMin
    const [base, ...conferem] = receita.fontes
    return (
        <section id="como-preparar" className="mt-10" aria-labelledby="como-preparar-titulo">
            <h2 id="como-preparar-titulo" className="text-[24px] font-black tracking-[-0.02em]">
                {x.titulo(nome)}
            </h2>

            <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[12px]">
                <div><dt className="text-muted uppercase tracking-[0.06em]">{x.rende}</dt><dd className="text-[15px] font-bold">{receita.rendimento ?? x.porcoes(receita.porcoes)}</dd></div>
                <div><dt className="text-muted uppercase tracking-[0.06em]">{x.preparo}</dt><dd className="text-[15px] font-bold">{formatarTempo(receita.preparoMin, locale)}</dd></div>
                <div><dt className="text-muted uppercase tracking-[0.06em]">{x.cozimento}</dt><dd className="text-[15px] font-bold">{formatarTempo(receita.cozimentoMin, locale)}</dd></div>
                <div><dt className="text-muted uppercase tracking-[0.06em]">{x.total}</dt><dd className="text-[15px] font-bold">{formatarTempo(total, locale)}</dd></div>
            </dl>

            <h3 className="mt-8 text-[18px] font-bold">{x.ingredientes}</h3>
            <ul className="mt-3 space-y-2 text-[15px]">
                {receita.ingredientes.map(i => (
                    <li key={i.item} className="grid grid-cols-[7rem_1fr] sm:grid-cols-[11rem_1fr] gap-x-3">
                        <span className="font-semibold tabular-nums">{i.quantidade}</span>
                        <span className="text-foreground/80">{i.item}</span>
                    </li>
                ))}
            </ul>

            <h3 className="mt-8 text-[18px] font-bold">{x.modo}</h3>
            <ol className="mt-3 space-y-3 text-[15px] leading-relaxed">
                {receita.passos.map((passo, i) => (
                    <li key={i} className="flex gap-3">
                        <span className="w-6 shrink-0 font-mono text-[12px] font-black text-accent pt-1">{String(i + 1).padStart(2, '0')}</span>
                        <span>{passo}</span>
                    </li>
                ))}
            </ol>

            {receita.dicas && receita.dicas.length > 0 && (
                <>
                    <h3 className="mt-8 text-[18px] font-bold">{x.dicas}</h3>
                    <ul className="mt-3 list-disc pl-5 space-y-1.5 text-[15px] text-foreground/80">
                        {receita.dicas.map(d => <li key={d}>{d}</li>)}
                    </ul>
                </>
            )}

            <p className="mt-6 font-mono text-[11px] text-muted leading-relaxed">
                {x.adaptada} <a href={base.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{base.nome}</a>
                {conferem.length > 0 && <>{x.conferidos}{conferem.map((f, i) => (
                    <span key={f.url}>{i > 0 && (i === conferem.length - 1 ? x.e : ', ')}<a href={f.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{f.nome}</a></span>
                ))}</>}{x.fim}
            </p>
        </section>
    )
}
