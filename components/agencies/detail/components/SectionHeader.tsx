import { BlockHeader } from '@/components/blocks/BlockHeader'

export function SectionHeader({ label, title, count }: { label: string; title: string; count: number | null }) {
    return (
        <BlockHeader
            eyebrow={label}
            title={title}
            brandDot
            meta={count !== null ? <span className="font-mono text-[10px] tabular-nums text-muted">{count}</span> : undefined}
        />
    )
}
