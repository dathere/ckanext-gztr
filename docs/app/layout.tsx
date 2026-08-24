import "@/app/global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import localFont from "next/font/local";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from 'next';

const inter = localFont({ src: "../lib/inter.ttf" });

export const metadata = {
  title: "ckanext-gztr",
  description: "ckanext-gztr is a CKAN extension that lets you associate geospatial features on an interactive map for datasets, perform spatial search, expose a STAC API, and more."
}

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </RootProvider>
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
