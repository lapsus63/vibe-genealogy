package com.family.tree.domain.model;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonSetter;

import java.util.*;

/**
 * Racine agrégat : contient toutes les personnes et unions de l'arbre.
 * Ce container est manipulé exclusivement via {@link com.family.tree.domain.port.in.PersonEditing}
 * et {@link com.family.tree.domain.port.in.RelationEditing}.
 */
@JsonAutoDetect(getterVisibility = JsonAutoDetect.Visibility.ANY)
public class Genealogy {
    private final Map<String, Person> persons = new LinkedHashMap<>();
    private final Map<String, Union> unions = new LinkedHashMap<>();

    public Genealogy() {}

    @JsonGetter("persons")
    public Map<String, Person> personsMap() { return persons; }

    @JsonSetter("persons")
    public void setPersons(Map<String, Person> persons) { this.persons.putAll(persons); }

    @JsonGetter("unions")
    public Map<String, Union> unionsMap() { return unions; }

    @JsonSetter("unions")
    public void setUnions(Map<String, Union> unions) { this.unions.putAll(unions); }

    public Collection<Person> allPersons() { return persons.values(); }
    public Collection<Union> allUnions() { return unions.values(); }

    public Person person(String id) { return persons.get(id); }
    public Union union(String id) { return unions.get(id); }

    public void addPerson(Person p) { persons.put(p.id(), p); }
    public void removePerson(String id) {
        persons.remove(id);
        for (Union u : new ArrayList<>(unions.values())) {
            u.children().remove(id);
            if (id.equals(u.spouseA()) || id.equals(u.spouseB())) unions.remove(u.id());
        }
    }
    public void addUnion(Union u) { unions.put(u.id(), u); }
    public void removeUnion(String id) { unions.remove(id); }

    /** Retourne les parents d'une personne (au plus 2, via les unions). */
    public List<String> parentsOf(String childId) {
        List<String> out = new ArrayList<>();
        for (Union u : unions.values()) {
            if (u.children().contains(childId)) {
                if (u.spouseA() != null) out.add(u.spouseA());
                if (u.spouseB() != null) out.add(u.spouseB());
            }
        }
        return out;
    }

    public List<String> childrenOf(String parentId) {
        List<String> out = new ArrayList<>();
        for (Union u : unions.values()) {
            if (parentId.equals(u.spouseA()) || parentId.equals(u.spouseB())) {
                out.addAll(u.children());
            }
        }
        return out;
    }

    public List<String> spousesOf(String personId) {
        List<String> out = new ArrayList<>();
        for (Union u : unions.values()) {
            if (personId.equals(u.spouseA()) && u.spouseB() != null) out.add(u.spouseB());
            else if (personId.equals(u.spouseB()) && u.spouseA() != null) out.add(u.spouseA());
        }
        return out;
    }
}
