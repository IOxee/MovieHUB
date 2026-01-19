import { getDictionary, getLocale } from '@/lib/get-dictionary';
import ClientHome from './ClientHome';

export default async function Page() {
  const lang = await getLocale();
  const dict = await getDictionary();
  return <ClientHome dict={dict} lang={lang} />;
}
