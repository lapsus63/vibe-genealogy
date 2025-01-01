import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPersons, fetchTreeRoot } from "@/lib/genealogy/api";
import { computeKinship } from "@/lib/genealogy/kinship";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Users, ArrowRight, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KinshipPage() {
  const { data: persons = [] } = useQuery({ queryKey: ["all-persons"], queryFn: fetchAllPersons });
  const { data: graph } = useQuery({ queryKey: ["tree-root"], queryFn: fetchTreeRoot });
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");

  const sortedPersons = useMemo(
    () =>
      [...persons].sort((x, y) => {
        const c = x.lastName.localeCompare(y.lastName, "fr");
        return c !== 0 ? c : x.firstName.localeCompare(y.firstName, "fr");
      }),
    [persons],
  );

  const result = useMemo(() => {
    if (!graph || !a || !b) return null;
    return computeKinship(graph, a, b);
  }, [graph, a, b]);

  const personLabel = (id: string) => {
    const p = persons.find((x) => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : id;
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" /> Lien de parenté
        </h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez deux personnes pour calculer leur relation (ancêtre commun le plus récent).
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <PersonPicker label="Personne A" value={a} onChange={setA} persons={sortedPersons} />
          <PersonPicker label="Personne B" value={b} onChange={setB} persons={sortedPersons} />
        </div>
      </Card>

      {result && (
        <Card className="p-5 space-y-3">
          <div className="text-sm text-muted-foreground">Résultat</div>
          <div className="text-2xl font-bold">{result.label}</div>
          {result.mrcaId && (
            <div className="text-sm">
              Ancêtre commun :{" "}
              <Link
                to={`/persons/${result.mrcaId}`}
                className="font-semibold text-primary underline underline-offset-2"
              >
                {personLabel(result.mrcaId)}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                (à {result.depthA} génération{result.depthA > 1 ? "s" : ""} de A, {result.depthB} de
                B)
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <span>{personLabel(a)}</span>
            <ArrowRight className="h-3 w-3" />
            <span>{personLabel(result.mrcaId ?? "")}</span>
            <ArrowRight className="h-3 w-3 rotate-180" />
            <span>{personLabel(b)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}

function PersonPicker({
  label,
  value,
  onChange,
  persons,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  persons: { id: string; firstName: string; lastName: string; birth?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = persons.find((p) => p.id === value);
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium">{label}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected ? `${selected.lastName} ${selected.firstName}` : "Choisir…"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command
            filter={(itemValue, search) =>
              itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder="Rechercher un nom…" />
            <CommandList>
              <CommandEmpty>Aucune personne trouvée.</CommandEmpty>
              <CommandGroup>
                {persons.map((p) => {
                  const val = `${p.lastName} ${p.firstName} ${p.birth ?? ""}`;
                  return (
                    <CommandItem
                      key={p.id}
                      value={val}
                      onSelect={() => {
                        onChange(p.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === p.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="font-medium">{p.lastName}</span>
                      <span className="ml-1">{p.firstName}</span>
                      {p.birth && (
                        <span className="ml-2 text-xs text-muted-foreground">({p.birth})</span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
