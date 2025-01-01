import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/genealogy/auth-context";
import { isDemoMode } from "@/lib/genealogy/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { TreePine } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(isDemoMode() ? "demo" : "");
  const [password, setPassword] = useState(isDemoMode() ? "demo" : "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate("/tree");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center gap-2">
          <TreePine className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Arbre généalogique</h1>
        </div>
        {isDemoMode() && (
          <p className="text-xs text-muted-foreground rounded-md bg-muted p-2">
            Mode démo : le backend Spring Boot n'est pas configuré (VITE_API_BASE_URL).
            N'importe quel identifiant fonctionne — les données sont fictives.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="u">Identifiant</Label>
            <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="p">Mot de passe</Label>
            <Input
              id="p"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
