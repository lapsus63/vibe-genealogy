package com.family.tree.adapter.in.rest;

import com.family.tree.domain.model.*;
import com.family.tree.domain.port.in.PersonEditing;
import com.family.tree.domain.port.in.RelationEditing;
import com.family.tree.domain.port.in.TreeQuery;
import com.family.tree.domain.port.out.MediaRepository;
import com.family.tree.domain.service.KinshipCalculator;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

/** Endpoints REST de l'arbre généalogique. */
@RestController
@RequestMapping("/api")
public class TreeController {

    private static final String DEFAULT_ROOT_ID = "I5";

    private final TreeQuery treeQuery;
    private final PersonEditing personEditing;
    private final RelationEditing relationEditing;
    private final MediaRepository media;
    private final KinshipCalculator kinship = new KinshipCalculator();

    public TreeController(TreeQuery q, PersonEditing p, RelationEditing r, MediaRepository m) {
        this.treeQuery = q;
        this.personEditing = p;
        this.relationEditing = r;
        this.media = m;
    }

    @GetMapping("/tree")
    public TreeGraphDto fullTree() {
        Genealogy g = treeQuery.fullTree();
        String root = pickRoot(g);
        return TreeGraphDto.of(g, root, g.allPersons().stream().map(Person::id).collect(Collectors.toSet()));
    }

    @GetMapping("/tree/expand")
    public TreeGraphDto expand(
        @RequestParam String rootId,
        @RequestParam(defaultValue = "3") int ascendants,
        @RequestParam(defaultValue = "2") int descendants,
        @RequestParam(defaultValue = "MIXED") String mode
    ) {
        var sub = treeQuery.expand(rootId, ascendants, descendants, mode);
        return TreeGraphDto.of(treeQuery.fullTree(), rootId, sub.personIds());
    }

    @GetMapping("/persons")
    public List<PersonDetailDto> allPersons() throws Exception {
        Genealogy g = treeQuery.fullTree();
        List<PersonDetailDto> out = new ArrayList<>();
        for (Person p : g.allPersons()) {
            out.add(PersonDetailDto.from(p, g, media.list(p.id())));
        }
        return out;
    }

    @GetMapping("/persons/{id}")
    public PersonDetailDto person(@PathVariable String id) throws Exception {
        Genealogy g = treeQuery.fullTree();
        Person p = g.person(id);
        if (p == null) throw new NoSuchElementException(id);
        return PersonDetailDto.from(p, g, media.list(id));
    }

    @PostMapping("/persons")
    public PersonDetailDto create(@RequestBody CreatePersonRequest req) throws Exception {
        Person p = personEditing.create(req.firstName(), req.lastName(), req.sex());
        return PersonDetailDto.from(p, treeQuery.fullTree(), List.of());
    }

    @PatchMapping("/persons/{id}")
    public PersonDetailDto update(@PathVariable String id, @RequestBody UpdatePersonRequest req) throws Exception {
        Person p = personEditing.update(id, req.firstName(), req.lastName(), req.sex(), req.biography(), req.occupation());
        return PersonDetailDto.from(p, treeQuery.fullTree(), media.list(id));
    }

    @DeleteMapping("/persons/{id}")
    public void delete(@PathVariable String id) {
        personEditing.delete(id);
    }

    @PostMapping("/relations/unions")
    public Map<String, String> createUnion(@RequestBody CreateUnionRequest req) {
        return Map.of("unionId", relationEditing.createUnion(req.spouseA(), req.spouseB()));
    }

    @PostMapping("/relations/unions/{unionId}/children/{childId}")
    public void addChild(@PathVariable String unionId, @PathVariable String childId) {
        relationEditing.addChild(unionId, childId);
    }

    @DeleteMapping("/relations/unions/{unionId}")
    public void deleteUnion(@PathVariable String unionId) {
        relationEditing.deleteUnion(unionId);
    }

