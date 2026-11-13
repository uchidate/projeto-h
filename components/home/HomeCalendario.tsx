import { getTranslations } from 'next-intl/server'
import Link from '@/components/i18n/LocalizedLink'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { href } from '@/lib/i18n/routes'
import type { AniversariosHome } from '@/lib/home/aniversarios'
import { HomeCalendarioDias, type DiaCalendario } from '@/components/home/HomeCalendarioDias'

const MARROM = 'text-[#8a5a00]'
const ROTULO = 'font-mono text-[11px] font-bold uppercase tracking-[0.12em]'

function partes(data: string, locale: Locale) {
    const d = new Date(`${data}T12:00:00Z`)
    const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' }).format(d).replace('.', '')
    return { semana: fmt({ weekday: 'short' }), dia: fmt({ day: '2-digit' }), diaMes: fmt({ day: '2-digit', month: '2-digit' }) }
}

/** Faixa de sete dias, hoje, e os próximos aniversários (só nomes). O resto fica em /calendario. */
export async function HomeCalendario({ aniversarios, locale = DEFAULT_LOCALE }: { aniversarios: AniversariosHome; locale?: Locale }) {
    const { hoje, seguintes } = aniversarios
    if (hoje.length === 0 && seguintes.length === 0) return null
    const t = await getTranslations({ locale, namespace: 'home.calendario' })
    const dias: DiaCalendario[] = aniversarios.dias.map(d => {
        const p = partes(d.data, locale)
        return {
            data: d.data, semana: p.semana, dia: p.dia, diaMes: p.diaMes,
            itens: d.nomes.map(a => ({ nome: a.nome, hangul: a.hangul, foto: a.foto, idade: a.idade, href: href('artist', { slug: a.slug }, locale) })),
        }
    })
    return (
        <aside aria-label={t('rotulo')} className="px-4 py-4 sm:px-6 lg:px-4">
            <div className="flex items-center justify-between">
                <h2 className={`${ROTULO} ${MARROM}`}>{t('titulo')}</h2>
                {locale === DEFAULT_LOCALE && <Link href="/calendario" className={`${ROTULO} text-muted hover:text-accent`}>{t('abrir')}</Link>}
            </div>
            <HomeCalendarioDias
                dias={dias}
                rotulos={{
                    hoje: t('hoje'), aSeguir: t('aSeguir'), tag: t('tag'), anos: t('anos'),
                    semAniversario: t('semAniversario'), escolherDia: t('escolherDia'),
                    abrirHref: locale === DEFAULT_LOCALE ? '/calendario' : null, abrir: t('abrir'),
                }}
            />
        </aside>
    )
}
