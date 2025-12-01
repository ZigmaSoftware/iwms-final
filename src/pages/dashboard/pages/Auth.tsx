import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { desktopApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ZigmaLogo from "../images/logo.png";

export default function Auth() {
  const [username, setUsername] = useState("");     // ← changed from email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await desktopApi.post("login-user/", {
        username: username,
        password: password,
      });
      console.log("Login successful:", res.data);

      // Save token
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user_role", res.data.role);
      localStorage.setItem("unique_id", res.data.unique_id);

      const targetRoute = res.data.role === "admin" ? "/admin" : "/";
      navigate(targetRoute, { replace: true });
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f6f4] p-4">

      {/* MAIN WRAPPER */}
      <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">

        {/* LEFT SECTION */}
        <div className="flex flex-col items-center justify-center p-10 bg-[#e8f5e9] text-center border-r border-gray-200">
          <img src={ZigmaLogo} className="h-40 w-40 mb-4" />

          <h2 className="text-2xl font-bold text-[#2e7d32]">
            Transforming City Operations
          </h2>

          <p className="text-gray-700 text-sm mt-3 max-w-xs leading-relaxed">
            Experience a cleaner, faster workflow designed for modern field operations.
          </p>
        </div>

        {/* RIGHT SECTION */}
        <div className="p-10 flex flex-col justify-center">
          <h1 className="text-3xl font-semibold text-gray-800">
            Welcome Back
          </h1>

          <p className="text-[#43A047] mt-1 mb-8 text-sm">
            Sign in to access your workspace
          </p>

          <form onSubmit={handleSignIn} className="space-y-6">

            <div>
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="aakash"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="
                  h-12 rounded-lg bg-white border border-gray-300 
                  text-gray-800 placeholder-gray-500 
                  focus:ring-2 focus:ring-[#43A047] focus:border-[#43A047]
                "
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  h-12 rounded-lg bg-white border border-gray-300 
                  text-gray-800 placeholder-gray-500 
                  focus:ring-2 focus:ring-[#43A047] focus:border-[#43A047]
                "
                required
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-[#2e7d32] font-medium"
                onClick={() =>
                  toast({
                    title: "Coming Soon",
                    description: "Password recovery is being implemented.",
                  })
                }
              >
                Forgot Password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="
                w-full h-12 rounded-lg bg-[#43A047] hover:bg-[#2e7d32]
                text-white text-base font-semibold shadow-md transition-all
              "
            >
              {loading ? "Authenticating…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
