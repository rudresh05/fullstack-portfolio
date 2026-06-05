"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/components/providers/auth-provider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="bottom-right" richColors theme="dark" />
      </AuthProvider>
    </ThemeProvider>
  );
}
