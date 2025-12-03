import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { GIcon } from "@/components/ui/gicon";
import { useUser } from "@/contexts/UserContext";

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleLogout = () => {
    navigate("/auth");
    localStorage.removeItem("access_token");
    localStorage.removeItem("unique_id");
    localStorage.removeItem("user_role");
    setUser(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Welcome to the Admin Panel
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Use the sidebar navigation to open any module. This landing screen was intentionally left empty so you can plug in your own widgets later.
        </p>

        <div className="flex items-center justify-center">
          <Button variant="secondary" className="gap-2" onClick={handleLogout}>
            <GIcon name="logout" className="text-base" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
