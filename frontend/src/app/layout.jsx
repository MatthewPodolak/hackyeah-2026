import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import Auth from "@/views/auth/Auth";
import { AccountScope } from "@/api/context/AuthContext";
import { PREFS_BOOT_SCRIPT } from "@/lib/a11y-prefs";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Mapa problemów | Małopolska HUBMI",
    template: "%s | Małopolska HUBMI",
  },
  description: "Zgłaszaj problemy społeczne w Krakowie, odkrywaj innowacje społeczne i proponuj własne rozwiązania.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${jakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      </head>
      <body className="h-full">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[3000] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Przejdź do treści
        </a>
        <Providers>
          <SidebarProvider className="h-svh overflow-hidden">
              <AppSidebar />
              <main id="main-content" tabIndex={-1} className="relative flex flex-1 flex-col min-h-0 outline-none">
                <AccountScope>{children}</AccountScope>
                <SidebarTrigger data-tour="menu-trigger" className="absolute top-3 left-3 z-[1001] size-11 border border-border bg-card text-foreground shadow-elevation-2 hover:bg-muted [&_svg]:size-5" />
              </main>
              <Auth />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
