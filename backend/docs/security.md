# Sécurité

## Authentification JWT

- Endpoint `POST /auth/login` retourne un JWT signé HS256.
- Durée de vie configurable (`app.jwt.expiration-hours`, défaut 24h).
- Secret HMAC configurable via variable d'environnement `JWT_SECRET`.
  **Doit être une chaîne aléatoire d'au moins 32 caractères en production.**

Générer un secret :

```bash
openssl rand -hex 32
```

## Rôles

| Rôle     | Permissions                                                 |
|----------|-------------------------------------------------------------|
| `VIEWER` | Lecture seule (arbre, fiches, recherche)                    |
| `EDITOR` | + création/modification personnes, relations, upload médias |
| `ADMIN`  | + gestion des utilisateurs, import/export global            |

Les rôles sont stockés dans `data/users.json`. Les mots de passe sont hachés avec bcrypt (coût par défaut 10).

## Utilisateurs par défaut

Au premier démarrage, `data/users.json` est initialisé avec :
- `admin` / `admin` (ADMIN)
- `viewer` / `viewer` (VIEWER)

**Changez ces mots de passe immédiatement en production** (édition directe du fichier avec un hash bcrypt, ou endpoint admin à venir en v2).

## CORS

Les origines autorisées sont configurées via `app.cors.allowed-origins` (liste séparée par des virgules). 

Par défaut : `http://localhost:5173, http://localhost:3000, http://localhost:8080`.

En production, restreignez à l'origine réelle du frontend.

## Recommandations

- Servez toujours l'application derrière HTTPS (Let's Encrypt).
- Sauvegardez régulièrement le dossier `data/`.
- Le fichier `data/users.json` contient des hashes bcrypt — pas critique en cas de fuite, mais restreignez les permissions Unix (`chmod 600`).
- Le WAL (`data/wal/`) peut contenir des données personnelles récentes — incluez-le dans les sauvegardes chiffrées.
