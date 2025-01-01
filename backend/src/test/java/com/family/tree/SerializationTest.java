package com.family.tree;

import com.family.tree.domain.model.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SerializationTest {

    private ObjectMapper mapper = new ObjectMapper();

    private Genealogy sample() {
        Genealogy g = new Genealogy();
        Person a = new Person("A", "Jean", "Dupont", Sex.M);
        Person b = new Person("B", "Marie", "Martin", Sex.F);
        Person c = new Person("C", "Pierre", "Dupont", Sex.M);
        a.events().add(new PersonEvent("A-BIRTH", EventType.BIRTH, ApproximateDate.of("1900"), "Paris", null));
        g.addPerson(a); g.addPerson(b); g.addPerson(c);
        Union u1 = new Union("U1", "A", "B"); u1.children().add("C");
        u1.events().add(new PersonEvent("U1-MARR", EventType.MARRIAGE, ApproximateDate.of("1920"), "Lyon", null));
        g.addUnion(u1);
        return g;
    }

    @Test void roundTripGenealogy() throws Exception {
        Genealogy original = sample();
        String json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(original);
        assertNotNull(json);
        Genealogy restored = mapper.readValue(json, Genealogy.class);

        assertEquals(3, restored.allPersons().size());
        assertEquals(1, restored.allUnions().size());

        Person ra = restored.person("A");
        assertNotNull(ra);
        assertEquals("Jean", ra.firstName());
        assertEquals("Dupont", ra.lastName());
        assertEquals(Sex.M, ra.sex());
        assertEquals(1, ra.events().size());
        assertEquals(EventType.BIRTH, ra.events().get(0).type());
        assertEquals("Paris", ra.events().get(0).place());

        Union ru1 = restored.union("U1");
        assertNotNull(ru1);
        assertEquals("A", ru1.spouseA());
        assertEquals("B", ru1.spouseB());
        assertTrue(ru1.children().contains("C"));
        assertEquals(1, ru1.events().size());
        assertEquals(EventType.MARRIAGE, ru1.events().get(0).type());
        assertEquals("Lyon", ru1.events().get(0).place());
    }
}
