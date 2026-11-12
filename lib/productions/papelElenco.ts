import type { Locale } from '@/lib/i18n/config'

/**
 * Papel de elenco no idioma da página.
 *
 * O campo `role` vem do TMDB, em inglês ("Self", "Detective", "Self - Contestant"),
 * com algum "Elenco" em português; a maior parte (~30 mil valores distintos) é nome
 * de personagem, que não se traduz. Aqui só entram os papéis genéricos: o resto passa
 * como veio. Em inglês nada muda. Sem gênero no dado, as formas são neutras.
 */
type Formas = { pt: string; es: string; ja: string }

const GENERICOS: Record<string, Formas> = {
    'self': { pt: 'Ele(a) mesmo(a)', es: 'Él/ella mismo(a)', ja: '本人' },
    'himself': { pt: 'Ele mesmo', es: 'Él mismo', ja: '本人' },
    'herself': { pt: 'Ela mesma', es: 'Ella misma', ja: '本人' },
    'self - contestant': { pt: 'Participante', es: 'Concursante', ja: '参加者' },
    'contestant': { pt: 'Participante', es: 'Concursante', ja: '参加者' },
    'self - host': { pt: 'Apresentador(a)', es: 'Presentador(a)', ja: '司会' },
    'host': { pt: 'Apresentador(a)', es: 'Presentador(a)', ja: '司会' },
    'mc': { pt: 'Apresentador(a)', es: 'Presentador(a)', ja: '司会' },
    'self - mc': { pt: 'Apresentador(a)', es: 'Presentador(a)', ja: '司会' },
    'self - judge': { pt: 'Jurado', es: 'Jurado', ja: '審査員' },
    'self - panelist': { pt: 'Painelista', es: 'Panelista', ja: 'パネリスト' },
    'self - various characters': { pt: 'Ele(a) mesmo(a) (vários personagens)', es: 'Él/ella mismo(a) (varios personajes)', ja: '本人（さまざまな役）' },
    'self (archive footage)': { pt: 'Imagens de arquivo', es: 'Material de archivo', ja: 'アーカイブ映像' },
    '(uncredited)': { pt: 'Sem crédito', es: 'Sin acreditar', ja: 'クレジットなし' },
    'elenco': { pt: 'Elenco', es: 'Reparto', ja: '出演' },
    'detective': { pt: 'Detetive', es: 'Detective', ja: '刑事' },
    'police': { pt: 'Policial', es: 'Policía', ja: '警察官' },
    'police officer': { pt: 'Policial', es: 'Policía', ja: '警察官' },
    'policeman': { pt: 'Policial', es: 'Policía', ja: '警察官' },
    'student': { pt: 'Estudante', es: 'Estudiante', ja: '学生' },
    'doctor': { pt: 'Médico(a)', es: 'Médico(a)', ja: '医師' },
    'mother': { pt: 'Mãe', es: 'Madre', ja: '母' },
    'father': { pt: 'Pai', es: 'Padre', ja: '父' },
    'grandmother': { pt: 'Avó', es: 'Abuela', ja: '祖母' },
    'teacher': { pt: 'Professor(a)', es: 'Profesor(a)', ja: '教師' },
    'homeroom teacher': { pt: 'Professor(a) responsável', es: 'Profesor(a) jefe', ja: '担任教師' },
    'principal': { pt: 'Diretor(a) da escola', es: 'Director(a) de la escuela', ja: '校長' },
    'reporter': { pt: 'Repórter', es: 'Reportero(a)', ja: '記者' },
    'nurse': { pt: 'Enfermeiro(a)', es: 'Enfermero(a)', ja: '看護師' },
    'judge': { pt: 'Juiz(a)', es: 'Juez(a)', ja: '裁判官' },
    'prosecutor': { pt: 'Promotor(a)', es: 'Fiscal', ja: '検事' },
    'lawyer': { pt: 'Advogado(a)', es: 'Abogado(a)', ja: '弁護士' },
    'director': { pt: 'Diretor(a)', es: 'Director(a)', ja: '監督' },
    'manager': { pt: 'Gerente', es: 'Gerente', ja: 'マネージャー' },
    'agent': { pt: 'Agente', es: 'Agente', ja: 'エージェント' },
    'soldier': { pt: 'Soldado', es: 'Soldado', ja: '兵士' },
    'king': { pt: 'Rei', es: 'Rey', ja: '王' },
    'woman': { pt: 'Mulher', es: 'Mujer', ja: '女性' },
    'man': { pt: 'Homem', es: 'Hombre', ja: '男性' },
    'girl': { pt: 'Garota', es: 'Niña', ja: '少女' },
    'shaman': { pt: 'Xamã', es: 'Chamán', ja: 'シャーマン' },
    'special effects makeup artist': { pt: 'Maquiador(a) de efeitos especiais', es: 'Maquillador(a) de efectos especiales', ja: '特殊メイクアップアーティスト' },
}

/** "Detective Kim", "Mr. Park": título genérico + sobrenome, que fica como está. */
const COM_NOME: Record<string, (nome: string) => Formas> = {
    'detective': n => ({ pt: `Detetive ${n}`, es: `Detective ${n}`, ja: `${n}刑事` }),
    'manager': n => ({ pt: `Gerente ${n}`, es: `Gerente ${n}`, ja: `${n}マネージャー` }),
    'mr.': n => ({ pt: `Sr. ${n}`, es: `Sr. ${n}`, ja: `${n}氏` }),
}

const normalizar = (valor: string) => valor.trim().replace(/\s*[—–-]\s*/g, ' - ').replace(/\s+/g, ' ').toLowerCase()

export function papelNoIdioma(role: string, locale: Locale): string {
    if (locale === 'en') return normalizar(role) === 'elenco' ? 'Cast' : role
    const alvo = locale as 'pt' | 'es' | 'ja'
    const chave = normalizar(role)
    const exato = GENERICOS[chave]
    if (exato) return exato[alvo] ?? role
    const [titulo, nome, ...resto] = chave.split(' ')
    const forma = COM_NOME[titulo]
    if (forma && nome && resto.length === 0) {
        const original = role.trim().split(/\s+/)[1] ?? ''
        const out = forma(original)[alvo]
        return out ?? role
    }
    return role
}
