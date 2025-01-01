import type { PersonDetail, PersonSummary, TreeEdge, TreeGraph } from "./types";

// Small sample family used when the backend is unreachable.
// Deterministic IDs so URLs remain stable across reloads.
// Includes siblings, uncles/aunts and cousins on both sides.

const people: PersonSummary[] = [
  // Génération -2 (arrière-grands-parents côté paternel)
  { id: "I1", firstName: "Jean", lastName: "Dupont", sex: "M", birth: "1920", death: "1995" },
  { id: "I2", firstName: "Marie", lastName: "Martin", sex: "F", birth: "1922", death: "2001" },
  // Génération -2 (arrière-grands-parents côté maternel)
  { id: "I9", firstName: "Antoine", lastName: "Martin", sex: "M", birth: "1895", death: "1970" },
  { id: "I10", firstName: "Louise", lastName: "Roux", sex: "F", birth: "1898", death: "1978" },

  // Génération -1 (grands-parents et grands-oncles/tantes)
  { id: "I3", firstName: "Pierre", lastName: "Dupont", sex: "M", birth: "1945", death: "2020" },
  { id: "I4", firstName: "Sylvie", lastName: "Bernard", sex: "F", birth: "1948" },
  { id: "I20", firstName: "Claire", lastName: "Dupont", sex: "F", birth: "1947" }, // sœur de I3
  { id: "I21", firstName: "Marc", lastName: "Lefèvre", sex: "M", birth: "1944" }, // époux de I20

  // Génération 0 (parents et oncles/tantes)
  { id: "I5", firstName: "Luc", lastName: "Dupont", sex: "M", birth: "1972" },
  { id: "I6", firstName: "Emma", lastName: "Petit", sex: "F", birth: "1974" },
  { id: "I22", firstName: "Sophie", lastName: "Dupont", sex: "F", birth: "1975" }, // sœur de I5
  { id: "I23", firstName: "David", lastName: "Moreau", sex: "M", birth: "1973" }, // époux de I22
  { id: "I24", firstName: "Nicolas", lastName: "Lefèvre", sex: "M", birth: "1970" }, // cousin de I5 (fils de I20+I21)
  { id: "I25", firstName: "Julie", lastName: "Garnier", sex: "F", birth: "1972" }, // épouse de I24

  // Génération 1 (I5 + cousins de I7/I8)
  { id: "I7", firstName: "Léa", lastName: "Dupont", sex: "F", birth: "2001" },
  { id: "I8", firstName: "Hugo", lastName: "Dupont", sex: "M", birth: "2004" },
  { id: "I26", firstName: "Chloé", lastName: "Moreau", sex: "F", birth: "2003" }, // cousine germaine (fille de I22)
  { id: "I27", firstName: "Tom", lastName: "Moreau", sex: "M", birth: "2006" }, // cousin germain
  { id: "I28", firstName: "Manon", lastName: "Lefèvre", sex: "F", birth: "2000" }, // cousine issue de germain (fille de I24)
  { id: "I29", firstName: "Paul", lastName: "Lefèvre", sex: "M", birth: "2002" }, // cousin issu de germain
];

