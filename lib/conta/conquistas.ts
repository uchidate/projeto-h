// Textos das conquistas por idioma. Os ids vêm de lib/userJourney.ts; o texto mora em
// messages/*/client.json (client.conta.conquistas.items). `t` é o tradutor do namespace `client.conta`.
import { traduzirChave } from '@/lib/i18n/chave-dinamica'

export function textosDaConquista(t: unknown, id: string): { label: string; desc: string; howTo: string; cta: string } {
    const base = `conquistas.items.${id}`
    return { label: traduzirChave(t, `${base}.label`), desc: traduzirChave(t, `${base}.desc`), howTo: traduzirChave(t, `${base}.howTo`), cta: traduzirChave(t, `${base}.cta`) }
}
