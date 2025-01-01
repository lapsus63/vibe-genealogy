package com.family.tree.adapter.out.persistence;

import com.family.tree.adapter.out.gedcom.GedcomFileAdapter;
import com.family.tree.domain.model.Genealogy;
import com.family.tree.domain.port.out.TreeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.time.Instant;

/**
 * Cache mémoire de {@link Genealogy} + persistance fichier.
 * <ul>
 *   <li>{@code save} marque dirty et append un dump JSON dans le WAL</li>
 *   <li>un scheduler écrit atomiquement {@code data/tree.ged} puis purge le WAL</li>
 * </ul>
 */
@Component
public class InMemoryTreeRepository implements TreeRepository {

    private static final Logger log = LoggerFactory.getLogger(InMemoryTreeRepository.class);

    private final Path dataDir;
    private final Path treeFile;
    private final Path walDir;
    private final GedcomFileAdapter gedcom;
    private final ObjectMapper mapper = new ObjectMapper();

    private Genealogy genealogy = new Genealogy();
    private volatile boolean dirty;

    public InMemoryTreeRepository(
        @Value("${app.data-dir}") String dataDir,
        GedcomFileAdapter gedcom
    ) {
        this.dataDir = Path.of(dataDir).toAbsolutePath().normalize();
        this.treeFile = this.dataDir.resolve("tree.ged");
        this.walDir = this.dataDir.resolve("wal");
        this.gedcom = gedcom;
    }

    @PostConstruct
    public void init() throws Exception {
        Files.createDirectories(dataDir);
        Files.createDirectories(walDir);
        Files.createDirectories(dataDir.resolve("media"));

        if (!Files.exists(treeFile)) {
            log.info("Aucun {} — copie du bootstrap classpath", treeFile);
            try (InputStream in = new ClassPathResource("bootstrap/tree.ged").getInputStream()) {
                Files.copy(in, treeFile);
            }
        }

        try (InputStream in = Files.newInputStream(treeFile)) {
            genealogy = gedcom.loadFresh(in);
            log.info("Arbre chargé : {} personnes, {} unions",
                genealogy.allPersons().size(), genealogy.allUnions().size());
        }

        replayWalIfPresent();
    }

    @Override
    public synchronized Genealogy load() {
        return genealogy;
    }

    @Override
    public synchronized void save(Genealogy g) {
        this.genealogy = g;
        this.dirty = true;
        try {
            Path walFile = walDir.resolve("pending-" + Instant.now().toEpochMilli() + ".json");
            try (OutputStream out = Files.newOutputStream(walFile)) {
                mapper.writeValue(out, g);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Échec écriture WAL", e);
        }
    }

    @Scheduled(fixedDelayString = "${app.persistence.snapshot-interval-seconds:30}000")
    public synchronized void snapshotIfDirty() {
        if (!dirty) return;
        try {
            Path tmp = treeFile.resolveSibling("tree.ged.tmp");
            try (OutputStream out = Files.newOutputStream(tmp)) {
                gedcom.write(genealogy, out);
            }
            try {
                Files.move(tmp, treeFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(tmp, treeFile, StandardCopyOption.REPLACE_EXISTING);
            }
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(walDir, "pending-*.json")) {
                for (Path p : stream) Files.deleteIfExists(p);
            }
            dirty = false;
            log.debug("Snapshot GEDCOM écrit ({})", treeFile);
        } catch (Exception e) {
            log.error("Échec snapshot GEDCOM", e);
        }
    }

    private void replayWalIfPresent() throws Exception {
        Path latest = null;
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(walDir, "pending-*.json")) {
            for (Path p : stream) {
                if (latest == null || Files.getLastModifiedTime(p).compareTo(Files.getLastModifiedTime(latest)) > 0) {
                    latest = p;
                }
            }
        }
        if (latest == null) return;
        log.warn("Rejeu WAL détecté : {}", latest.getFileName());
        genealogy = mapper.readValue(latest.toFile(), Genealogy.class);
        dirty = true;
        snapshotIfDirty();
    }
}
