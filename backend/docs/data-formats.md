# Formats de fichiers

## GEDCOM 5.5.1 (`.ged`)

Format historique universel. C'est la **source de vérité** persistée dans `data/tree.ged`. Le mapping est simplifié en v1 :

| Champ interne        | GEDCOM                                           |
|----------------------|--------------------------------------------------|
| `Person.firstName`   | `1 NAME Prénom /Nom/` (partie avant `/`)         |
| `Person.lastName`    | idem, partie entre `/`                           |
| `Person.sex`         | `1 SEX M\|F`                                     |
| `PersonEvent(BIRTH)` | `1 BIRT` + `2 DATE …` + `2 PLAC …`               |
| `PersonEvent(DEATH)` | `1 DEAT`                                         |
| `Union`              | Enregistrement `FAM` avec `HUSB`, `WIFE`, `CHIL` |

Limitations v1 : notes (`NOTE`), sources (`SOUR`), objets (`OBJE`) et citations ne sont pas encore mappés — prévu v2.

## GEDCOM X / GEFX (`.gefx`, `.xml`)

Successeur XML du GEDCOM. Adapter JAXB (v2) — la structure est reconnue à l'import mais pas encore parsée en profondeur.

## JSON interne (`.json`)

Sérialisation directe de l'agrégat `Genealogy` par Jackson. Utile pour :
- backups plus riches que GEDCOM (garde tous les champs internes)
- debug
- intégrations tierces

Structure :

```json
{
  "persons": [
    { "id": "I1", "firstName": "Jean", "lastName": "Dupont", "sex": "M",
      "biography": "…", "occupation": "…",
      "events": [{ "type": "BIRTH", "date": { "raw": "1920", "year": 1920 }, "place": "Lyon" }],
      "media": [] }
  ],
  "unions": [
    { "id": "F1", "spouseA": "I1", "spouseB": "I2", "children": ["I3"], "events": [] }
  ]
}
```

## Ajouter un nouveau format

Implémenter `FileFormatAdapter` et l'exposer comme `@Component` :

```java
@Component
public class MyFormatAdapter implements FileFormatAdapter {
    public String format() { return "myformat"; }
    public int importInto(Genealogy target, InputStream in) { ... }
    public void export(Genealogy source, OutputStream out) { ... }
}
```

Il sera automatiquement pris en compte par `/api/import` et `/api/export`.
