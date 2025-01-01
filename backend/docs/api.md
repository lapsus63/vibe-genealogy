# API REST

Base URL : `http://localhost:8080`. Toutes les routes `/api/**` exigent un
`Authorization: Bearer <token>` obtenu via `/auth/login`.

## Authentification

| Méthode | Chemin         | Body                         | Réponse                                   |
|---------|----------------|------------------------------|-------------------------------------------|
| POST    | `/auth/login`  | `{ "username", "password" }` | `{ "token", "user": { username, role } }` |
| POST    | `/auth/logout` | —                            | `{ "ok": true }`                          |
| GET     | `/auth/me`     | —                            | `{ username, role }` ou 401               |

Rôles : `ADMIN`, `EDITOR`, `VIEWER`.

## Arbre

| Méthode | Chemin                                                     | Description                                                  |
|---------|------------------------------------------------------------|--------------------------------------------------------------|
| GET     | `/api/tree`                                                | Arbre complet (nodes + edges) ; root = `I5` si présent       |
| GET     | `/api/tree/expand?rootId=&ascendants=&descendants=&mode=`  | Sous-arbre ; `mode` = `MIXED` \| `PEDIGREE` \| `DESCENDANTS` |
| GET     | `/api/persons`                                             | Liste de toutes les fiches détaillées                        |
| GET     | `/api/persons/{id}`                                        | Fiche détaillée + timeline + galerie                         |
| POST    | `/api/persons`                                             | Créer une personne                                           |
| PATCH   | `/api/persons/{id}`                                        | Mettre à jour bio/nom/sexe/profession                        |
| DELETE  | `/api/persons/{id}`                                        | Supprimer (+ dissout les unions)                             |

## Relations

| Méthode | Chemin                                               | Description                            |
|---------|------------------------------------------------------|----------------------------------------|
| POST    | `/api/relations/unions`                              | Créer une union `{ spouseA, spouseB }` |
| DELETE  | `/api/relations/unions/{unionId}`                    | Supprimer une union                    |
| POST    | `/api/relations/unions/{unionId}/children/{childId}` | Ajouter un enfant                      |

## Médias

| Méthode | Chemin                                       | Description                     |
|---------|----------------------------------------------|---------------------------------|
| POST    | `/api/persons/{id}/media` (multipart `file`) | Uploader photo/audio/vidéo/scan |
| DELETE  | `/api/media/{personId}/{mediaId}`            | Supprimer un média              |
| GET     | `/api/media/{personId}/{filename}`           | Servir le fichier               |

## Recherche & parenté

| Méthode | Chemin                                    | Description                              |
|---------|-------------------------------------------|------------------------------------------|
| GET     | `/api/search?q=&place=&yearFrom=&yearTo=` | Recherche (nom, bio, lieu, années)       |
| GET     | `/api/kinship?fromId=&toId=`              | Calcul du lien de parenté                |

## Import / Export

| Méthode | Chemin                                  | Description                            |
|---------|-----------------------------------------|----------------------------------------|
| POST    | `/api/import` (multipart `file`)        | Fusionne un `.ged` / `.gefx` / `.json` |
| GET     | `/api/export?format=gedcom\|gefx\|json` | Télécharge l'arbre complet             |

## Spécification OpenAPI

Swagger UI : `http://localhost:8080/swagger-ui.html`
Fichier JSON : `http://localhost:8080/v3/api-docs`
