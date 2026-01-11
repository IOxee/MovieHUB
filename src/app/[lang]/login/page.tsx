import { getDictionary } from '@/lib/get-dictionary';
import ClientLogin from './ClientLogin';
import { Locale } from '@/i18n/settings';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <ClientLogin dict={dict} lang={lang} />;
}
