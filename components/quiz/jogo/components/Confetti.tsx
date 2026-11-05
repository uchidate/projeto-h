export function Confetti() {
    const colors = ['#ec4899','#a855f7','#f59e0b','#60a5fa','#34d399','#f472b6']
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
            {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', left: `${(i * 2.1) % 100}%`, top: '-12px',
                    width: i % 3 === 0 ? '9px' : '6px', height: i % 3 === 0 ? '9px' : '14px',
                    borderRadius: i % 4 === 0 ? '50%' : '2px', background: colors[i % colors.length],
                    opacity: 0, animation: `cffall ${1.8 + (i % 5) * 0.3}s ease-in forwards`,
                    animationDelay: `${(i % 6) * 0.1}s`, transform: `rotate(${i * 37}deg)`,
                }} />
            ))}
        </div>
    )
}
