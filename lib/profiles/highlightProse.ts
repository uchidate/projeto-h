/**
 * Realce tipográfico de prosa editorial: opera apenas em nós de texto
 * (nunca dentro de tags) e marca títulos entre aspas e o nome da entidade.
 * As classes .oc-hl / .oc-name recebem cor via <style> do perfil, na cor
 * oficial da entidade.
 */
export function highlightProse(html: string, name: string): string {
    if (!html) return html
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const nameRe = escapedName ? new RegExp(`(^|[\\s(>—–-])(${escapedName})(?=$|[\\s.,;:!?)<—–-])`, 'g') : null
    return html
        .split(/(<[^>]+>)/)
        .map(part => {
            if (!part || part.startsWith('<')) return part
            let text = part.replace(/[“"]([^“”"<>]{2,60})[”"]/g, '<mark class="oc-hl">“$1”</mark>')
            if (nameRe) text = text.replace(nameRe, '$1<strong class="oc-name">$2</strong>')
            return text
        })
        .join('')
}
