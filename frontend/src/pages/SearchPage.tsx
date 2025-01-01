import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchPersonsAdvanced } from "@/lib/genealogy/api";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const filters = {
    q: q.trim() || undefined,
    place: place.trim() || undefined,
    yearFrom: yearFrom ? parseInt(yearFrom, 10) : undefined,
    yearTo: yearTo ? parseInt(yearTo, 10) : undefined,
  };
  const active = !!(filters.q || filters.place || filters.yearFrom || filters.yearTo);

  const { data = [] } = useQuery({
    queryKey: ["search-adv", filters],
    queryFn: () => searchPersonsAdvanced(filters),
    enabled: active,
  });

  const reset = () => {
    setQ("");
    setPlace("");
    setYearFrom("");
    setYearTo("");
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Search className="h-5 w-5" /> Recherche avancée
        </h1>
        <p className="text-sm text-muted-foreground">
          Interroge nom, prénom, biographie, profession, lieux et descriptions d'événements.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium">Mot-clé</label>
          <Input
            placeholder="Nom, prénom, biographie, profession…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium">Lieu</label>
            <Input
              placeholder="ex. Lyon"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Année min.</label>
            <Input
              type="number"
              placeholder="1900"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Année max.</label>
            <Input
              type="number"
              placeholder="2000"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
            />
          </div>
        </div>
        {active && (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={reset}>
              <X className="h-3.5 w-3.5 mr-1" /> Réinitialiser
            </Button>
          </div>
        )}
      </Card>

      <div className="space-y-2">
        {active && (
          <div className="text-xs text-muted-foreground">
            {data.length} résultat{data.length > 1 ? "s" : ""}
          </div>
        )}
        {data.map((p) => (
          <Link key={p.id} to={`/persons/${p.id}`}>
            <Card className="p-3 hover:bg-muted/50 transition-colors">
              <div className="font-semibold">
                {p.firstName} {p.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.birth ?? "?"} – {p.death ?? ""} {p.birthPlace && `· ${p.birthPlace}`}
                {p.occupation && ` · ${p.occupation}`}
              </div>
              {p.biography && (
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {p.biography}
                </div>
              )}
            </Card>
          </Link>
        ))}
        {active && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun résultat.</p>
        )}
      </div>
    </div>
  );
}
