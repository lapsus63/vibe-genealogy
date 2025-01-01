## Projet

Application d'arbre généalogique en monorepo :

| Partie   | Stack                                       | Emplacement  |
|----------|---------------------------------------------|--------------|
| Frontend | React 19, React Router, React Flow, Zustand | `frontend/`  |
| Backend  | Spring Boot 3.5, Java 25, hexagonal         | `backend/`   |

- **Architecture** : [`docs/architecture.md`](docs/architecture.md)
- **Optimisations proposées** : [`docs/optimisations-proposees.md`](docs/optimisations-proposees.md)
- **Règles Cursor** : `.cursor/rules/`

## Commandes utiles

```bash
# Frontend
cd frontend && bun install && bun run dev          # demo sans backend
cd frontend && VITE_API_BASE_URL=http://localhost:8080 bun run dev

# Backend
cd backend && mvn spring-boot:run
cd backend && mvn test
# Données runtime dans backend/data/ (créé au 1er démarrage depuis bootstrap/tree.ged)
```

## MCP (GitHub)

- **Cursor** : `.cursor/mcp.json` (clé `mcpServers`)
- **VS Code / Copilot** : `.vscode/mcp.json` (clé `servers`)

Configurer `GITHUB_PERSONAL_ACCESS_TOKEN` (Cursor) ou le prompt au premier usage (VS Code).
Serveur officiel : `https://api.githubcopilot.com/mcp/`

## Pièges fréquents pour l'IA

1. Le frontend est sous `frontend/` (plus à la racine) — vérifier `vite.config.ts` **dans** `frontend/`
2. Backend : ports/adapters out sont en place (`TreeRepository`, GEDCOM, médias) ; WAL replay basique, rôles non appliqués sur les mutations
3. Mode demo : `mockExpand()` ≠ `TreeExpander` Java (cousins uniquement côté mock) — vérifier les écarts avant de « corriger » le frontend
4. Kinship calculé côté client ; labels TS et Java peuvent diverger
5. Export authentifié : ne pas utiliser `window.open(exportUrl())` sans JWT — `fetch` + blob requis
6. Spring Boot ≥ 3.5.5 requis pour Java 25 (repackage / `spring-boot:run`)
