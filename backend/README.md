# Backend — Arbre généalogique (Spring Boot 3.5, Java 25)

Architecture hexagonale, cache mémoire + persistance sur système de fichiers.
Aucune base de données. Les données sont stockées dans `data/` :

```
data/
├── tree.ged            # source de vérité (GEDCOM 5.5.1)
├── media/{personId}/   # photos, audio, vidéo, scans d'actes
├── users.json          # comptes (bcrypt) + rôles
└── wal/                # write-ahead log JSON (reprise après crash)
```

Au premier démarrage, `tree.ged` est initialisé depuis `classpath:bootstrap/tree.ged`
(famille démo alignée sur le mock frontend).

## Démarrer

```bash
cd backend
mvn spring-boot:run
# ou : mvn -DskipTests package && java -jar target/family-tree-backend-*.jar
# API disponible sur http://localhost:8080
# OpenAPI/Swagger : http://localhost:8080/swagger-ui.html
```

Configurez le frontend avec `VITE_API_BASE_URL=http://localhost:8080` (depuis `frontend/`).

## Structure

Voir `docs/architecture.md` pour le diagramme hexagonal complet.

```
src/main/java/com/family/tree/
├── domain/          # Modèle métier (Person, Union, Event…)
│   ├── model/
│   ├── service/     # KinshipCalculator, TreeExpander
│   └── port/
│       ├── in/      # TreeQuery, PersonEditing, RelationEditing
│       └── out/     # TreeRepository, MediaRepository, FileFormatAdapter
├── application/     # GenealogyService
├── adapter/
│   ├── in/rest/     # Controllers REST + DTOs
│   ├── in/security/ # Spring Security (JWT)
│   └── out/
│       ├── persistence/  # InMemoryTreeRepository (WAL + snapshot)
│       ├── media/        # FileSystemMediaRepository
│       └── gedcom/       # Gedcom / JSON / GEFX adapters
└── VibeGenealogy.java
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — architecture hexagonale
- [`docs/api.md`](docs/api.md) — endpoints REST (voir aussi OpenAPI)
- [`docs/data-formats.md`](docs/data-formats.md) — mapping GEDCOM / GEFX / JSON
- [`docs/deployment.md`](docs/deployment.md) — Docker, systemd, reverse proxy
- [`docs/security.md`](docs/security.md) — JWT, rôles, hachage bcrypt

## Tests & CI

```bash
mvn test          # JUnit 5 + rapport Jacoco (target/site/jacoco/)
mvn javadoc:javadoc
```

CI GitHub Actions : `.github/workflows/backend-ci.yml` (build + tests + Javadoc).

Prérequis : **Spring Boot ≥ 3.5.5** et **JaCoCo ≥ 0.8.14** pour Java 25.

## Utilisateurs de démonstration

Au premier démarrage, si `data/users.json` n'existe pas, deux comptes sont créés :
- `admin` / `admin` (rôle `ADMIN`)
- `viewer` / `viewer` (rôle `VIEWER`)

**Changez ces mots de passe immédiatement.**
