import { SITE_DOMAIN } from '@/lib/constants/site'
import { ImageResponse } from 'next/og'
import { type NextRequest } from 'next/server'
import { normalizeOgParams } from '@/lib/og/params'
import { prepararImagemParaOg } from '@/lib/og/imagem'

// `nodejs`, nao `edge`: o Edge Runtime esta deprecado no Next 16, que avisa a
// cada build. E, no caso desta pagina, o aviso vinha acompanhado de um custo
// concreto — "using edge runtime on a page currently disables static generation
// for that page". O `next/og` ja roda em nodejs, entao a troca devolve a
// pre-renderizacao e remove a deprecacao de uma vez.
export const runtime = 'nodejs'

const ACCENT = '#e91e8c'
const BG     = '#0a0a0a'

/**
 * Busca a imagem de fundo e devolve como data URI, ou null.
 *
 * Por que nao deixar o `<img src={url}>` buscar sozinho: o motor do next/og
 * faz essa busca sem prazo e sem tratamento de erro. Quando ela falha ou
 * demora — o que acontece sob carga, com o cache ISR frio logo apos um deploy —
 * ele lanca "Image size cannot be determined" e a resposta inteira morre com
 * "failed to pipe response". Foram 1.196 dessas numa janela de 14 minutos em
 * 2026-09-09, e cada uma significa link compartilhado sem previa.
 *
 * Com data URI o motor nao busca nada: decodifica o que ja esta em memoria.
 * A falha passa a ser tratavel aqui, e o pior caso vira uma imagem OG sem o
 * fundo desfocado — que aparece a 18% de opacidade e quase nao se nota — em
 * vez de nenhuma imagem.
 */
const PRAZO_IMAGEM_MS = 3000
/** Acima disto nao compensa: o fundo e desfocado e quase transparente. */
const LIMITE_BYTES = 2 * 1024 * 1024

function paraBase64(bytes: Uint8Array): string {
    // Em blocos: `String.fromCharCode(...bytes)` estoura a pilha em imagens
    // grandes, e o runtime edge nao tem Buffer. Recebe a VISTA, nao o
    // ArrayBuffer: a saida do sharp e um pedaco de um pool maior.
    const BLOCO = 8192
    let binario = ''
    for (let i = 0; i < bytes.length; i += BLOCO) {
        binario += String.fromCharCode(...bytes.subarray(i, i + BLOCO))
    }
    return btoa(binario)
}

async function carregarImagem(url: string): Promise<string | null> {
    if (!url) return null
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(PRAZO_IMAGEM_MS) })
        if (!res.ok) return null
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength > LIMITE_BYTES) return null
        // WebP e outros formatos que o satori nao le viram JPEG (ver lib/og/imagem.ts).
        const pronta = await prepararImagemParaOg(res.headers.get('content-type') ?? '', new Uint8Array(buffer))
        if (!pronta) return null
        return `data:${pronta.tipo};base64,${paraBase64(pronta.bytes)}`
    } catch {
        return null
    }
}

export async function GET(req: NextRequest) {
    const { title, subtitle, imageUrl, type } = normalizeOgParams(req.nextUrl.searchParams)

    const imagemEmbutida = await carregarImagem(imageUrl)
    const hasImage = imagemEmbutida !== null
    const isPortrait = type === 'artist' || type === 'group'
    const isAgency = type === 'agency'

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    background: BG,
                    fontFamily: 'sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Imagem de fundo desfocada (quando existe) */}
                {hasImage && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imagemEmbutida}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center top',
                                opacity: 0.18,
                                filter: 'blur(12px)',
                            }}
                        />
                    </div>
                )}

                {/* Gradiente overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(90deg, ${BG} 45%, transparent 100%)`,
                        display: 'flex',
                    }}
                />

                {/* Imagem principal (portrait para artistas/grupos, landscape para outros) */}
                {hasImage && (
                    <div
                        style={{
                            position: 'absolute',
                            right: isAgency ? 60 : 0,
                            top: isAgency ? 80 : 0,
                            bottom: isAgency ? 80 : 0,
                            width: isAgency ? 440 : isPortrait ? 480 : 560,
                            display: 'flex',
                            background: isAgency ? 'rgba(255,255,255,0.96)' : 'transparent',
                            borderRadius: isAgency ? 12 : 0,
                            padding: isAgency ? 48 : 0,
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imagemEmbutida}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: isAgency ? 'contain' : 'cover',
                                objectPosition: isPortrait ? 'center top' : 'center center',
                            }}
                        />
                        {/* Gradiente sobre a imagem para fundir com o fundo */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(90deg, ${BG} 0%, transparent 40%)`,
                                display: 'flex',
                            }}
                        />
                    </div>
                )}

                {/* Conteúdo principal */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '60px 64px',
                        width: hasImage ? '64%' : '100%',
                        height: '100%',
                    }}
                >
                    {/* Barra de acento */}
                    <div style={{ width: 48, height: 4, background: ACCENT, borderRadius: 2, marginBottom: 24, display: 'flex' }} />

                    {/* Título */}
                    <div
                        style={{
                            fontSize: title.length > 40 ? 44 : title.length > 25 ? 54 : 64,
                            fontWeight: 900,
                            color: '#ffffff',
                            lineHeight: 1.1,
                            letterSpacing: '-1px',
                            marginBottom: subtitle ? 20 : 0,
                            display: 'flex',
                            flexWrap: 'wrap',
                        }}
                    >
                        {title}
                    </div>

                    {/* Subtítulo */}
                    {subtitle && (
                        <div
                            style={{
                                fontSize: 26,
                                color: 'rgba(255,255,255,0.6)',
                                lineHeight: 1.4,
                                display: 'flex',
                                flexWrap: 'wrap',
                            }}
                        >
                            {subtitle}
                        </div>
                    )}

                    {/* Rodapé com marca */}
                    <div
                        style={{
                            marginTop: 40,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                        }}
                    >
                        <div style={{ width: 3, height: 20, background: ACCENT, borderRadius: 2, display: 'flex' }} />
                        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, display: 'flex' }}>
                            {SITE_DOMAIN}
                        </div>
                    </div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 },
    )
}
