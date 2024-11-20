import { routing } from '@/i18n/routing'
import '@/styles/globals.css'
import { Provider as JotaiProvider } from 'jotai'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'LLM Playground',
  description: '302AI\'s playground for LLM',
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()
  return (
    <html lang={locale}>
      <body className='min-h-screen antialiased'>
        <JotaiProvider>
          <NextIntlClientProvider messages={messages}>
            <Toaster />
            {children}
          </NextIntlClientProvider>
        </JotaiProvider>
      </body>
    </html>
  )
}
