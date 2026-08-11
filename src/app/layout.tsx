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

        {/* TIKTOK PIXEL - RASTREAMENTO */}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
              var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
              ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('D9T7AS3C77U97D5QIH00');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}