import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../lib/providers';
import Header from './components/header';
import Footer from './components/footer';

// eslint-disable-next-line new-cap
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Twilio TaskRouter Sample App',
  description: 'Twilio TaskRouter Sample App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <Providers>{children}</Providers>
        <Footer />
      </body>
    </html>
  );
}
