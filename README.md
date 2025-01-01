# Vibe Genealogy

Application d'arbre généalogique : frontend React + backend Spring Boot (Java 25).

## Démarrage rapide

```bash
# Frontend seul (mode démo, données fictives)
cd frontend && bun install && bun run dev

# Frontend + backend
cd backend && mvn spring-boot:run
cd frontend && VITE_API_BASE_URL=http://localhost:8080 bun run dev

# Docker Compose (voir docker-compose.yml)
docker compose up --build
```

Comptes démo backend : `admin` / `admin`, `viewer` / `viewer`.

## Structure

| Dossier      | Contenu                                       |
|--------------|-----------------------------------------------|
| `frontend/`  | React 19, React Flow, Zustand                 |
| `backend/`   | Spring Boot 3.5, hexagonal, GEDCOM sur disque |
| `docs/`      | Architecture monorepo + backlog optimisations |

## Variables d'environnement

| Variable             | Description                                       |
|----------------------|---------------------------------------------------|
| `VITE_API_BASE_URL`  | URL API (vide = mode démo frontend)               |
| `JWT_SECRET`         | Secret HMAC JWT backend (≥ 32 caractères en prod) |

## Documentation

- [`AGENTS.md`](AGENTS.md) — guide pour agents IA
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/optimisations-proposees.md`](docs/optimisations-proposees.md)
- [`backend/README.md`](backend/README.md)
