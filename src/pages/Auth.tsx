import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { desktopApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUser } from "@/contexts/UserContext";
import {
  ADMIN_ROLE,
  DEFAULT_ROLE,
  USER_ROLE_STORAGE_KEY,
  normalizeRole,
  setAdminViewPreference,
  clearAdminViewPreference,
  ADMIN_VIEW_MODE_ADMIN,
  type UserRole,
} from "@/types/roles";
import ZigmaLogo from "../images/logo.png";
import BgImg from "../images/bgSignin.png"

const DUMMY_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQxMDI0NDQ4MDAsInN1YiI6IklXTVNfUk5EIn0.dHVubmVsLXNpZ25hdHVyZQ";

const RND_PROFILES: Record<UserRole, { name: string; email: string; uniqueId: string }> = {
  admin: {
    name: "Admin Preview",
    email: "admin-preview@rnd.local",
    uniqueId: "RND-ADMIN",
  },
  user: {
    name: "Dashboard Preview",
    email: "dashboard-preview@rnd.local",
    uniqueId: "RND-USER",
  },
};

export default function Auth() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { setUser } = useUser();

  const handleRndAccess = (targetRole: UserRole) => {
    const normalizedRole: UserRole = targetRole === ADMIN_ROLE ? ADMIN_ROLE : DEFAULT_ROLE;
    const profile = RND_PROFILES[normalizedRole] ?? RND_PROFILES[DEFAULT_ROLE];

    localStorage.setItem("access_token", DUMMY_ACCESS_TOKEN);
    localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizedRole);
    localStorage.setItem("unique_id", profile.uniqueId);
    setUser({
      name: profile.name,
      email: profile.email,
    });

    if (normalizedRole === ADMIN_ROLE) {
      setAdminViewPreference(ADMIN_VIEW_MODE_ADMIN);
    } else {
      clearAdminViewPreference();
    }

    navigate(normalizedRole === ADMIN_ROLE ? "/admin" : "/", { replace: true });
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log(username, password);
      const res = await desktopApi.post("login-user/", {
        username,
        password,
      });
      console.log(res);

      const { access_token, role, unique_id, name, username: apiUsername, email } = res.data;
      const normalizedRole = normalizeRole(role) ?? DEFAULT_ROLE;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem(USER_ROLE_STORAGE_KEY, normalizedRole);
      localStorage.setItem("unique_id", unique_id);
      setUser({
        name: name ?? apiUsername ?? username,
        email: email ?? "",
      });

      if (normalizedRole === ADMIN_ROLE) {
        navigate("/admin", { replace: true });
        setAdminViewPreference(ADMIN_VIEW_MODE_ADMIN);
      } else {
        navigate("/", { replace: true });
        clearAdminViewPreference();
      }
    } catch (error: any) {
      toast({
        title: t("login.title"),
        description:
          error?.response?.data?.detail || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f6f4] p-4 font-sans">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BgImg})` }}
      />

      {/* Shade Effect */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Content Container */}
      <div className="relative w-full max-w-5xl grid md:grid-cols-2 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">

        {/* LEFT */}
        <div className="flex flex-col items-center justify-center p-10 bg-[#e8f5e9] text-center border-r border-gray-200">
          <img src={ZigmaLogo} className="h-40 w-40 mb-4" />
          <h2 className="text-2xl font-bold text-[#2e7d32]">
            {t("login.left_title")}
          </h2>
          <p className="text-gray-700 text-sm mt-3 max-w-xs leading-relaxed">
            {t("login.left_text")}
          </p>
        </div>

        {/* RIGHT */}
        <div className="p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-800">
                {t("login.title")}
              </h1>
              <p className="text-[#43A047] mt-1 text-sm">
                {t("login.subtitle")}
              </p>
            </div>
            <LanguageSwitcher />
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-gray-700">
                {t("login.username")}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t("login.username_placeholder")}
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                className="h-12 rounded-lg bg-white border border-gray-300 
                  text-gray-800 placeholder-gray-500 
                  focus:ring-2 focus:ring-[#43A047] focus:border-[#43A047]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">
                {t("login.password")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("login.password_placeholder")}
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="h-12 rounded-lg bg-white border border-gray-300 
                  text-gray-800 placeholder-gray-500 
                  focus:ring-2 focus:ring-[#43A047] focus:border-[#43A047]"
                required
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                className="text-sm text-[#2e7d32] font-medium"
                onClick={() =>
                  toast({
                    title: t("login.forgot_password"),
                    description: "Password recovery is being implemented.",
                  })
                }
              >
                {t("login.forgot_password")}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-[#43A047] hover:bg-[#2e7d32]
                text-white text-base font-semibold shadow-md transition-all"
            >
              {loading ? t("login.authenticating") : t("login.sign_in")}
            </Button>

            <div className="pt-6 border-t border-dashed border-gray-200">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400 text-center">
                {t("login.rnd_shortcuts_label")}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-dashed border-[#43A047] text-[#2e7d32]"
                  onClick={() => handleRndAccess(DEFAULT_ROLE)}
                >
                  {t("login.rnd_dashboard")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11 border-dashed border-orange-500 text-orange-700"
                  onClick={() => handleRndAccess(ADMIN_ROLE)}
                >
                  {t("login.rnd_admin")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
