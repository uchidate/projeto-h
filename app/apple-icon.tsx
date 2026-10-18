import { ImageResponse } from 'next/og'
import { IconeOg } from '@/lib/og/marca'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
    return new ImageResponse(<IconeOg lado={size.width} />, { ...size })
}