    @GetMapping("/kinship")
    public KinshipCalculator.Kinship kinship(@RequestParam String fromId, @RequestParam String toId) {
        return kinship.compute(treeQuery.fullTree(), fromId, toId);
    }

    @GetMapping("/search")
    public List<PersonDetailDto> search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String place,
        @RequestParam(required = false) Integer yearFrom,
        @RequestParam(required = false) Integer yearTo
    ) throws Exception {
        Genealogy g = treeQuery.fullTree();
        String needle = q == null ? "" : q.toLowerCase();
        String placeNeedle = place == null ? "" : place.toLowerCase();
        List<PersonDetailDto> out = new ArrayList<>();
        for (Person p : g.allPersons()) {
            if (!matchesSearch(p, needle, placeNeedle, yearFrom, yearTo)) continue;
            out.add(PersonDetailDto.from(p, g, media.list(p.id())));
        }
        return out;
    }

    @PostMapping("/persons/{id}/media")
    public MediaAsset uploadMedia(@PathVariable String id, @RequestParam("file") MultipartFile file) throws Exception {
        var kind = detectKind(file.getContentType());
        return media.store(id, file.getOriginalFilename(), kind, file.getInputStream());
    }

    @DeleteMapping("/media/{personId}/{mediaId}")
    public void deleteMedia(@PathVariable String personId, @PathVariable String mediaId) throws Exception {
        media.delete(personId, mediaId);
    }

    @GetMapping("/media/{personId}/{filename:.+}")
    public ResponseEntity<InputStreamResource> serveMedia(
        @PathVariable String personId,
        @PathVariable String filename
    ) throws Exception {
        int dot = filename.lastIndexOf('.');
        String id = dot > 0 ? filename.substring(0, dot) : filename;
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .body(new InputStreamResource(media.open(personId, id)));
    }

    /** Racine stable : I5 si présent, sinon plus petit id lexicographique. */
    static String pickRoot(Genealogy g) {
        if (g.person(DEFAULT_ROOT_ID) != null) return DEFAULT_ROOT_ID;
        return g.allPersons().stream()
            .map(Person::id)
            .sorted()
            .findFirst()
            .orElse(null);
    }

    private static boolean matchesSearch(
        Person p, String needle, String placeNeedle, Integer yearFrom, Integer yearTo
    ) {
        if (!needle.isEmpty()) {
            String hay = (p.firstName() + " " + p.lastName() + " "
                + Optional.ofNullable(p.biography()).orElse("") + " "
                + Optional.ofNullable(p.occupation()).orElse("")).toLowerCase();
            if (!hay.contains(needle)) return false;
        }
        if (!placeNeedle.isEmpty()) {
            String places = p.events().stream()
                .map(e -> Optional.ofNullable(e.place()).orElse(""))
                .collect(Collectors.joining(" "))
                .toLowerCase();
            if (!places.contains(placeNeedle)) return false;
        }
        Integer by = yearOf(p.birthEvent());
        Integer dy = yearOf(p.deathEvent());
        if (yearFrom != null) {
            if ((by == null || by < yearFrom) && (dy == null || dy < yearFrom)) return false;
        }
        if (yearTo != null) {
            if (by != null && by > yearTo) return false;
        }
        return true;
    }

    private static Integer yearOf(PersonEvent e) {
        if (e == null || e.date() == null) return null;
        return e.date().year();
    }

    private MediaAsset.Kind detectKind(String mime) {
        if (mime == null) return MediaAsset.Kind.document;
        if (mime.startsWith("image/")) return MediaAsset.Kind.photo;
        if (mime.startsWith("audio/")) return MediaAsset.Kind.audio;
        if (mime.startsWith("video/")) return MediaAsset.Kind.video;
        return MediaAsset.Kind.document;
    }

    // ---- DTOs & requêtes -----------------------------------------------

    public record CreatePersonRequest(String firstName, String lastName, Sex sex) {}
    public record UpdatePersonRequest(String firstName, String lastName, Sex sex, String biography, String occupation) {}
    public record CreateUnionRequest(String spouseA, String spouseB) {}

    public record GeoPointDto(double lat, double lng) {}

    public record EventDto(
        String id,
        String type,
        String date,
        String place,
        GeoPointDto geo,
        String description,
        List<String> citationIds
    ) {
        static EventDto from(PersonEvent e) {
            return new EventDto(
                e.id(),
                e.type().name(),
                e.date() != null ? e.date().raw() : null,
                e.place(),
                null,
                e.description(),
                null
            );
        }
    }

    public record SourceDto(
        String id, String title, String author, String publication, String repository, String url
    ) {}

    public record CitationDto(
        String id, String sourceId, String page, String note, String scanUrl
    ) {}

    public record NodeDto(
        String id, String firstName, String lastName, String sex,
        String birth, String death, String photoUrl
    ) {
        static NodeDto from(Person p) {
            var b = p.birthEvent();
            var d = p.deathEvent();
            return new NodeDto(
                p.id(), p.firstName(), p.lastName(), p.sex().name(),
                b != null && b.date() != null ? b.date().raw() : null,
                d != null && d.date() != null ? d.date().raw() : null,
                null
            );
        }
    }

    public record EdgeDto(String id, String type, String source, String target, String unionId) {}

    public record TreeGraphDto(String rootId, List<NodeDto> nodes, List<EdgeDto> edges) {
        static TreeGraphDto of(Genealogy g, String rootId, Set<String> keep) {
            var nodes = g.allPersons().stream().filter(p -> keep.contains(p.id())).map(NodeDto::from).toList();
            List<EdgeDto> edges = new ArrayList<>();
            for (Union u : g.allUnions()) {
                if (u.spouseA() != null && u.spouseB() != null
                    && keep.contains(u.spouseA()) && keep.contains(u.spouseB())) {
                    edges.add(new EdgeDto("u-" + u.id(), "SPOUSE", u.spouseA(), u.spouseB(), u.id()));
                }
                for (String c : u.children()) {
                    if (!keep.contains(c)) continue;
                    if (u.spouseA() != null && keep.contains(u.spouseA())) {
                        edges.add(new EdgeDto("p-" + u.id() + "-" + c + "-a", "PARENT_CHILD", u.spouseA(), c, u.id()));
                    }
                    if (u.spouseB() != null && keep.contains(u.spouseB())) {
                        edges.add(new EdgeDto("p-" + u.id() + "-" + c + "-b", "PARENT_CHILD", u.spouseB(), c, u.id()));
                    }
                }
            }
            return new TreeGraphDto(rootId, nodes, edges);
        }
    }

    public record PersonDetailDto(
        String id, String firstName, String lastName, String sex,
        String birth, String birthPlace, GeoPointDto birthGeo,
        String death, String deathPlace, GeoPointDto deathGeo,
        String occupation, String biography,
        List<EventDto> events, List<MediaAsset> media,
        List<CitationDto> citations, List<SourceDto> sources,
        List<String> parents, List<String> spouses, List<String> children
    ) {
        static PersonDetailDto from(Person p, Genealogy g, List<MediaAsset> media) {
            var b = p.birthEvent();
            var d = p.deathEvent();
            return new PersonDetailDto(
                p.id(), p.firstName(), p.lastName(), p.sex().name(),
                b != null && b.date() != null ? b.date().raw() : null,
                b != null ? b.place() : null,
                null,
                d != null && d.date() != null ? d.date().raw() : null,
                d != null ? d.place() : null,
                null,
                p.occupation(), p.biography(),
                p.events().stream().map(EventDto::from).toList(),
                media,
                List.of(),
                List.of(),
                g.parentsOf(p.id()), g.spousesOf(p.id()), g.childrenOf(p.id())
            );
        }
    }
}
