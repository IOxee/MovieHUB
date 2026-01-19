import { getDictionary, getLocale } from '@/lib/get-dictionary';
import ClientProfile from './ClientProfile';

export default async function Page() {
  const lang = await getLocale();
  const dict = await getDictionary();
  return <ClientProfile dict={dict} lang={lang} />;
}
