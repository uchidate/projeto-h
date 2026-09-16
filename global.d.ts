import type { Locale } from '@/lib/i18n/config'
import type { Messages } from '@/lib/i18n/messages'

// Tipagem do next-intl: idiomas e chaves de mensagem conhecidos em tempo de
// compilação. Ver lib/i18n/messages.ts.
declare module 'next-intl' {
    interface AppConfig {
        Locale: Locale
        Messages: Messages
    }
}
