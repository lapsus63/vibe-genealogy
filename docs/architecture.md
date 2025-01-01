# Architecture — Family Tree Canvas

Vue d'ensemble du monorepo frontend + backend (Spring Boot local).

## Diagramme système

```
┌─────────────────────────────────────────────────────────────────┐
│  Navigateur                                                      │
│  Frontend (React 19) — dossier frontend/                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Routes      │  │ TreeCanvas   │  │ api.ts + mock-data.ts   │ │
│  │ /tree, etc. │→ │ React Flow   │→ │ (demo si pas de backend)│ │
│  └─────────────┘  └──────────────┘  └───────────┬─────────────┘ │
└──────────────────────────────────────────────────│───────────────┘
                                                   │ VITE_API_BASE_URL
                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend Spring Boot 3.5 (Java 25) — local / Docker              │
│  ┌──────── REST ────────┐    ┌──────── Domain (pur) ──────────┐ │
│  │ TreeController       │───→│ Genealogy, Person, Union       │ │
│  │ ImportExportController│   │ TreeExpander, KinshipCalculator│ │
│  │ AuthController + JWT │    └──────────────┬─────────────────┘ │
│  └──────────────────────┘                   │ ports out         │
│                                             ▼                    │
│              InMemoryTreeRepository + Gedcom/Json/Gefx + media/  │
│                              data/tree.ged, data/media/, wal/    │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend (`frontend/src/`)

### Routes (React Router)

| Route            | Fichier                         | Rôle                       |
|------------------|---------------------------------|----------------------------|
| `/login`         | `pages/LoginPage.tsx`           | Authentification JWT       |
| `/tree`          | `pages/TreePage.tsx`            | Vue graphe principale      |
| `/persons/:id`   | `pages/PersonPage.tsx`          | Fiche personne             |
| `/search`        | `pages/SearchPage.tsx`          | Recherche                  |
| `/kinship`       | `pages/KinshipPage.tsx`         | Calcul de parenté (client) |
| `/import-export` | `pages/ImportExportPage.tsx`    | Import/export              |

Gate JWT : `AuthenticatedLayout` vérifie `/auth/me`.

### Bibliothèque généalogie (`frontend/src/lib/genealogy/`)

| Fichier            | Responsabilité                                                |
|--------------------|---------------------------------------------------------------|
| `types.ts`         | Contrat REST partagé (PersonDetail, TreeGraph, ExpandParams…) |
| `api.ts`           | Client HTTP + fallback demo                                   |
| `mock-data.ts`     | Arbre de démo (~20 personnes), expansion riche                |
| `store.ts`         | État UI arbre (Zustand)                                       |
| `layout.ts`        | Conversion TreeGraph → positions React Flow                   |
| `kinship.ts`       | Calcul MRCA + labels français                                 |
| `auth-context.tsx` | Contexte auth + localStorage JWT                              |

### Visualisation arbre

1. `useTreeStore` définit root, profondeurs asc/desc, mode (PEDIGREE / DESCENDANTS / MIXED), algorithme layout
2. `fetchExpand()` / `fetchTreeRoot()` charge les données de l'arbre
3. `layoutGraph()` produit nodes/edges React Flow
4. `PersonNode` affiche photo, dates, indicateurs de relations cachées

## Backend (`backend/`)

Architecture hexagonale détaillée : [`backend/docs/architecture.md`](../backend/docs/architecture.md).

### État d'implémentation

| Couche                                               | Statut                          |
|------------------------------------------------------|---------------------------------|
| Domain models + TreeExpander + KinshipCalculator     | ✅                              |
| Ports in (TreeQuery, PersonEditing, RelationEditing) | ✅                              |
| GenealogyService + REST controllers + JWT            | ✅                              |
| Ports out + adapters persistence/GEDCOM/media        | ✅                              |
| WAL + snapshot async                                 | ✅ basique (replay dernier WAL) |
| Enforcement rôles sur mutations                      | ❌                              |

## Écarts frontend ↔ backend

| Fonctionnalité                     | Frontend                  | Backend                          |
|------------------------------------|---------------------------|----------------------------------|
| Mode expand (PEDIGREE/DESCENDANTS) | Appliqué (mock)           | Appliqué (`GenealogyService`)    |
| Cousins / frères en expansion      | mockExpand                | TreeExpander strict (pas cousin) |
| Kinship                            | Client `computeKinship()` | `/api/kinship` disponible        |
| Liste personnes                    | `GET /api/persons`        | ✅                               |
| Export authentifié                 | `window.open` sans token  | Requiert Bearer                  |
| Citations / sources / geo          | Mock enrichi              | Champs DTO présents, vides v1    |

## Variables d'environnement

| Variable                       | Où         | Description                    |
|--------------------------------|------------|--------------------------------|
| `VITE_API_BASE_URL`            | Frontend   | URL backend (vide = mode demo) |
| `JWT_SECRET`                   | Backend    | Secret HMAC (≥ 32 car. prod)   |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | MCP Cursor | Token pour GitHub MCP server   |

## Documentation associée

- [`backend/docs/api.md`](../backend/docs/api.md) — endpoints REST
- [`backend/docs/security.md`](../backend/docs/security.md) — JWT et rôles
- [`backend/docs/data-formats.md`](../backend/docs/data-formats.md) — GEDCOM, JSON, GEFX
- [`docs/optimisations-proposees.md`](optimisations-proposees.md) — backlog priorisé
