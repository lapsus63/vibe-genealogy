# Architecture

Backend en architecture hexagonale (Ports & Adapters).

Le **domaine** ne dépend de rien d'externe HTTP/Spring Security (Jackson est utilisé sur le modèle pour le JSON / WAL).

Les **adapters** implémentent les ports et sont branchés par Spring.

```
                     ┌───────────────────────────────────────┐
                     │            Adapters IN                │
                     │  REST Controllers (Spring MVC)        │
                     │  Spring Security + JWT filter         │
                     └────────────────┬──────────────────────┘
                                      │ implements/uses
                     ┌────────────────▼──────────────────────┐
                     │            Ports IN (use cases)       │
                     │  TreeQuery, PersonEditing,            │
                     │  RelationEditing                      │
                     └────────────────┬──────────────────────┘
                                      │
                     ┌────────────────▼──────────────────────┐
                     │              Domain                    │
                     │  Genealogy, Person, Union, Event…      │
                     │  TreeExpander, KinshipCalculator       │
                     └────────────────┬──────────────────────┘
                                      │
                     ┌────────────────▼──────────────────────┐
                     │           Ports OUT                    │
                     │  TreeRepository, MediaRepository,      │
                     │  FileFormatAdapter                     │
                     └────────────────┬──────────────────────┘
                                      │ implemented by
                     ┌────────────────▼──────────────────────┐
                     │           Adapters OUT ✅              │
                     │  InMemoryTreeRepository (+ WAL + snap) │
                     │  FileSystemMediaRepository             │
                     │  GedcomFileAdapter, JsonFileAdapter,   │
                     │  GefxFileAdapter (export minimal)      │
                     └───────────────────────────────────────┘
```

## Statut par capacité

| Capacité                         | Statut                                      |
|----------------------------------|---------------------------------------------|
| Cache mémoire `Genealogy`        | ✅ `InMemoryTreeRepository`                 |
| Snapshot GEDCOM atomique         | ✅ `@Scheduled` + `ATOMIC_MOVE`             |
| WAL append + replay              | ✅ dump JSON ; rejoue le dernier pending    |
| Bootstrap `tree.ged`             | ✅ classpath `bootstrap/tree.ged`           |
| Import/export GEDCOM + JSON      | ✅                                          |
| Import GEFX                      | ❌ no-op (export XML minimal)               |
| Médias FS                        | ✅                                          |
| Enforcement rôles mutations      | ❌ documenté seulement                      |

## Flux d'écriture

1. Requête HTTP → Controller → cas d'usage (application service)
2. Modification du modèle domaine en mémoire
3. `TreeRepository.save()` :
   - marque le cache "dirty"
   - append un enregistrement WAL synchrone (JSON complet)
4. Un scheduler (`@Scheduled`) déclenche un snapshot GEDCOM asynchrone, remplace le fichier de façon atomique (`Files.move` + `ATOMIC_MOVE`), puis purge le WAL.

## Reprise après crash

Au démarrage, `InMemoryTreeRepository.init()` :
- copie le bootstrap si `data/tree.ged` absent
- lit `data/tree.ged`
- rejoue le dernier `data/wal/pending-*.json` s'il existe, puis snapshot

## Cache mémoire

L'agrégat `Genealogy` est chargé une seule fois puis maintenu en mémoire.

Toutes les lectures (arbre, expand, recherche, calcul de parenté) travaillent sur cette structure,
ce qui permet des temps de réponse sub-milliseconde même sur des arbres de plusieurs milliers de personnes.
