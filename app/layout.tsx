import type { Metadata, Viewport } from 'next'
import { Nunito, Fredoka } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
})

// Headings only — a rounded, characterful display face that makes ayyayo
// read as its own brand. Body stays Nunito (unchanged).
const fredoka = Fredoka({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'ayyayo',
  description: 'Boss the bot. You have the taste.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#fff6e6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${fredoka.variable} bg-cream`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
