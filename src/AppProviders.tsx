import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { UserProvider } from "@/contexts/UserContext";

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ModuleProvider>
          <UserProvider>
            <TooltipProvider>
              <BrowserRouter>
                {children}
                <Toaster />
                <Sonner />
              </BrowserRouter>
            </TooltipProvider>
          </UserProvider>
        </ModuleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
