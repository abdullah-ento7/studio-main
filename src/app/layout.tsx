
import { Inter, Poppins, PT_Sans } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { DataProvider } from '@/context/data-context';
import { AuthProvider } from '@/context/auth-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ 
    subsets: ['latin'], 
    weight: ['400', '500', '600', '700'],
    variable: '--font-poppins' 
});
const ptSans = PT_Sans({ 
    subsets: ['latin'], 
    weight: ['400', '700'],
    variable: '--font-pt-sans'
});

export const metadata: Metadata = {
  title: 'Jugnoo Transport Network',
  description: 'Manage your transport business with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} ${ptSans.variable} font-body antialiased`}>
        <DataProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </DataProvider>
      </body>
    </html>
  );
}
