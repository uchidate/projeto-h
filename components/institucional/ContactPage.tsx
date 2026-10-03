import { getTranslations } from 'next-intl/server'
import { CONTACT_EMAIL } from '@/lib/constants/identidade.mjs'
import type { Locale } from '@/lib/i18n/config'

export async function ContactPage({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'institucional.contact' })
    return (
        <div className="page-wrap py-12 max-w-xl">
            <h1 className="text-[36px] font-black mb-2 text-foreground">{t('title')}</h1>
            <p className="text-[15px] text-muted mb-8">{t('intro')}</p>
            <form action={`mailto:${CONTACT_EMAIL}`} method="GET" className="space-y-4">
                <div>
                    <label className="block text-[13px] font-bold text-foreground mb-1.5" htmlFor="subject">
                        {t('subjectLabel')}
                    </label>
                    <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        placeholder={t('subjectPlaceholder')}
                        className="w-full h-10 px-3 border border-border bg-background text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-foreground mb-1.5" htmlFor="body">
                        {t('messageLabel')}
                    </label>
                    <textarea
                        id="body"
                        name="body"
                        required
                        rows={5}
                        placeholder={t('messagePlaceholder')}
                        className="w-full px-3 py-2.5 border border-border bg-background text-[14px] text-foreground placeholder:text-muted focus:border-accent focus:outline-hidden transition-colors resize-none"
                    />
                </div>
                <button
                    type="submit"
                    className="h-10 px-6 bg-foreground text-background text-[14px] font-bold hover:opacity-90 transition-opacity"
                >
                    {t('submit')}
                </button>
                <p className="text-[11px] text-muted">{t('note')}</p>
            </form>
        </div>
    )
}
