"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import GlobalErrorCatcher from "@/helpers/GlobalErrorCatcher";
import { AuthProvider } from "@/api/context/AuthContext";

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <GlobalErrorCatcher>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </AuthProvider>
          </QueryClientProvider>
        </GlobalErrorCatcher>
      </ThemeProvider>
  );
}