const edges: TreeEdge[] = [
  // Unions
  { id: "u1", type: "SPOUSE", source: "I1", target: "I2", unionId: "F1" },
  { id: "u2", type: "SPOUSE", source: "I3", target: "I4", unionId: "F2" },
  { id: "u3", type: "SPOUSE", source: "I5", target: "I6", unionId: "F3" },
  { id: "u4", type: "SPOUSE", source: "I9", target: "I10", unionId: "F4" },
  { id: "u5", type: "SPOUSE", source: "I20", target: "I21", unionId: "F5" }, // tante de I5
  { id: "u6", type: "SPOUSE", source: "I22", target: "I23", unionId: "F6" }, // sœur de I5
  { id: "u7", type: "SPOUSE", source: "I24", target: "I25", unionId: "F7" }, // cousin de I5

  // Filiations
  // I1+I2 -> I3, I20
  { id: "p1", type: "PARENT_CHILD", source: "I1", target: "I3" },
  { id: "p2", type: "PARENT_CHILD", source: "I2", target: "I3" },
  { id: "p1b", type: "PARENT_CHILD", source: "I1", target: "I20" },
  { id: "p2b", type: "PARENT_CHILD", source: "I2", target: "I20" },
  // I9+I10 -> I2
  { id: "p9", type: "PARENT_CHILD", source: "I9", target: "I2" },
  { id: "p10", type: "PARENT_CHILD", source: "I10", target: "I2" },
  // I3+I4 -> I5, I22
  { id: "p3", type: "PARENT_CHILD", source: "I3", target: "I5" },
  { id: "p4", type: "PARENT_CHILD", source: "I4", target: "I5" },
  { id: "p3b", type: "PARENT_CHILD", source: "I3", target: "I22" },
  { id: "p4b", type: "PARENT_CHILD", source: "I4", target: "I22" },
  // I20+I21 -> I24
  { id: "p20", type: "PARENT_CHILD", source: "I20", target: "I24" },
  { id: "p21", type: "PARENT_CHILD", source: "I21", target: "I24" },
  // I5+I6 -> I7, I8
  { id: "p5", type: "PARENT_CHILD", source: "I5", target: "I7" },
  { id: "p6", type: "PARENT_CHILD", source: "I6", target: "I7" },
  { id: "p7", type: "PARENT_CHILD", source: "I5", target: "I8" },
  { id: "p8", type: "PARENT_CHILD", source: "I6", target: "I8" },
  // I22+I23 -> I26, I27
  { id: "p22", type: "PARENT_CHILD", source: "I22", target: "I26" },
  { id: "p23", type: "PARENT_CHILD", source: "I23", target: "I26" },
  { id: "p24", type: "PARENT_CHILD", source: "I22", target: "I27" },
  { id: "p25", type: "PARENT_CHILD", source: "I23", target: "I27" },
  // I24+I25 -> I28, I29
  { id: "p26", type: "PARENT_CHILD", source: "I24", target: "I28" },
  { id: "p27", type: "PARENT_CHILD", source: "I25", target: "I28" },
  { id: "p28", type: "PARENT_CHILD", source: "I24", target: "I29" },
  { id: "p29", type: "PARENT_CHILD", source: "I25", target: "I29" },
];

export const mockGraph: TreeGraph = {
  rootId: "I5",
  nodes: people,
  edges,
};

function neighbors(id: string): { parents: string[]; children: string[]; spouses: string[] } {
  const parents = edges.filter((e) => e.type === "PARENT_CHILD" && e.target === id).map((e) => e.source);
  const children = edges.filter((e) => e.type === "PARENT_CHILD" && e.source === id).map((e) => e.target);
  const spouses = edges
    .filter((e) => e.type === "SPOUSE" && (e.source === id || e.target === id))
    .map((e) => (e.source === id ? e.target : e.source));
  return { parents, children, spouses };
}

const SOURCES = [
  { id: "src1", title: "Registre d'état civil de Lyon", author: "Mairie de Lyon", repository: "Archives départementales du Rhône", url: "https://archives.rhone.fr" },
  { id: "src2", title: "Recensement de 1946", author: "INSEE", repository: "Archives nationales" },
  { id: "src3", title: "Lettres de famille (1940-1945)", author: "Fonds privé Dupont", repository: "Collection personnelle" },
  { id: "src4", title: "Témoignage oral de Sylvie Bernard", author: "Enregistrement 2018" },
];

const CITATIONS_BY_PERSON: Record<string, { citations: import("./types").Citation[] }> = {
  I1: {
    citations: [
      { id: "c1", sourceId: "src1", page: "f°42", note: "Acte de naissance n°128 du 15 mars 1920", scanUrl: "https://picsum.photos/seed/scan-i1-birth/800/600" },
      { id: "c2", sourceId: "src3", note: "Lettre à sa femme datée du 12 juin 1943", scanUrl: "https://picsum.photos/seed/scan-i1-letter/800/600" },
    ],
  },
  I3: {
    citations: [
      { id: "c3", sourceId: "src1", page: "f°17", note: "Acte de naissance de Pierre", scanUrl: "https://picsum.photos/seed/scan-i3-birth/800/600" },
      { id: "c4", sourceId: "src2", note: "Recensé au 12 rue de la République, Lyon" },
    ],
  },
  I5: {
    citations: [
      { id: "c5", sourceId: "src4", note: "Sa mère raconte sa naissance à Villeurbanne", scanUrl: "https://picsum.photos/seed/scan-i5-audio/800/600" },
    ],
  },
};

