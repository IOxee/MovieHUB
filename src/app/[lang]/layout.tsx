import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { i18n } from "@/i18n/settings";
import { getDictionary } from '@/lib/get-dictionary';
import TrafficWarning from '@/components/TrafficWarning';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Media Hub",
  description: "Your personalized movie and TV show hub",
  authors: [{ name: "IOxee", url: "https://ioxee.github.io/" }],
};

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <TrafficWarning message={dict.trafficWarning.message} closeText={dict.trafficWarning.close} />
        {children}
      </body>
    </html>
  );
}

