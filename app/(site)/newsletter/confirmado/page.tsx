import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Newsletter',
    robots: { index: false, follow: false },
}

const TEXTOS: Record<string, { titulo: string; texto: string }> = {
    ok: { titulo: 'E-mail confirmado 💗', texto: 'Pronto! Você vai receber as novidades de K-pop e K-drama do HallyuHub. Em todo e-mail há um link para sair quando quiser.' },
    invalido: { titulo: 'Link inválido ou vencido', texto: 'O link de confirmação vale por 48 horas. Peça um novo no formulário do rodapé do site.' },
    erro: { titulo: 'Não deu certo agora', texto: 'Tivemos um problema para concluir seu cadastro. Tente de novo em alguns minutos.' },
}

export default async function NewsletterConfirmadoPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
    const { estado } = await searchParams
    const { titulo, texto } = TEXTOS[estado ?? ''] ?? TEXTOS.erro
    return (
        <div className="page-wrap max-w-xl py-16">
            <h1 className="text-[32px] font-black text-foreground">{titulo}</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">{texto}</p>
            <Link href="/" className="mt-8 inline-block bg-accent px-5 py-3 font-black text-white">Voltar ao início</Link>
        </div>
    )
}
