const TAXA = 8000
const LIMITE_S = 900

/** WAV mono de 8 bits em silêncio com a duração pedida: dá ao `<audio controls>` nativo uma linha do tempo para espelhar o player do Spotify. */
export function wavSilencioso(segundos: number): Blob {
    const n = Math.min(LIMITE_S, Math.max(1, Math.ceil(segundos))) * TAXA
    const buf = new ArrayBuffer(44 + n)
    const v = new DataView(buf)
    const txt = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
    txt(0, 'RIFF'); v.setUint32(4, 36 + n, true); txt(8, 'WAVE'); txt(12, 'fmt ')
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
    v.setUint32(24, TAXA, true); v.setUint32(28, TAXA, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true)
    txt(36, 'data'); v.setUint32(40, n, true)
    new Uint8Array(buf, 44).fill(128)
    return new Blob([buf], { type: 'audio/wav' })
}
