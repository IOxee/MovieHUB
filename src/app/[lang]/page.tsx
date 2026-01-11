import { getDictionary } from '@/lib/get-dictionary';
import ClientHome from './ClientHome';

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'es' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <ClientHome dict={dict} lang={lang} />;
}
