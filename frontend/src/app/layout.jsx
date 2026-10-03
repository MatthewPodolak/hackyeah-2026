import Providers from "./providers";
import "./globals.css";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/app-sidebar"
import Auth from "@/views/auth/Auth";

export const metadata = {
  title: {
    default: "Mapa problemów | Małopolska HUBMI",
    template: "%s | Małopolska HUBMI",
  },
  description: "Zgłaszaj problemy społeczne w Krakowie, odkrywaj innowacje społeczne i proponuj własne rozwiązania.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`h-full antialiased`} suppressHydrationWarning>
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
                {children}
                <SidebarTrigger className="absolute top-2 left-2 z-[1001]" />
              </main>
              <Auth />
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
