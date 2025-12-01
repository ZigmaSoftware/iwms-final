import { LogOut } from "lucide-react";
import { HorizontalNav } from "./HorizontalNav";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ZigmaLogo from "../images/logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("unique_id");
      localStorage.removeItem("name");

      navigate("/auth", { replace: true });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Unable to clear session data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 dark:bg-gray-900">

      {/* TOPBAR */}
      <header
        className="
          sticky top-0 z-20 
          border-b border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          shadow-sm
        "
      >
        <div className="flex h-16 items-center justify-between px-4">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img
              src={ZigmaLogo}
              alt="Zigma Logo"
              className="h-12 w-12 object-contain"
            />
            <h1 className="hidden md:block text-lg font-semibold text-gray-700 dark:text-gray-200">
              IWMS Dashboard
            </h1>
          </div>

          {/* NAVIGATION + ACTIONS */}
          <div className="flex items-center gap-4">

            {/* NAVIGATION */}
            <HorizontalNav />

            {/* LOGOUT BUTTON */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="
                flex items-center gap-1 
                rounded-md 
                border-gray-300 dark:border-gray-600
                hover:bg-gray-100 dark:hover:bg-gray-800
                transition-all
              "
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>
    </div>
  );
}
