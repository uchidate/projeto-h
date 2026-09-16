import { SITE_NAME } from '@/lib/constants/site'

const SITE_NAME_PATTERN = new RegExp(`(?:^|[\\s|—–-])${SITE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s|—–-])`, 'i')

export function titleAlreadyIncludesSiteName(title: string) {
    return SITE_NAME_PATTERN.test(title)
}
