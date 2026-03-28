import { Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AgentLinkCardProps {
  suffixCode: string;
}

export function AgentLinkCard({ suffixCode }: AgentLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const basePath = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const link = `${window.location.origin}${basePath}form/${suffixCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border bg-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Link className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-card-foreground">Votre lien personnalisé</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Partagez ce lien avec vos clients pour collecter leurs confirmations.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-sm font-mono text-foreground truncate">
          {link}
        </code>
        <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
