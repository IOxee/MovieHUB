import { getDictionary } from '@/lib/get-dictionary';
import ClientProfile from './ClientProfile';

export default async function Page({ params }: { params: Promise<{ lang: 'en' | 'es' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return <ClientProfile dict={dict} lang={lang} />;
}
