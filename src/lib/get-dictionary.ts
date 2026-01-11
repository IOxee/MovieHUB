import 'server-only';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
    if (locale in dictionaries) {
        return dictionaries[locale as keyof typeof dictionaries]();
    }
    return dictionaries.es();
};
