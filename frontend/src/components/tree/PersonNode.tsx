import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, Heart, Info, Sparkles } from "lucide-react";
import type { PersonSummary } from "@/lib/genealogy/types";
import { cn } from "@/lib/utils";

interface Data {
  person: PersonSummary;
  isRoot: boolean;
  hasHiddenParents?: boolean;
  hasHiddenChildren?: boolean;
  hasHiddenSpouses?: boolean;
}

function PersonNodeInner({ data, selected }: NodeProps<Data>) {
  const { person, isRoot, hasHiddenParents, hasHiddenChildren, hasHiddenSpouses } = data;
  const navigate = useNavigate();
  const initials = `${person.firstName[0] ?? ""}${person.lastName[0] ?? ""}`.toUpperCase();
  const sexRing =
    person.sex === "M"
      ? "ring-blue-400/70"
      : person.sex === "F"
        ? "ring-pink-400/70"
        : "ring-muted-foreground/60";

  const hasHidden = hasHiddenParents || hasHiddenChildren || hasHiddenSpouses;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card px-2 py-2 shadow-sm transition-all",
        "min-w-[164px] max-w-[164px] cursor-pointer hover:shadow-md",
        isRoot && "ring-2 ring-primary shadow-lg scale-[1.03]",
        selected && !isRoot && "ring-2 ring-primary/80 shadow-md",
        hasHidden &&
          !isRoot &&
          "border-dashed border-primary/60 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]",
      )}
      title={
        hasHidden
          ? "Cliquer pour recentrer et déplier les proches masqués"
          : "Cliquer pour recentrer l'arbre sur cette personne"
      }
    >
      {/* Indicateurs de proches masqués */}
      {hasHiddenParents && (
        <div
          className="absolute -top-2 left-1/2 -translate-x-1/2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background animate-pulse"
          title="Ascendants masqués — cliquer pour recentrer"
        >
          <ChevronUp className="h-3 w-3" />
        </div>
      )}
      {hasHiddenChildren && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background animate-pulse"
          title="Descendants masqués — cliquer pour recentrer"
        >
          <ChevronDown className="h-3 w-3" />
        </div>
      )}
      {hasHiddenSpouses && (
        <div
          className="absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-white shadow ring-2 ring-background"
          title="Conjoint masqué"
        >
          <Heart className="h-3 w-3 fill-current" />
        </div>
      )}
      {hasHidden && !hasHiddenParents && !hasHiddenChildren && !hasHiddenSpouses && (
        <div className="absolute -top-2 -left-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background">
          <Sparkles className="h-3 w-3" />
        </div>
      )}

      {/* Handles pour toutes les directions (parent/enfant + conjoint) */}
      <Handle type="target" position={Position.Top} id="t" className="!bg-muted-foreground/40" />
      <Handle type="source" position={Position.Bottom} id="b" className="!bg-muted-foreground/40" />
      <Handle type="source" position={Position.Right} id="r" className="!bg-primary/60" />
      <Handle type="target" position={Position.Left} id="l" className="!bg-primary/60" />

      {/* Nom / Prénom pleine largeur */}
      <div className="truncate text-center text-[13px] font-semibold leading-tight px-5">
        {person.firstName} <span className="font-bold">{person.lastName}</span>
      </div>

      {/* Photo centrée */}
      <div className="flex justify-center my-1">
        <div
          className={cn(
            "h-14 w-14 shrink-0 rounded-full bg-muted grid place-items-center text-sm font-semibold ring-2 bg-center",
            sexRing,
          )}
          style={
            person.photoUrl
              ? { backgroundImage: `url(${person.photoUrl})`, backgroundSize: "cover" }
              : undefined
          }
        >
          {!person.photoUrl && initials}
        </div>
      </div>

      {/* Dates centrées */}
      <div className="text-center text-[11px] text-muted-foreground leading-tight">
        {person.birth ?? "?"} – {person.death ?? ""}
      </div>

      {/* Bouton fiche en haut à droite */}
      <button
        type="button"
        aria-label="Voir la fiche"
        className="absolute top-1 right-1 shrink-0 grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/persons/${person.id}`);
        }}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export const PersonNode = memo(PersonNodeInner);
