import { ImageResponse } from 'next/og'
import { IconeOg } from '@/lib/og/marca'

export const runtime = 'nodejs'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(<IconeOg lado={size.width} />, { ...size })
}
