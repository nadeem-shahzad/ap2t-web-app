import AnimatingLoader from '@/components/landing/animating-loader';
import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Suspense } from 'react';
import Script from 'next/script';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AP2T',
  description: 'Advanced Physical & Technical Training',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <link rel="icon" href="/favicon.png" sizes="any" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* <script src="https://sandbox.web.squarecdn.com/v1/square.js" async /> */}
        <Suspense fallback={<AnimatingLoader />}>
          <NextTopLoader color="#d3fb20" showSpinner={false} />
          {children}
          <Script
            src="https://sandbox.web.squarecdn.com/v1/square.js"
            strategy="afterInteractive"
          />
        </Suspense>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
