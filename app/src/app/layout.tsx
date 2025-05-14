import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationsProvider } from '@/contexts/LocationsContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '42 Seating Map',
  description: 'A visual map of 42 campus seating',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LocationsProvider>
            {children}
          </LocationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
