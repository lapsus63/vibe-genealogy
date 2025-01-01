import type { TreeGraph } from "./types";

export interface KinshipResult {
  label: string;
  mrcaId: string | null;
  depthA: number;
  depthB: number;
}

function parentsMap(graph: TreeGraph): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (e.type !== "PARENT_CHILD") continue;
    const arr = m.get(e.target) ?? [];
    arr.push(e.source);
    m.set(e.target, arr);
  }
  return m;
}

function ancestorsDepth(id: string, parents: Map<string, string[]>): Map<string, number> {
  const depth = new Map<string, number>([[id, 0]]);
  const stack: string[] = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    const d = depth.get(cur)!;
    for (const p of parents.get(cur) ?? []) {
      if (!depth.has(p) || depth.get(p)! > d + 1) {
        depth.set(p, d + 1);
        stack.push(p);
      }
    }
  }
  return depth;
}

function removed(base: string, gens: number): string {
  switch (gens) {
    case 1:
      return base === "Ancêtre" ? "Parent" : "Enfant";
    case 2:
      return base === "Ancêtre" ? "Grand-parent" : "Petit-enfant";
    case 3:
      return base === "Ancêtre" ? "Arrière-grand-parent" : "Arrière-petit-enfant";
    default:
      return `${base} (${gens} générations)`;
  }
}

function label(a: number, b: number): string {
  if (a === 0 && b === 0) return "Même personne";
  if (a === 0) return removed("Descendant", b);
  if (b === 0) return removed("Ancêtre", a);
  if (a === 1 && b === 1) return "Frère/sœur";
  if (a === 1) return b === 2 ? "Neveu/nièce" : `Petit-neveu/nièce (${b - 1}ᵉ degré)`;
  if (b === 1) return a === 2 ? "Oncle/tante" : `Grand-oncle/tante (${a - 1}ᵉ degré)`;
  const degree = Math.min(a, b) - 1;
  const off = Math.abs(a - b);
  const suffix = degree === 1 ? "ᵉʳ" : "ᵉ";
  const base = `Cousin(e) au ${degree}${suffix} degré`;
  return off === 0 ? base : `${base} (issu de germain × ${off})`;
}

export function computeKinship(graph: TreeGraph, a: string, b: string): KinshipResult {
  if (a === b) return { label: "Même personne", mrcaId: a, depthA: 0, depthB: 0 };
  const parents = parentsMap(graph);
  const A = ancestorsDepth(a, parents);
  const B = ancestorsDepth(b, parents);
  let best: { id: string; da: number; db: number } | null = null;
  for (const [id, da] of A) {
    const db = B.get(id);
    if (db == null) continue;
    if (!best || da + db < best.da + best.db) best = { id, da, db };
  }
  if (!best) return { label: "Aucun lien de sang trouvé", mrcaId: null, depthA: -1, depthB: -1 };
  return { label: label(best.da, best.db), mrcaId: best.id, depthA: best.da, depthB: best.db };
}
