import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, ArrowRight, Shield, Users, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LoginMode = "admin" | "agent";
type AuthView = "login" | "signup";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, session, isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>("agent");
  const [view, setView] = useState<AuthView>("login");
  const [signupName, setSignupName] = useState("");
  const [signupSuffix, setSignupSuffix] = useState("");

  useEffect(() => {
    if (authLoading || !session || loading) return;
    navigate(isAdmin ? "/admin" : "/dashboard");
  }, [session, authLoading, isAdmin, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const selectedMode = mode;
    const { error, isAdmin: roleIsAdmin } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (roleIsAdmin === null) {
      toast.error("Impossible de vérifier le rôle du compte.");
      await signOut();
      setLoading(false);
      return;
    }

    if (selectedMode === "admin" && !roleIsAdmin) {
      toast.error("Ce compte n'est pas un compte administrateur.");
      await signOut();
      setLoading(false);
      return;
    }

    if (selectedMode === "agent" && roleIsAdmin) {
      toast.error("Ce compte est un compte administrateur. Utilisez le formulaire Admin.");
      await signOut();
      setLoading(false);
      return;
    }

    navigate(roleIsAdmin ? "/admin" : "/dashboard");
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupSuffix.trim()) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, signupName.trim(), signupSuffix.trim().toUpperCase());
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Compte créé ! Veuillez vérifier votre email puis attendre l'approbation de l'administrateur.");
      setView("login");
      setEmail("");
      setPassword("");
      setSignupName("");
      setSignupSuffix("");
    }
    setLoading(false);
  };

  const isAdminMode = mode === "admin";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div
            className={cn(
              "mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300",
              isAdminMode ? "bg-red-600" : "bg-emerald-600"
            )}
          >
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">ConfirmaPro</h1>
          <p className="text-muted-foreground text-sm">
            {view === "signup" ? "Créer un compte agent" : "Connectez-vous à votre espace"}
          </p>
        </div>

        {/* Role selector - only show on login view */}
        {view === "login" && <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer",
              isAdminMode
                ? "border-red-500 bg-red-500/10 text-red-600 shadow-sm"
                : "border-muted bg-card text-muted-foreground hover:border-red-300"
            )}
          >
            <Shield className={cn("h-6 w-6", isAdminMode ? "text-red-500" : "text-muted-foreground")} />
            <span className="text-sm font-semibold">Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("agent")}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer",
              !isAdminMode
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-sm"
                : "border-muted bg-card text-muted-foreground hover:border-emerald-300"
            )}
          >
            <Users className={cn("h-6 w-6", !isAdminMode ? "text-emerald-500" : "text-muted-foreground")} />
            <span className="text-sm font-semibold">Agent</span>
          </button>
        </div>}

        <form onSubmit={view === "signup" ? handleSignup : handleSubmit} className="space-y-4">
          <div
            className={cn(
              "rounded-xl border-2 p-6 space-y-4 transition-colors duration-300",
              view === "signup"
                ? "border-emerald-500/30 bg-emerald-500/5"
                : isAdminMode
                ? "border-red-500/30 bg-red-500/5"
                : "border-emerald-500/30 bg-emerald-500/5"
            )}
          >
            {view === "signup" && (
              <>
                <div>
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Fatima Zahra"
                    required
                    className="mt-1.5 focus-visible:ring-emerald-500 border-emerald-200"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-suffix">Code suffixe (2-3 lettres)</Label>
                  <Input
                    id="signup-suffix"
                    type="text"
                    value={signupSuffix}
                    onChange={(e) => setSignupSuffix(e.target.value)}
                    placeholder="FZ"
                    required
                    maxLength={3}
                    className="mt-1.5 uppercase focus-visible:ring-emerald-500 border-emerald-200"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={view === "signup" ? "votre@email.com" : isAdminMode ? "admin@ecom.ma" : "agent@confirma.ma"}
                required
                className={cn(
                  "mt-1.5 transition-colors",
                  view === "signup"
                    ? "focus-visible:ring-emerald-500 border-emerald-200"
                    : isAdminMode
                    ? "focus-visible:ring-red-500 border-red-200"
                    : "focus-visible:ring-emerald-500 border-emerald-200"
                )}
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className={cn(
                  "mt-1.5 transition-colors",
                  view === "signup"
                    ? "focus-visible:ring-emerald-500 border-emerald-200"
                    : isAdminMode
                    ? "focus-visible:ring-red-500 border-red-200"
                    : "focus-visible:ring-emerald-500 border-emerald-200"
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full h-12 text-base font-semibold gap-2 transition-colors duration-300",
              view === "signup"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : isAdminMode
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
            disabled={loading}
          >
            {loading ? (
              "Chargement..."
            ) : (
              <>
                {view === "signup" ? (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Créer mon compte
                  </>
                ) : (
                  <>
                    {isAdminMode ? "Connexion Admin" : "Connexion Agent"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </>
            )}
          </Button>

          {/* Toggle between login and signup - only for agents */}
          {!isAdminMode && (
            <p className="text-center text-sm text-muted-foreground">
              {view === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setView("signup")}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
