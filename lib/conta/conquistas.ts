// Textos das conquistas por idioma. Os ids vêm de lib/userJourney.ts; o texto mora em
// messages/*/client.json (client.conta.conquistas.items). `t` é o tradutor do namespace `client.conta`.
type Tradutor = { (chave: string): string }

export function textosDaConquista(t: unknown, id: string): { label: string; desc: string; howTo: string; cta: string } {
    const tr = t as Tradutor
    const base = `conquistas.items.${id}`
    return { label: tr(`${base}.label`), desc: tr(`${base}.desc`), howTo: tr(`${base}.howTo`), cta: tr(`${base}.cta`) }
}
