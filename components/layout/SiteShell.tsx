import { storageKey, legacyStorageKey } from '@/lib/constants/identidade.mjs'
import { htmlLang } from '@/lib/i18n/format'
import type { Locale } from '@/lib/i18n/config'
import { NextIntlClientProvider } from 'next-intl'
import { loadMessages } from '@/lib/i18n/messages'
import { DEFAULT_LOCALE } from '@/lib/i18n/config'
import { localizedFooterColumns, localizedNavigation } from '@/lib/i18n/navigation'
import { Outfit, Inter, Sora, Playfair_Display } from 'next/font/google'
import '@/styles/globals.css'
import { SITE_URL, SITE_NAME, UMAMI } from '@/lib/constants/site'
import NavBar from '@/components/NavBar'
import Footer from '@/components/ui/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { CookieBanner } from '@/components/features/CookieBanner'
import { RastreioDeRecirculacao } from '@/components/analytics/RastreioDeRecirculacao'
import { SinalDeHumano } from '@/components/analytics/SinalDeHumano'
import { AdSenseLoader } from '@/components/ui/AdSenseLoader'
import { AdStickyBottom } from '@/components/ui/AdStickyBottom'
import { ADSENSE } from '@/lib/config/ads'
import { AdsProvider } from '@/components/providers/AdsProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { WpAdminBar } from '@/components/ui/WpAdminBar'
import { WpEditProvider } from '@/components/ui/WpEditContext'
import { getMonetizationSettings } from '@/lib/wordpress/monetization'
import { getSiteSettings } from '@/lib/wordpress/site-settings'
import { UmamiScript } from '@/components/analytics/UmamiScript'
import { GoogleTagScript } from '@/components/analytics/GoogleTagScript'
import { RastreioDeExperiencia } from '@/components/analytics/RastreioDeExperiencia'

// Acima da dobra só aparecem Inter (corpo) e Playfair (título do hero). Outfit e
// Sora são usadas mais abaixo, então saem do preload: em rede móvel simulada as
// quatro famílias somavam 140 KB disputando banda com a imagem do LCP no mesmo
// instante. Com display:swap o texto já aparece na fonte de sistema e troca
// quando a família chega.
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap', preload: false })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const sora = Sora({
    subsets: ['latin'],
    variable: '--font-sora',
    display: 'swap',
    preload: false,
    weight: ['400', '600', '700'],
})
const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
    weight: ['400', '500', '700', '900'],
})

/**
 * Casco comum a todos os idiomas: <html>, head, providers, navegação, rodapé,
 * consentimento, analytics e anúncios. Cada grupo de rotas (`(site)` em
 * português, `(intl)/[locale]`) tem o próprio root layout e só repassa o
 * idioma — ver D2 em docs/I18N-ARQUITETURA.md.
 */
