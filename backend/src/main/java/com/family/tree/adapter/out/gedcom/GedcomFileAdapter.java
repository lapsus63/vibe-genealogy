package com.family.tree.adapter.out.gedcom;

import com.family.tree.domain.model.*;
import com.family.tree.domain.port.out.FileFormatAdapter;
import org.gedcom4j.exception.GedcomWriterException;
import org.gedcom4j.model.*;
import org.gedcom4j.model.enumerations.FamilyEventType;
import org.gedcom4j.model.enumerations.IndividualAttributeType;
import org.gedcom4j.model.enumerations.IndividualEventType;
import org.gedcom4j.parser.GedcomParser;
import org.gedcom4j.writer.GedcomWriter;
import org.springframework.stereotype.Component;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import java.util.UUID;

/** Import/export GEDCOM 5.5.1 via gedcom4j. */
@Component
public class GedcomFileAdapter implements FileFormatAdapter {

    @Override
    public String format() {
        return "gedcom";
    }

    @Override
    public int importInto(Genealogy target, InputStream in) throws Exception {
        GedcomParser parser = new GedcomParser();
        parser.setStrictLineBreaks(false);
        parser.load(new BufferedInputStream(in));
        Gedcom ged = parser.getGedcom();
        int count = 0;

        for (Individual indi : ged.getIndividuals().values()) {
            String id = stripXref(indi.getXref());
            if (id == null || id.isBlank()) continue;
            if (target.person(id) == null) {
                target.addPerson(toPerson(indi, id));
                count++;
            }
        }

        for (Family fam : ged.getFamilies().values()) {
            String id = stripXref(fam.getXref());
            if (id == null || id.isBlank()) continue;
            if (target.union(id) == null) {
                target.addUnion(toUnion(fam, id));
                count++;
            }
        }
        return count;
    }

    @Override
    public void export(Genealogy source, OutputStream out) throws Exception {
        Gedcom ged = toGedcom(source);
        try {
            GedcomWriter writer = new GedcomWriter(ged);
            writer.setValidationSuppressed(true);
            writer.write(out);
        } catch (GedcomWriterException e) {
            throw new IllegalStateException("Échec export GEDCOM : " + e.getMessage(), e);
        }
    }

    /** Charge un flux GEDCOM dans un agrégat neuf (bootstrap / snapshot). */
    public Genealogy loadFresh(InputStream in) throws Exception {
        Genealogy g = new Genealogy();
        importInto(g, in);
        return g;
    }

    public void write(Genealogy source, OutputStream out) throws Exception {
        export(source, out);
    }

    // ---- mapping domaine ← GEDCOM ------------------------------------------------

    private Person toPerson(Individual indi, String id) {
        String first = "";
        String last = "";
        List<PersonalName> names = indi.getNames();
        if (names != null && !names.isEmpty()) {
            PersonalName n = names.get(0);
            if (n.getGivenName() != null && n.getGivenName().getValue() != null) {
                first = n.getGivenName().getValue();
            }
            if (n.getSurname() != null && n.getSurname().getValue() != null) {
                last = n.getSurname().getValue();
            }
            if ((first.isBlank() || last.isBlank()) && n.getBasic() != null) {
                String[] parts = parseBasicName(n.getBasic());
                if (first.isBlank()) first = parts[0];
                if (last.isBlank()) last = parts[1];
            }
        }

        Sex sex = Sex.U;
        if (indi.getSex() != null && indi.getSex().getValue() != null) {
            String s = indi.getSex().getValue().trim().toUpperCase();
            if (s.startsWith("M")) sex = Sex.M;
            else if (s.startsWith("F")) sex = Sex.F;
        }

        Person p = new Person(id, first, last, sex);
        p.setOccupation(firstAttribute(indi, IndividualAttributeType.OCCUPATION));
        p.setBiography(joinNotes(indi));

        if (indi.getEvents() != null) {
            for (IndividualEvent ev : indi.getEvents()) {
                PersonEvent pe = toPersonEvent(id, ev);
                if (pe != null) p.events().add(pe);
            }
        }
        return p;
    }

