import { getDictionary, getLocale } from '@/lib/get-dictionary';
import ClientLogin from './ClientLogin';
import { Locale } from '@/i18n/settings';

export default async function LoginPage() {
  const lang = await getLocale();
  const dict = await getDictionary();

  return <ClientLogin dict={dict} lang={lang} />;
}