const MEDIA_BY_PERSON: Record<string, import("./types").MediaAsset[]> = {
  I1: [
    { id: "m1", url: "https://picsum.photos/seed/i1a/600/600", kind: "photo", date: "1945-06-01", caption: "Portrait en uniforme" },
    { id: "m2", url: "https://picsum.photos/seed/i1b/600/600", kind: "photo", date: "1970-08-15", caption: "Vacances en Bretagne" },
    { id: "m3", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b0aecaa88.mp3", kind: "audio", date: "2018-01-01", caption: "Témoignage enregistré" },
  ],
  I3: [
    { id: "m4", url: "https://picsum.photos/seed/i3/600/600", kind: "photo", date: "1960-05-10", caption: "Communion" },
    { id: "m5", url: "https://www.w3schools.com/html/mov_bbb.mp4", kind: "video", date: "1995-12-24", caption: "Noël en famille" },
  ],
  I5: [
    { id: "m6", url: "https://picsum.photos/seed/i5/600/600", kind: "photo", date: "1985-09-01", caption: "Rentrée des classes" },
  ],
};

const MIGRATIONS_BY_PERSON: Record<string, import("./types").PersonEvent[]> = {
  I1: [
    { id: "mig-i1-a", type: "CUSTOM", date: "1920-03-15", place: "Lyon, France", geo: { lat: 45.7640, lng: 4.8357 }, description: "Naissance" },
    { id: "mig-i1-b", type: "CUSTOM", date: "1940-06-01", place: "Marseille, France", geo: { lat: 43.2965, lng: 5.3698 }, description: "Mobilisation" },
    { id: "mig-i1-c", type: "CUSTOM", date: "1948-04-10", place: "Paris, France", geo: { lat: 48.8566, lng: 2.3522 }, description: "Installation professionnelle" },
    { id: "mig-i1-d", type: "CUSTOM", date: "1995-11-22", place: "Nice, France", geo: { lat: 43.7102, lng: 7.2620 }, description: "Décès" },
  ],
  I3: [
    { id: "mig-i3-a", type: "CUSTOM", date: "1945-07-02", place: "Lyon, France", geo: { lat: 45.7640, lng: 4.8357 } },
    { id: "mig-i3-b", type: "CUSTOM", date: "1968-05-01", place: "Grenoble, France", geo: { lat: 45.1885, lng: 5.7245 }, description: "Études" },
    { id: "mig-i3-c", type: "CUSTOM", date: "1975-09-15", place: "Villeurbanne, France", geo: { lat: 45.7712, lng: 4.8902 } },
  ],
  I5: [
    { id: "mig-i5-a", type: "CUSTOM", date: "1972-04-01", place: "Villeurbanne, France", geo: { lat: 45.7712, lng: 4.8902 } },
    { id: "mig-i5-b", type: "CUSTOM", date: "1998-06-10", place: "Montréal, Canada", geo: { lat: 45.5017, lng: -73.5673 }, description: "Expatriation" },
    { id: "mig-i5-c", type: "CUSTOM", date: "2010-01-20", place: "Paris, France", geo: { lat: 48.8566, lng: 2.3522 }, description: "Retour en France" },
  ],
};

const BIOS: Record<string, string> = {
  I1: "Jean Dupont, ouvrier lyonnais mobilisé en 1940. Il tient une correspondance nourrie avec sa femme durant la guerre. Après-guerre, il s'installe à Paris où il travaille comme contremaître.",
  I3: "Pierre Dupont, ingénieur des Arts et Métiers, spécialiste des turbines hydrauliques. Marié à Sylvie Bernard en 1970, il élève ses enfants entre Grenoble et Villeurbanne.",
  I5: "Luc Dupont, développeur logiciel, expatrié au Canada de 1998 à 2010 avant de revenir à Paris. Passionné de généalogie, il est à l'origine de ce projet familial.",
};

export function mockPerson(id: string): PersonDetail | null {
  const p = people.find((x) => x.id === id);
  if (!p) return null;
  const { parents, children, spouses } = neighbors(id);
  const migrations = MIGRATIONS_BY_PERSON[id] ?? [];
  const citations = CITATIONS_BY_PERSON[id]?.citations ?? [];
  const sources = SOURCES.filter((s) => citations.some((c) => c.sourceId === s.id));
  const media = MEDIA_BY_PERSON[id] ?? [];
  const birthEvt = migrations.find((e) => e.description === "Naissance") ?? migrations[0];
  const deathEvt = migrations.find((e) => e.description === "Décès");
  return {
    ...p,
    birthPlace: birthEvt?.place,
    birthGeo: birthEvt?.geo,
    deathPlace: deathEvt?.place,
    deathGeo: deathEvt?.geo,
    occupation: id === "I3" ? "Ingénieur" : id === "I5" ? "Développeur" : "Instituteur",
    biography: BIOS[id] ?? "Aucune biographie détaillée disponible pour cette personne.",
    events: [
      p.birth ? { id: `e-${id}-b`, type: "BIRTH" as const, date: p.birth, place: birthEvt?.place, geo: birthEvt?.geo, citationIds: citations.slice(0, 1).map((c) => c.id) } : null,
      p.death ? { id: `e-${id}-d`, type: "DEATH" as const, date: p.death, place: deathEvt?.place, geo: deathEvt?.geo } : null,
      ...migrations.filter((m) => m.description && m.description !== "Naissance" && m.description !== "Décès"),
    ].filter(Boolean) as PersonDetail["events"],
    media,
    citations,
    sources,
    parents,
    spouses,
    children,
  };
}

export function mockExpand(
  rootId: string,
  asc: number,
  desc: number,
  mode: "PEDIGREE" | "DESCENDANTS" | "MIXED" = "MIXED",
): TreeGraph {
  const effAsc = mode === "DESCENDANTS" ? 0 : asc;
  const effDesc = mode === "PEDIGREE" ? 0 : desc;
  const keep = new Set<string>([rootId]);
  const ancestors = new Set<string>();
  const walkUp = (id: string, depth: number) => {
    if (depth <= 0) return;
    for (const p of neighbors(id).parents) {
      keep.add(p);
      ancestors.add(p);
      walkUp(p, depth - 1);
    }
  };
  const walkDown = (id: string, depth: number) => {
    if (depth <= 0) return;
    for (const c of neighbors(id).children) {
      keep.add(c);
      walkDown(c, depth - 1);
    }
  };
  walkUp(rootId, effAsc);
  walkDown(rootId, effDesc);

  // Siblings of root + cousins from ancestors: walk down from each ancestor
  // using the remaining descendant budget (distance from root).
  if (effDesc > 0) {
    // Root's siblings: from each parent, walkDown with effDesc levels.
    for (const p of neighbors(rootId).parents) {
      if (!keep.has(p)) continue;
      for (const c of neighbors(p).children) {
        if (c === rootId || keep.has(c)) continue;
        keep.add(c);
        walkDown(c, Math.max(0, effDesc - 1));
      }
    }
    // Higher ancestors: cousins-level branches, budget shrinks with distance.
    // distanceFromRoot(ancestor) = 1..effAsc. Budget = effDesc - distance + 1? No —
    // we want cousins at same generation as root's descendants. Simpler: for
    // each ancestor at distance d, allow walkDown of depth d (siblings, cousins,
    // etc. up to root's generation), not beyond.
    const distance = new Map<string, number>();
    const queue: Array<[string, number]> = [[rootId, 0]];
    while (queue.length) {
      const [id, d] = queue.shift()!;
      if (distance.has(id)) continue;
      distance.set(id, d);
      if (d < effAsc) {
        for (const p of neighbors(id).parents) queue.push([p, d + 1]);
      }
    }
    for (const [a, d] of distance) {
      if (d === 0) continue;
      for (const c of neighbors(a).children) {
        if (keep.has(c)) continue;
        keep.add(c);
        walkDown(c, Math.max(0, d - 1));
      }
    }
  }

  // Include spouses of kept people (last, so spouses don't seed further walks).
  for (const id of Array.from(keep)) {
    for (const s of neighbors(id).spouses) keep.add(s);
  }

  return {
    rootId,
    nodes: people.filter((p) => keep.has(p.id)),
    edges: edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
  };
}
