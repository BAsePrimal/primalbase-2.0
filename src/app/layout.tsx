import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import InstallModal from "@/components/InstallModal";
import AuthProvider from "@/components/AuthProvider";
import Script from "next/script";
import OneSignalInit from '@/components/OneSignalInit';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
        {/* O Motor do OneSignal liga primeiro, mas fica invisível */}
        <OneSignalInit />
        
        <AuthProvider>
          {children}
          <InstallModal />
          <NavbarWrapper />
        </AuthProvider>

        {/* MICROSOFT CLARITY - GRAVAÇÃO DE TELA (BIG BROTHER) */}
        <Script id="clarity-script" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vq4feug1ro");
          `}
        </Script>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}