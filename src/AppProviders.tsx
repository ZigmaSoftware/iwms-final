import { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// If you already had these from your dashboard project, keep them.
// If not, remove them from here and from the JSX below.
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ModuleProvider } from "@/contexts/ModuleContext";

const queryClient = new QueryClient();

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ModuleProvider>
          <TooltipProvider>
            <BrowserRouter>
              {children}
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </TooltipProvider>
        </ModuleProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
