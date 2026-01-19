import 'server-only';
import { cookies } from 'next/headers';
import { i18n } from '@/i18n/settings';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
};

export const getLocale = async () => {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value;
    if (locale && i18n.locales.includes(locale as any)) {
        return locale as keyof typeof dictionaries;
    }
    return i18n.defaultLocale as keyof typeof dictionaries;
};

export const getDictionary = async () => {
    const locale = await getLocale();
    if (locale in dictionaries) {
        return dictionaries[locale]();
    }
    return dictionaries.es();
};
