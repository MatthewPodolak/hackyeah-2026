"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import GlobalErrorCatcher from "@/helpers/GlobalErrorCatcher";
import { AuthProvider } from "@/api/context/AuthContext";
import { ProposalProvider } from "@/api/context/ProposalContext";
import { LanguageProvider } from "@/components/language-provider";
import { t } from "@/lib/i18n";

export default function Providers({ locale, children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
       <LanguageProvider initialLocale={locale}>
        <GlobalErrorCatcher>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ProposalProvider>
                {children}
              </ProposalProvider>
              <Toaster position="bottom-right" richColors closeButton containerAriaLabel={t("Powiadomienia")} />
            </AuthProvider>
          </QueryClientProvider>
        </GlobalErrorCatcher>
       </LanguageProvider>
      </ThemeProvider>
  );
}