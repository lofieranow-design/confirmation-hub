import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Package } from "lucide-react";

export default function CustomerForm() {
  const { agentCode } = useParams<{ agentCode: string }>();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.city) return;

    setLoading(true);

    // Mock submission - will be replaced with Supabase
    await new Promise(r => setTimeout(r, 1000));
    console.log("Submitted:", { ...form, agentCode, nameWithSuffix: `${form.fullName} - /${agentCode}` });

    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Merci !</h2>
          <p className="text-muted-foreground max-w-sm">
            Votre confirmation a été enregistrée avec succès. Nous vous contacterons bientôt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Package className="h-6 w-6" />
          <h1 className="text-xl font-bold tracking-tight">ConfirmaPro</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm">Confirmez votre commande</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 animate-fade-in">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div>
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={e => handleChange("fullName", e.target.value)}
                placeholder="Votre nom complet"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => handleChange("phone", e.target.value)}
                placeholder="+212 6XX XX XX XX"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={form.address}
                onChange={e => handleChange("address", e.target.value)}
                placeholder="Votre adresse de livraison"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={e => handleChange("city", e.target.value)}
                placeholder="Votre ville"
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Envoi en cours..." : "Confirmer ma commande"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Vos informations sont sécurisées et ne seront utilisées que pour la livraison.
          </p>
        </form>
      </div>
    </div>
  );
}
