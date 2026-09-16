import { toRgba } from '@/lib/theme/color'

/**
 * Realce editorial e capitular da prosa de perfil, na cor de destaque da
 * entidade. Artista e grupo mantinham o mesmo CSS duplicado, divergindo só na
 * classe de escopo — qualquer ajuste tinha que ser feito nos dois lugares.
 */
export function ProfileProseStyles({ scope, accent }: { scope: string; accent: string }) {
    return (
        <style dangerouslySetInnerHTML={{ __html: `
                mark.oc-hl {
                    background: linear-gradient(transparent 60%, ${toRgba(accent, 0.32)} 60%);
                    color: inherit;
                    font-weight: 700;
                    padding: 0 1px;
                }
                strong.oc-name { color: ${accent}; font-weight: 800; }
                .${scope} .profile-prose > p:first-of-type {
                    font-size: 1.08rem;
                    line-height: 1.85;
                }
                .${scope} .profile-prose > p:first-of-type::first-letter {
                    float: left;
                    padding: 0.04em 0.12em 0 0;
                    font-size: 3.3em;
                    line-height: 0.82;
                    font-weight: 900;
                    color: ${accent};
                }
            ` }} />
    )
}
