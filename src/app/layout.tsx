import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiveLang - Traduzione Simultanea Contestuale con AI',
  description: 'Comunica in tempo reale tra lingue diverse senza interruzioni, con rielaborazione intelligente del parlato basata su Gemini AI.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <div className="min-h-screen flex flex-col justify-between">
          {children}
        </div>
      </body>
    </html>
  );
}
