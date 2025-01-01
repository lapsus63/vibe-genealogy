package com.family.tree.domain.port.in;

import com.family.tree.domain.model.Person;
import com.family.tree.domain.model.Sex;

/** Cas d'usage d'édition d'une personne. */
public interface PersonEditing {
    Person create(String firstName, String lastName, Sex sex);
    Person update(String id, String firstName, String lastName, Sex sex, String biography, String occupation);
    void delete(String id);
}
