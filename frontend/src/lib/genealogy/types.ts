// Shared domain types between frontend and backend REST contract.

export type Sex = "M" | "F" | "U";

export interface PersonSummary {
  id: string;
  firstName: string;
  lastName: string;
  sex: Sex;
  birth?: string; // YYYY or approximate ("abt 1850")
  death?: string;
  photoUrl?: string;
}

export interface PersonDetail extends PersonSummary {
  birthPlace?: string;
  birthGeo?: GeoPoint;
  deathPlace?: string;
  deathGeo?: GeoPoint;
  occupation?: string;
  biography?: string;
  events: PersonEvent[];
  media: MediaAsset[];
  citations?: Citation[];
  sources?: Source[];
  parents: string[];
  spouses: string[];
  children: string[];
}

export type EventType =
  "BIRTH" | "DEATH" | "MARRIAGE" | "DIVORCE" | "BAPTISM" | "BURIAL" | "CUSTOM";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PersonEvent {
  id: string;
  type: EventType;
  date?: string;
  place?: string;
  geo?: GeoPoint;
  description?: string;
  citationIds?: string[];
}

export interface Source {
  id: string;
  title: string;
  author?: string;
  publication?: string;
  repository?: string;
  url?: string;
}

export interface Citation {
  id: string;
  sourceId: string;
  page?: string;
  note?: string;
  scanUrl?: string; // link to scanned document (birth cert, letter, ...)
}

export interface MediaAsset {
  id: string;
  url: string;
  caption?: string;
  date?: string; // ISO
  kind: "photo" | "audio" | "video" | "document";
}

export type EdgeType = "PARENT_CHILD" | "SPOUSE";

export interface TreeEdge {
  id: string;
  type: EdgeType;
  source: string; // parent (PARENT_CHILD) or spouse A (SPOUSE)
  target: string; // child or spouse B
  unionId?: string;
}

export interface TreeGraph {
  rootId: string;
  nodes: PersonSummary[];
  edges: TreeEdge[];
}

export type TreeViewMode = "MIXED" | "PEDIGREE" | "DESCENDANTS";

export interface ExpandParams {
  rootId: string;
  ascendants: number;
  descendants: number;
  mode: TreeViewMode;
}
