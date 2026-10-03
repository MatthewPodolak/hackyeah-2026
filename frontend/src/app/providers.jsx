"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import GlobalErrorCatcher from "@/helpers/GlobalErrorCatcher";
import { AuthProvider } from "@/api/context/AuthContext";
import { ProposalProvider } from "@/api/context/ProposalContext";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <GlobalErrorCatcher>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ProposalProvider>
                {children}
              </ProposalProvider>
              <Toaster position="bottom-right" richColors closeButton containerAriaLabel="Powiadomienia" />
            </AuthProvider>
          </QueryClientProvider>
        </GlobalErrorCatcher>
      </ThemeProvider>
  );
}