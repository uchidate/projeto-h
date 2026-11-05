import { NextResponse } from 'next/server'
import { getWpToken } from '@/lib/auth/wpToken'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/config'
import { carregarSeguindo } from '@/lib/home/seguindo'

export const dynamic = 'force-dynamic'

/** Novidades de quem o visitante segue. Resposta própria da conta: nunca cacheada em CDN. */
export async function GET(request: Request) {
    const idioma = new URL(request.url).searchParams.get('lang')
    const locale: Locale = idioma && isLocale(idioma) ? idioma : DEFAULT_LOCALE
    const token = await getWpToken()
    if (!token) return NextResponse.json({ nomes: [], novidades: [] }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } })
    try {
        return NextResponse.json(await carregarSeguindo(token, locale), { headers: { 'Cache-Control': 'private, no-store' } })
    } catch (error) {
        console.error('[home-seguindo] falhou', error)
        return NextResponse.json({ nomes: [], novidades: [] }, { status: 502, headers: { 'Cache-Control': 'private, no-store' } })
    }
}
