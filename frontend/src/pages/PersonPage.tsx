import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPerson, fetchTreeRoot } from "@/lib/genealogy/api";
import { useTreeStore } from "@/lib/genealogy/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MigrationMap } from "@/components/tree/MigrationMap";
import type { PersonSummary } from "@/lib/genealogy/types";
import {
  ArrowLeft,
  Target,
  Calendar,
  MapPin,
  Briefcase,
  FileText,
  ExternalLink,
  Play,
} from "lucide-react";

type PersonTab = "bio" | "timeline" | "gallery" | "sources" | "map" | "family";
const TABS: PersonTab[] = ["bio", "timeline", "gallery", "sources", "map", "family"];

export default function PersonPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const setRoot = useTreeStore((s) => s.setRoot);

  const rawTab = searchParams.get("tab");
  const currentTab: PersonTab =
    rawTab && (TABS as string[]).includes(rawTab) ? (rawTab as PersonTab) : "bio";

  const { data, isLoading, error } = useQuery({
    queryKey: ["person", id],
    queryFn: () => fetchPerson(id),
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  if (error || !data) return <div className="p-6 text-sm text-destructive">Personne introuvable.</div>;

  const sortedMedia = [...data.media].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const citations = data.citations ?? [];
  const sources = data.sources ?? [];

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tree">
            <ArrowLeft className="h-4 w-4 mr-1" /> Arbre
          </Link>
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setRoot(id);
            navigate("/tree");
          }}
        >
          <Target className="h-4 w-4 mr-1" /> Centrer sur cette personne
        </Button>
      </div>

      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-24 w-24 shrink-0 rounded-full bg-muted grid place-items-center text-2xl font-semibold ring-2 ring-primary/40">
            {(data.firstName[0] ?? "") + (data.lastName[0] ?? "")}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold truncate">
              {data.firstName} <span className="font-black">{data.lastName}</span>
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {data.birth && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" /> Né(e) {data.birth} {data.birthPlace && `— ${data.birthPlace}`}
                </Badge>
              )}
              {data.death && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" /> Décédé(e) {data.death} {data.deathPlace && `— ${data.deathPlace}`}
                </Badge>
              )}
              {data.occupation && (
                <Badge variant="outline">
                  <Briefcase className="h-3 w-3 mr-1" /> {data.occupation}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        value={currentTab}
        onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
      >
        <TabsList className="flex w-full overflow-x-auto no-scrollbar sm:grid sm:grid-cols-6 h-auto gap-1 p-1">
          <TabsTrigger value="bio" className="shrink-0 px-2.5 py-1 text-xs sm:text-sm">Résumé</TabsTrigger>
          <TabsTrigger value="timeline" className="shrink-0 px-2.5 py-1 text-xs sm:text-sm">Timeline</TabsTrigger>
          <TabsTrigger value="gallery" className="shrink-0 px-2.5 py-1 text-xs sm:text-sm">Médias</TabsTrigger>
          <TabsTrigger value="sources" className="shrink-0 px-2.5 py-1 text-xs sm:text-sm">Sources</TabsTrigger>
          <TabsTrigger value="map" className="shrink-0 px-2.5 py-1 text-xs sm:text-sm">Migrations</TabsTrigger>
          <TabsTrigger value="family" className="shrink-0 px-2.5 py-1 text-xs sm:text-sm">Famille</TabsTrigger>
        </TabsList>

        <TabsContent value="bio" className="mt-3">
          <Card className="p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {data.biography ?? "Aucune biographie."}
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-3">
          <Card className="p-4">
            {data.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>
            ) : (
              <ol className="space-y-3">
                {[...data.events]
                  .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
                  .map((e) => (
                    <li key={e.id} className="flex gap-3 text-sm">
                      <div className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                        {e.date ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{e.type}</div>
                        {e.place && (
                          <div className="text-xs text-muted-foreground">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {e.place}
                          </div>
                        )}
                        {e.description && <div className="mt-1 text-xs">{e.description}</div>}
                        {e.citationIds && e.citationIds.length > 0 && (
                          <div className="mt-1 text-[11px] text-primary">
                            <FileText className="inline h-3 w-3 mr-1" />
                            {e.citationIds.length} citation(s)
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="mt-3">
          {sortedMedia.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground text-center">
              Aucun média pour l'instant.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedMedia.map((m) => (
                <Card key={m.id} className="overflow-hidden">
                  {m.kind === "photo" && (
                    <a href={m.url} target="_blank" rel="noreferrer" className="block aspect-video bg-muted">
                      <img src={m.url} alt={m.caption ?? ""} className="h-full w-full object-cover" />
                    </a>
                  )}
                  {m.kind === "video" && (
                    <video src={m.url} controls className="aspect-video w-full bg-black" />
                  )}
                  {m.kind === "audio" && (
                    <div className="flex items-center gap-3 p-4 bg-muted/40">
                      <Play className="h-5 w-5 text-primary" />
                      <audio src={m.url} controls className="w-full" />
                    </div>
                  )}
                  {m.kind === "document" && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid aspect-video place-items-center bg-muted text-sm hover:bg-muted/70"
                    >
                      <FileText className="h-8 w-8" />
                    </a>
                  )}
                  <div className="p-2 text-xs">
                    <div className="font-medium truncate">{m.caption ?? m.kind}</div>
                    {m.date && <div className="text-muted-foreground">{m.date}</div>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-3 space-y-3">
          {citations.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground text-center">
              Aucune source ni citation attachée.
            </Card>
          ) : (
            <>
              {citations.map((c) => {
                const src = sources.find((s) => s.id === c.sourceId);
                return (
                  <Card key={c.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{src?.title ?? "Source inconnue"}</div>
                        <div className="text-xs text-muted-foreground">
                          {[src?.author, src?.repository].filter(Boolean).join(" · ")}
                        </div>
                        {c.page && (
                          <div className="text-xs text-muted-foreground mt-0.5">Réf. {c.page}</div>
                        )}
                        {c.note && <div className="text-sm mt-2">{c.note}</div>}
                      </div>
                      {src?.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-primary"
                          title="Ouvrir la source en ligne"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {c.scanUrl && (
                      <a
                        href={c.scanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-md border bg-muted"
                      >
                        <img
                          src={c.scanUrl}
                          alt={`Scan — ${src?.title ?? ""}`}
                          className="h-40 w-full object-cover"
                        />
                      </a>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-3">
          <Card className="p-3">
            <div className="mb-2 text-xs text-muted-foreground">
              Lieux de vie et migrations, chronologiques.
            </div>
            <MigrationMap events={data.events} />
          </Card>
        </TabsContent>

        <TabsContent value="family" className="mt-3 space-y-3">
          <FamilyList title="Parents" ids={data.parents} />
          <FamilyList title="Conjoint(e)s" ids={data.spouses} />
          <FamilyList title="Enfants" ids={data.children} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FamilyList({ title, ids }: { title: string; ids: string[] }) {
  const { data: graph } = useQuery({ queryKey: ["tree-root"], queryFn: fetchTreeRoot });
  const byId = new Map<string, PersonSummary>((graph?.nodes ?? []).map((n) => [n.id, n]));
  return (
    <Card className="p-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">{title}</div>
      {ids.length === 0 ? (
        <div className="text-sm text-muted-foreground">Aucun</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ids.map((pid) => {
            const p = byId.get(pid);
            const name = p ? `${p.firstName} ${p.lastName}` : pid;
            const dates = p ? `${p.birth ?? "?"} – ${p.death ?? ""}`.trim() : "";
            const initials = p
              ? `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase()
              : "?";
            const ring =
              p?.sex === "M"
                ? "ring-blue-400/70"
                : p?.sex === "F"
                  ? "ring-pink-400/70"
                  : "ring-muted-foreground/60";
            return (
              <Link
                key={pid}
                to={`/persons/${pid}`}
                className="rounded-md border bg-muted/50 px-2 py-1.5 text-sm hover:bg-muted flex items-center gap-2 leading-tight"
              >
                <div
                  className={`h-9 w-9 shrink-0 rounded-full bg-muted grid place-items-center text-[10px] font-semibold ring-2 ${ring}`}
                  style={
                    p?.photoUrl
                      ? { backgroundImage: `url(${p.photoUrl})`, backgroundSize: "cover" }
                      : undefined
                  }
                >
                  {!p?.photoUrl && initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{name}</span>
                  {dates && (
                    <span className="text-[11px] text-muted-foreground">{dates}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
