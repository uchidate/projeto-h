export function QuestionText({ text }: { text: string }) {
    // WP REST may return escaped quotes as \" — normalize first, then highlight "quoted" spans
    const normalized = text.replace(/\\"/g, '"')
    const parts = normalized.split(/("[^"]*")/)
    return (
        <>
            {parts.map((part, i) =>
                /^"[^"]*"$/.test(part)
                    ? <em key={i} className="not-italic text-accent">{part.slice(1, -1)}</em>
                    : <span key={i}>{part}</span>
            )}
        </>
    )
}
