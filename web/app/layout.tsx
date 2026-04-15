import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/i18n/client";
import { Footer } from "@/components/footer";
import { CookieConsent } from "@/components/cookie-consent";
import { getDictionary, getLocale } from "@/i18n/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.title,
    description: t.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getDictionary();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-app text-stone-900 dark:text-zinc-100">
        <ThemeProvider>
          <I18nProvider locale={locale} messages={messages}>
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
            <CookieConsent />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