    private Union toUnion(Family fam, String id) {
        String a = refId(fam.getHusband());
        String b = refId(fam.getWife());
        Union u = new Union(id, a, b);
        if (fam.getChildren() != null) {
            for (IndividualReference child : fam.getChildren()) {
                String cid = refId(child);
                if (cid != null) u.children().add(cid);
            }
        }
        if (fam.getEvents() != null) {
            int i = 0;
            for (FamilyEvent ev : fam.getEvents()) {
                EventType type = mapFamilyEvent(ev.getType());
                if (type == null) continue;
                String date = ev.getDate() != null ? ev.getDate().getValue() : null;
                String place = ev.getPlace() != null ? ev.getPlace().getPlaceName() : null;
                u.events().add(new PersonEvent(id + "-" + type + "-" + i++, type, ApproximateDate.of(date), place, null));
            }
        }
        return u;
    }

    private PersonEvent toPersonEvent(String personId, IndividualEvent ev) {
        EventType type = mapIndividualEvent(ev.getType());
        if (type == null) return null;
        String date = ev.getDate() != null ? ev.getDate().getValue() : null;
        String place = ev.getPlace() != null ? ev.getPlace().getPlaceName() : null;
        String desc = ev.getDescription() != null ? ev.getDescription().getValue() : null;
        String eid = personId + "-" + type.name() + "-" + UUID.randomUUID().toString().substring(0, 6);
        return new PersonEvent(eid, type, ApproximateDate.of(date), place, desc);
    }

    // ---- mapping domaine → GEDCOM ------------------------------------------------

    private Gedcom toGedcom(Genealogy source) {
        Gedcom ged = new Gedcom();
        Header header = new Header();
        CharacterSet cs = new CharacterSet();
        cs.setCharacterSetName("UTF-8");
        header.setCharacterSet(cs);
        GedcomVersion ver = new GedcomVersion();
        ver.setVersionNumber("5.5.1");
        header.setGedcomVersion(ver);
        ged.setHeader(header);

        for (Person p : source.allPersons()) {
            Individual indi = new Individual();
            indi.setXref("@" + p.id() + "@");
            PersonalName name = new PersonalName();
            String given = nullToEmpty(p.firstName());
            String surname = nullToEmpty(p.lastName());
            name.setBasic(given + " /" + surname + "/");
            name.setGivenName(given);
            name.setSurname(surname);
            indi.getNames(true).add(name);
            indi.setSex(p.sex() == Sex.U ? "U" : p.sex().name());

            if (p.occupation() != null && !p.occupation().isBlank()) {
                IndividualAttribute occ = new IndividualAttribute();
                occ.setType(IndividualAttributeType.OCCUPATION);
                occ.setDescription(p.occupation());
                indi.getAttributes(true).add(occ);
            }
            if (p.biography() != null && !p.biography().isBlank()) {
                NoteStructure note = new NoteStructure();
                note.getLines(true).add(p.biography());
                indi.getNoteStructures(true).add(note);
            }
            for (PersonEvent e : p.events()) {
                IndividualEvent ie = new IndividualEvent();
                IndividualEventType t = mapToIndividualEventType(e.type());
                if (t == null) continue;
                ie.setType(t);
                if (e.date() != null) ie.setDate(e.date().raw());
                if (e.place() != null) {
                    Place place = new Place();
                    place.setPlaceName(e.place());
                    ie.setPlace(place);
                }
                if (e.description() != null) ie.setDescription(e.description());
                indi.getEvents(true).add(ie);
            }
            ged.getIndividuals().put(indi.getXref(), indi);
        }

        for (Union u : source.allUnions()) {
            Family fam = new Family();
            fam.setXref("@" + u.id() + "@");
            if (u.spouseA() != null) {
                Individual husb = ged.getIndividuals().get("@" + u.spouseA() + "@");
                if (husb != null) fam.setHusband(new IndividualReference(husb));
            }
            if (u.spouseB() != null) {
                Individual wife = ged.getIndividuals().get("@" + u.spouseB() + "@");
                if (wife != null) fam.setWife(new IndividualReference(wife));
            }
            for (String childId : u.children()) {
                Individual child = ged.getIndividuals().get("@" + childId + "@");
                if (child != null) fam.getChildren(true).add(new IndividualReference(child));
            }
            for (PersonEvent e : u.events()) {
                FamilyEventType t = mapToFamilyEventType(e.type());
                if (t == null) continue;
                FamilyEvent fe = new FamilyEvent();
                fe.setType(t);
                if (e.date() != null) fe.setDate(e.date().raw());
                if (e.place() != null) {
                    Place place = new Place();
                    place.setPlaceName(e.place());
                    fe.setPlace(place);
                }
                fam.getEvents(true).add(fe);
            }
            ged.getFamilies().put(fam.getXref(), fam);
        }
        return ged;
    }

