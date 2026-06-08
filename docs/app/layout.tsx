import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import localFont from "next/font/local";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";

const inter = localFont({ src: "../lib/inter.ttf" });

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Script
          src="https://mk-analytics.dathere.com/api/script.js"
          data-site-id="cdf10f7f35da"
          strategy="afterInteractive"
        />
        <Toaster closeButton richColors />
      </body>
    </html>
  );
}
