import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Package, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cities, cityZones } from "@/lib/zones-data";

function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  id,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(s));
  }, [options, search]);

  return (
    <div ref={ref} className="relative">
      <Label htmlFor={id}>{label} *</Label>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 transition-all"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg shadow-primary/5 max-h-60 overflow-hidden">
          <div className="flex items-center border-b px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">Aucun résultat</p>
            ) : (
              filtered.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { onChange(option); setOpen(false); setSearch(""); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 hover:text-primary transition-colors ${
                    value === option ? "bg-primary/10 font-medium text-primary" : ""
                  }`}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerForm() {
  const { agentCode } = useParams<{ agentCode: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get("code");
  const resolvedCode = (agentCode || queryCode || "").toUpperCase() || undefined;
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentNotFound, setAgentNotFound] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    zone: "",
  });

  useEffect(() => {
    if (resolvedCode) {
      supabase.rpc("get_agent_by_suffix", { code: resolvedCode }).then(({ data }) => {
        if (data && data.length > 0) {
          setAgentId(data[0].id);
        } else {
          setAgentNotFound(true);
        }
      });
    }
  }, [resolvedCode]);

  const zoneOptions = useMemo(() => {
    if (!form.city) return [];
    return cityZones[form.city] || [];
  }, [form.city]);

  const handleCityChange = (city: string) => {
    setForm(prev => ({ ...prev, city, zone: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentId || !form.fullName || !form.phone || !form.city || !form.zone || !form.address) return;

    setLoading(true);
    const zoneValue = `${form.zone}/${form.city}`;
    const { error } = await supabase.from("customer_submissions").insert({
      customer_name: `${form.fullName} - ${resolvedCode}`,
      phone: form.phone,
      address: form.address,
      city: zoneValue,
      agent_id: agentId,
    });

    if (error) {
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
      console.error(error);
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (agentNotFound) {
    return (
      <div className="min-h-screen bg-background wave-bg flex items-center justify-center px-4">
        <div className="text-center space-y-4 glass-card rounded-3xl p-10 animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">Lien invalide</h2>
          <p className="text-muted-foreground">Ce lien de confirmation n'est pas valide.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background wave-bg flex items-center justify-center px-4">
        <div className="text-center space-y-5 animate-fade-in glass-card rounded-3xl p-10">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Merci !</h2>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            Votre confirmation a été enregistrée avec succès. Nous vous contacterons bientôt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background wave-bg flex flex-col">
      {/* Header with organic wave shape */}
      <div className="relative">
        <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground py-8 px-4 text-center rounded-b-[2rem]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Package className="h-7 w-7" />
            <h1 className="text-xl font-bold tracking-tight">ConfirmaPro</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">Confirmez votre commande</p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <Label htmlFor="fullName">Nom et prénom *</Label>
              <Input id="fullName" value={form.fullName} onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Votre nom et prénom" required className="mt-1.5 rounded-xl border-input/50 bg-background/50" />
            </div>
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+212 6XX XX XX XX" required className="mt-1.5 rounded-xl border-input/50 bg-background/50" />
            </div>
            <SearchableSelect
              id="city"
              label="Ville"
              placeholder="Choisir une ville..."
              options={cities}
              value={form.city}
              onChange={handleCityChange}
            />
            <SearchableSelect
              id="zone"
              label="Zone"
              placeholder={form.city ? "Choisir une zone..." : "Choisissez d'abord une ville"}
              options={zoneOptions}
              value={form.zone}
              onChange={v => setForm(prev => ({ ...prev, zone: v }))}
              disabled={!form.city}
            />
            <div>
              <Label htmlFor="address">Adresse complète *</Label>
              <Input id="address" value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Adresse complète du destinataire" required className="mt-1.5 rounded-xl border-input/50 bg-background/50" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-13 text-base font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.01]"
            disabled={loading || !agentId || !form.fullName || !form.phone || !form.city || !form.zone || !form.address}
          >
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