    // ---- helpers -----------------------------------------------------------------

    static String stripXref(String xref) {
        if (xref == null) return null;
        String s = xref.trim();
        if (s.startsWith("@") && s.endsWith("@") && s.length() >= 2) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    private static String refId(IndividualReference ref) {
        if (ref == null || ref.getIndividual() == null) return null;
        return stripXref(ref.getIndividual().getXref());
    }

    private static String[] parseBasicName(String basic) {
        int slash = basic.indexOf('/');
        if (slash < 0) return new String[]{basic.trim(), ""};
        String given = basic.substring(0, slash).trim();
        int slash2 = basic.indexOf('/', slash + 1);
        String surname = slash2 > slash ? basic.substring(slash + 1, slash2).trim() : basic.substring(slash + 1).trim();
        return new String[]{given, surname};
    }

    private static String firstAttribute(Individual indi, IndividualAttributeType type) {
        List<IndividualAttribute> all = indi.getAttributes();
        if (all == null || all.isEmpty()) return null;
        for (IndividualAttribute a : all) {
            if (a.getType() == type) {
                if (a.getDescription() != null) return a.getDescription().getValue();
                return null;
            }
        }
        return null;
    }

    private static String joinNotes(Individual indi) {
        if (indi.getNoteStructures() == null || indi.getNoteStructures().isEmpty()) return null;
        StringBuilder sb = new StringBuilder();
        for (NoteStructure n : indi.getNoteStructures()) {
            if (n.getLines() == null) continue;
            for (String line : n.getLines()) {
                if (sb.length() > 0) sb.append('\n');
                sb.append(line);
            }
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    private static EventType mapIndividualEvent(IndividualEventType t) {
        if (t == null) return null;
        return switch (t) {
            case BIRTH -> EventType.BIRTH;
            case DEATH -> EventType.DEATH;
            case BAPTISM, CHRISTENING, CHRISTENING_ADULT -> EventType.BAPTISM;
            case BURIAL, CREMATION -> EventType.BURIAL;
            default -> EventType.CUSTOM;
        };
    }

    private static EventType mapFamilyEvent(FamilyEventType t) {
        if (t == null) return null;
        return switch (t) {
            case MARRIAGE -> EventType.MARRIAGE;
            case DIVORCE -> EventType.DIVORCE;
            default -> EventType.CUSTOM;
        };
    }

    private static IndividualEventType mapToIndividualEventType(EventType t) {
        return switch (t) {
            case BIRTH -> IndividualEventType.BIRTH;
            case DEATH -> IndividualEventType.DEATH;
            case BAPTISM -> IndividualEventType.BAPTISM;
            case BURIAL -> IndividualEventType.BURIAL;
            case CUSTOM -> IndividualEventType.EVENT;
            default -> null;
        };
    }

    private static FamilyEventType mapToFamilyEventType(EventType t) {
        return switch (t) {
            case MARRIAGE -> FamilyEventType.MARRIAGE;
            case DIVORCE -> FamilyEventType.DIVORCE;
            default -> null;
        };
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
