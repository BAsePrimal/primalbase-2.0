import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrimalBase",
  description: "Sua jornada ancestral começa aqui.",
  manifest: "/manifest.json",
  icons: {
    icon: 'https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/905744e0-151e-4a59-971e-0ad2b245c700.png',
    shortcut: 'https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/905744e0-151e-4a59-971e-0ad2b245c700.png',
    apple: 'https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/905744e0-151e-4a59-971e-0ad2b245c700.png',
  },
  appleWebApp: {
    title: 'PrimalBase',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <NavbarWrapper />
      </body>
    </html>
  );
}