export async function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
    const [monetization, siteSettings, messages] = await Promise.all([
        getMonetizationSettings(),
        getSiteSettings(),
        loadMessages(locale),
    ])
    const fontVars = [outfit.variable, inter.variable, sora.variable, playfair.variable].join(' ')
    // O menu do WordPress é só português e aponta para rotas sem versão
    // traduzida. Fora do português, menu e rodapé listam apenas o que existe
    // no idioma — ver lib/i18n/navigation.ts.
    const navLabels = {
        productions: messages.entity.breadcrumb.productions,
        artists: messages.entity.breadcrumb.artists,
        groups: messages.entity.breadcrumb.groups,
    }
    const navigation = locale === DEFAULT_LOCALE ? siteSettings.navigation : localizedNavigation(locale, navLabels)
    // Assinatura, subtítulos do logo e rodapé legal vinham do WordPress, sempre
    // em português — apareciam inteiros nas páginas /en (visto em 2026-09-16).
    const layout = messages.entity.layout
    const isDefaultLocale = locale === DEFAULT_LOCALE
    const tagline = isDefaultLocale ? siteSettings.tagline : layout.tagline
    const logoSubtitles = isDefaultLocale ? siteSettings.logoSubtitles : layout.logoSubtitles
    const footerLabels = {
        rights: layout.rights,
        privacy: layout.privacy,
        terms: layout.terms,
        madeWith: layout.madeWith,
        home: layout.home.replace('{site}', SITE_NAME),
        nav: layout.footerNav,
        // Só no português: a lista aponta para fichas em PT.
        mostSearched: isDefaultLocale ? 'Mais buscados' : undefined,
        homeHref: isDefaultLocale ? '/' : `/${locale}`,
    }
    const footerColumns = locale === DEFAULT_LOCALE
        ? siteSettings.footerColumns
        : localizedFooterColumns(locale, messages.entity.footer.catalog, navLabels)

    return (
        <html lang={htmlLang(locale)} suppressHydrationWarning>
            {/* eslint-disable-next-line @next/next/no-head-element -- root layout do App Router; a regra mira pages/ e não reconhece layout fora de app/ */}
            <head>
                {/*
                  * Script de tema inline — roda ANTES da hidratação React.
                  * Evita o flash de tema errado (FOIT) sem bloquear LCP.
                  */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var k='${storageKey('theme')}',l='${legacyStorageKey('theme')}',t=localStorage.getItem(k)||localStorage.getItem(l)||'dark';localStorage.setItem(k,t);localStorage.removeItem(l);document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
                    }}
                />

                {/*
                  * Consent Mode v2 — precisa rodar ANTES de qualquer script do
                  * Google (gtag e adsbygoogle), por isso é inline aqui no head.
                  * Tudo começa negado: GA4 e AdSense carregam, mas sem cookie
                  * nem dado pessoal enquanto o usuário não decidir — anúncios
                  * seguem servindo, só que não personalizados. A decisão salva
                  * é reaplicada na mesma tacada, para quem já respondeu não ver
                  * o site regredir a não-personalizado a cada visita.
                  * No EEE/Reino Unido o CMP certificado do Google sobrepõe
                  * estes defaults via TCF; ver lib/consent.ts.
                  */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments)}window.gtag=window.gtag||g;g('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});g('set','ads_data_redaction',true);g('set','url_passthrough',true);try{var c=JSON.parse(localStorage.getItem('hh-consent-v1')||'null');if(c&&(c.decision==='granted'||c.decision==='denied')){g('consent','update',{ad_storage:c.decision,ad_user_data:c.decision,ad_personalization:c.decision,analytics_storage:c.decision})}}catch(e){}})()`,
                    }}
                />

                {/*
                  * Preconnect aos domínios do AdSense — a 1ª requisição de
                  * anúncio pagava DNS+TCP+TLS de cada um destes na hora; com
                  * o handshake feito em paralelo ao carregamento da página, o
                  * primeiro anúncio pinta ~300-800ms mais cedo (mobile 4G é
                  * onde mais aparece). Só quando ads estão habilitados.
                  */}
                {monetization.enabled && (
                    <>
                        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
                        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="anonymous" />
                        <link rel="preconnect" href="https://tpc.googlesyndication.com" crossOrigin="anonymous" />
                        <link rel="dns-prefetch" href="https://ep1.adtrafficquality.google" />
                    </>
                )}
            </head>
            <body className={`${fontVars} font-sans antialiased bg-background text-foreground`}>
              {/* Só o namespace `client` vai ao navegador: o resto é traduzido no servidor. */}
              <NextIntlClientProvider locale={locale} messages={{ client: messages.client }} timeZone="America/Sao_Paulo">
              <SessionProvider>
                <WpEditProvider>
                <WpAdminBar />
              <AdsProvider settings={monetization}>
                {/* Schema.org WebSite — sinaliza ao Google a estrutura do site */}
                <JsonLd
                    data={{
                        '@context': 'https://schema.org',
                        '@type': 'WebSite',
                        name: SITE_NAME,
                        url: SITE_URL,
                        inLanguage: htmlLang(locale),
                        potentialAction: {
                            '@type': 'SearchAction',
                            target: {
                                '@type': 'EntryPoint',
                                urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                            },
                            'query-input': 'required name=search_term_string',
                        },
                    }}
                />

                {/*
                  * site-canvas: wrapper que contém overflow horizontal sem afetar
                  * elementos position:fixed (NavBar, AdSense vignette) — eles escapam
                  * naturalmente do overflow de um <div> e continuam ancorados ao viewport.
                  * NÃO usar transform/filter aqui pois isso criaria containing block para fixed.
                  */}
                <div className="overflow-x-clip">
                    {/* Cabeçalho — nav + ticker */}
                    <header>
                        <NavBar
                            navLinks={navigation}
                            logoSubtitles={logoSubtitles}
                        />
                    </header>

                    {/* Conteúdo principal — tag <main> essencial para acessibilidade e AdSense crawl */}
                    <main id="main-content" tabIndex={-1}>
                        {children}
                    </main>

                    {/* Rodapé */}
                    <footer>
                        <Footer columns={footerColumns} tagline={tagline} labels={footerLabels} mostSearched={isDefaultLocale ? siteSettings.maisBuscados : []} />
                    </footer>
                </div>

                {/* LGPD / GDPR — ver lib/consent.ts */}
                <CookieBanner />
                <RastreioDeRecirculacao />
            <SinalDeHumano />
                <RastreioDeExperiencia />

                {/*
                  * Umami — analytics proprio, sem cookies e sem dados pessoais.
                  *
                  * Fora do banner de consentimento de proposito: diferente do
                  * Google, o Umami nao grava cookie nem identifica visitante, e
                  * `data-do-not-track` faz o script se calar sozinho para quem
                  * sinaliza DNT no navegador.
                  *
                  * lazyOnload pelo mesmo motivo do GA: analytics nao disputa a
                  * hidratacao. O script tem ~2KB e dispara apos o load, entao a
                  * contagem de pageview continua correta.
                  *
                  * Nao carrega em /entrar e /cadastro — 45% dos pageviews eram
                  * robo nessas duas telas. Ver o componente.
                  */}
                {UMAMI.src && UMAMI.websiteId && (
                    <UmamiScript
                        src={UMAMI.src}
                        websiteId={UMAMI.websiteId}
                        hostUrl={UMAMI.hostUrl}
                        domains={UMAMI.domains}
                    />
                )}

                {/* Google Tag — ID gerenciado pelo Site Kit no WordPress */}
                {/* Carrega só para quem o GA consegue medir — 174 KB que iam
                    para todo visitante, com ~95% sem consentimento. Ver o
                    componente. */}
                {siteSettings.googleTag && <GoogleTagScript id={siteSettings.googleTag} />}

                {/*
                  * AdSense — carregado após interação do usuário (afterInteractive).
                  * Estratégia: Auto Ads ativo no painel AdSense + slots manuais estratégicos.
                  * Não usamos Auto Ads via código aqui pois o painel controla melhor.
                  */}
                <AdSenseLoader />

                {/* Ad sticky mobile — aparece após load + 2,5s, com botão fechar */}
                {ADSENSE.slots.sticky && <AdStickyBottom slot={ADSENSE.slots.sticky} />}

              </AdsProvider>
                </WpEditProvider>
              </SessionProvider>
              </NextIntlClientProvider>
            </body>
        </html>
    )
}
