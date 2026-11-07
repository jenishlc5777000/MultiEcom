import type { Metadata, Viewport } from "next";
import { PreviewIndicator } from "@/components/pwa/preview-indicator";
import { StudioInspector } from "@/components/pwa/studio-inspector";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { siteConfig } from "@/config/site";
import { themeCss } from "@/config/themes";
import { siteDesignCss, siteHtmlAttrs } from "@/lib/site-design-css";
import { isPreviewMode } from "@/services/preview.service";
import { getSiteConfig } from "@/services/site-config.service";
import { getActiveTheme } from "@/services/store.service";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "default" },
  icons: { apple: "/pwa-icon/180" },
  openGraph: { type: "website", siteName: siteConfig.name },
};

export async function generateViewport(): Promise<Viewport> {
  const theme = await getActiveTheme();
  return { themeColor: theme.themeColor, width: "device-width", initialScale: 1, viewportFit: "cover" };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Storefront theme chosen by the owner in Admin → Settings: colours, fonts,
  // shapes (data-theme) and product-card style (data-cards).
  const [theme, site, preview] = await Promise.all([getActiveTheme(), getSiteConfig(), isPreviewMode()]);
  return (
    <html lang="en-IN" data-theme={theme.id} data-cards={theme.layout.cards} data-effect={theme.effect} data-bg={theme.bg} data-em={theme.type.em} data-chrome={theme.chrome} {...siteHtmlAttrs(site)} className={fontVariables}>
      <head>
        {/* Theme tokens (colours, fonts, shapes). Built from the static theme list, not user input. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
        {/* Admin → Studio overrides (validated values only, see src/lib/site-design-css.ts). */}
        <style dangerouslySetInnerHTML={{ __html: siteDesignCss(site, theme) }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <ServiceWorkerRegister />
        {preview && <PreviewIndicator />}
        {preview && <StudioInspector />}
      </body>
    </html>
  );
}
