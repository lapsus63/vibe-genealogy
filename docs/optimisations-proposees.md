# Optimisations proposées

Analyse du code et priorités pour clarté, tests et documentation.

Légende : ✅ fait · 🔲 reste · ◐ partiel

## P0 — Bloquants intégration

1. ✅ **Implémenter `adapter/out/`** — `TreeRepository`, adapters GEDCOM/JSON/GEFX, médias FS, bootstrap `bootstrap/tree.ged`.
2. ✅ **Aligner le contrat REST** — `GET /api/persons`, `PersonDetailDto` (citations/sources/geo présents, vides), paramètre `mode` sur expand, root stable `I5`.
3. ✅ **Export authentifié** — remplacer `window.open(exportUrl())` par un téléchargement via `fetch` + blob avec header Authorization.

## P1 — Clarté du code

| Fichier                                                   | Action                                                                                     | Statut |
|-----------------------------------------------------------|--------------------------------------------------------------------------------------------|--------|
| `frontend/src/lib/genealogy/store.ts`                     | `resetView()` : remettre asc/desc à 2 (ou aux valeurs initiales), pas 8                    | 🔲     |
| `frontend/src/components/tree/PersonNode.tsx`             | Supprimer la branche morte `hasHidden && !hasHiddenParents && …`                           | 🔲     |
| `frontend/src/pages/PersonPage.tsx`                       | Afficher noms dans listes famille, pas seulement les IDs                                   | 🔲     |
| `frontend/src/lib/genealogy/kinship.ts` + Java            | Unifier les labels français ; une seule source de vérité + tests de parité                 | 🔲     |
| `frontend/src/lib/genealogy/mock-data.ts`                 | Refactoriser `mockExpand()` : extraire fonctions nommées, supprimer commentaires obsolètes | 🔲     |
| `backend/.../TreeController.java`                         | Root stable + propager `mode`                                                              | ✅     |
| `backend/.../Person.java`                                 | Corriger Javadoc « immutable »                                                             | ✅     |
| `backend/README.md`                                       | Corriger référence CI : `backend-ci.yml`                                                   | ✅     |

## P2 — Couverture tests

### Frontend (ajouter Vitest)

```bash
cd frontend && bun add -d vitest @vitest/coverage-v8
```

| Suite          | Fichier test suggéré                             | Cas limites                                                    | Statut |
|----------------|--------------------------------------------------|----------------------------------------------------------------|--------|
| Parenté        | `frontend/src/lib/genealogy/kinship.test.ts`     | même personne, demi-frères, cousins removed, graphe déconnecté | 🔲     |
| Expansion demo | `frontend/src/lib/genealogy/mock-expand.test.ts` | modes, asc=0/desc=0, cousins I24/I26 depuis I5                 | 🔲     |
| Layout         | `frontend/src/lib/genealogy/layout.test.ts`      | graphe vide, conjoints seuls, radial 20+ nœuds                 | 🔲     |

### Backend (étendre `DomainTest.java`)

- ✅ Kinship : siblings, no link (+ parent/grandparent déjà là)
- ✅ TreeExpander : asc=0 desc=0, rootId inconnu
- ✅ Genealogy : enfant dans deux unions, suppression personne d'une union
- ✅ Round-trip GEDCOM bootstrap
- 🔲 Kinship half-siblings / cousins (cas supplémentaires)

### CI

- 🔲 Ajouter workflow frontend (lint + vitest)
- ✅ `mvn verify` passe avec adapters out (JaCoCo 0.8.14, Spring Boot 3.5.5)

## P3 — Documentation

| Document                       | Action                                                          | Statut |
|--------------------------------|-----------------------------------------------------------------|--------|
| `README.md` (racine)           | Setup demo vs backend, env vars, scripts (`frontend/`)          | ◐      |
| `AGENTS.md` + `.cursor/rules/` | Alignés sur monorepo actuel + backend out                       | ✅     |
| `docs/architecture.md`         | Chemins `frontend/`, statut adapters                            | ✅     |
| `backend/docs/architecture.md` | Marquer sections « implémenté » vs « planifié »                 | ✅     |
| `backend/docs/api.md`          | Synchroniser avec controllers réels                             | ✅     |
| OpenAPI                        | Générer et committer `openapi.yaml` une fois backend compilable | 🔲     |

## P4 — Fonctionnalités plan (v2)

Edition personne UI, MediaUploader, enforcement rôles, cartes migrations complètes, import GEFX profond, sources/citations persistées…
