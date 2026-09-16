import { SITE_DOMAIN } from '@/lib/constants/site'
import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants/site'

// `nodejs`, nao `edge`: o Edge Runtime esta deprecado no Next 16, que avisa a
// cada build. E, no caso desta pagina, o aviso vinha acompanhado de um custo
// concreto — "using edge runtime on a page currently disables static generation
// for that page". O `next/og` ja roda em nodejs, entao a troca devolve a
// pre-renderizacao e remove a deprecacao de uma vez.
export const runtime = 'nodejs'
export const alt = `${SITE_NAME} — K-Pop, K-Drama e Cultura Coreana`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a14 50%, #0a0a0a 100%)',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Decoração de fundo */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 600,
                        height: 600,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(233,30,140,0.15) 0%, transparent 70%)',
                    }}
                />

                {/* Logo / Nome */}
                <div
                    style={{
                        fontSize: 72,
                        fontWeight: 900,
                        color: '#ffffff',
                        letterSpacing: '-2px',
                        textAlign: 'center',
                        marginBottom: 16,
                        display: 'flex',
                    }}
                >
                    Onda{' '}
                    <span style={{ color: '#e91e8c', marginLeft: 16 }}>Coreana</span>
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: 28,
                        color: 'rgba(255,255,255,0.6)',
                        textAlign: 'center',
                        maxWidth: 700,
                        lineHeight: 1.4,
                        display: 'flex',
                    }}
                >
                    {SITE_DESCRIPTION}
                </div>

                {/* Separador */}
                <div
                    style={{
                        width: 80,
                        height: 3,
                        background: '#e91e8c',
                        borderRadius: 2,
                        marginTop: 32,
                        display: 'flex',
                    }}
                />

                {/* URL */}
                <div
                    style={{
                        marginTop: 24,
                        fontSize: 20,
                        color: 'rgba(255,255,255,0.4)',
                        letterSpacing: 2,
                        display: 'flex',
                    }}
                >
                    {SITE_DOMAIN}
                </div>
            </div>
        ),
        { ...size },
    )
}
