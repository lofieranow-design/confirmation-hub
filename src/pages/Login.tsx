import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [suffixCode, setSuffixCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!authLoading && session) navigate("/dashboard");
  }, [session, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password, name, suffixCode.toUpperCase());
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">ConfirmaPro</h1>
          <p className="text-muted-foreground text-sm">
            {isSignUp ? "Créez votre compte agent" : "Connectez-vous à votre espace agent"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            {isSignUp && (
              <>
                <div>
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Fatima Zahra" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="suffix">Code suffixe (2-3 lettres)</Label>
                  <Input id="suffix" value={suffixCode} onChange={e => setSuffixCode(e.target.value)} placeholder="FZ" required maxLength={3} className="mt-1.5 uppercase" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="agent@confirma.ma" required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="mt-1.5" />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2" disabled={loading}>
            {loading ? "Chargement..." : (
              <>
                {isSignUp ? "Créer mon compte" : "Se connecter"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

        </form>
      </div>
    </div>
  );
}
