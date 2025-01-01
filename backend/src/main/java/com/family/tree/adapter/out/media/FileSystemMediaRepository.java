package com.family.tree.adapter.out.media;

import com.family.tree.domain.model.MediaAsset;
import com.family.tree.domain.port.out.MediaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.file.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;

/** Stockage des médias sous {@code data/media/{personId}/}. */
@Component
public class FileSystemMediaRepository implements MediaRepository {

    private final Path mediaRoot;

    public FileSystemMediaRepository(@Value("${app.data-dir}") String dataDir) {
        this.mediaRoot = Path.of(dataDir, "media").toAbsolutePath().normalize();
    }

    @Override
    public List<MediaAsset> list(String personId) throws Exception {
        Path dir = mediaRoot.resolve(safe(personId));
        if (!Files.isDirectory(dir)) return List.of();
        List<MediaAsset> out = new ArrayList<>();
        try (Stream<Path> stream = Files.list(dir)) {
            stream.filter(Files::isRegularFile).sorted().forEach(p -> {
                String filename = p.getFileName().toString();
                int dot = filename.lastIndexOf('.');
                String id = dot > 0 ? filename.substring(0, dot) : filename;
                String ext = dot > 0 ? filename.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
                out.add(new MediaAsset(
                    id,
                    "/api/media/" + personId + "/" + filename,
                    null,
                    null,
                    kindFromExt(ext)
                ));
            });
        }
        return out;
    }

    @Override
    public MediaAsset store(String personId, String originalFilename, MediaAsset.Kind kind, InputStream content)
        throws Exception {
        Path dir = mediaRoot.resolve(safe(personId));
        Files.createDirectories(dir);
        String ext = extensionOf(originalFilename);
        String id = UUID.randomUUID().toString().substring(0, 8);
        String filename = id + (ext.isEmpty() ? "" : "." + ext);
        Path target = dir.resolve(filename);
        Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        return new MediaAsset(
            id,
            "/api/media/" + personId + "/" + filename,
            originalFilename,
            Instant.now().toString(),
            kind
        );
    }

    @Override
    public void delete(String personId, String mediaId) throws Exception {
        Path dir = mediaRoot.resolve(safe(personId));
        if (!Files.isDirectory(dir)) return;
        try (Stream<Path> stream = Files.list(dir)) {
            stream.filter(p -> {
                String name = p.getFileName().toString();
                return name.equals(mediaId) || name.startsWith(mediaId + ".");
            }).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (Exception ignored) {
                    /* best effort */
                }
            });
        }
    }

    @Override
    public InputStream open(String personId, String mediaId) throws Exception {
        Path dir = mediaRoot.resolve(safe(personId));
        if (!Files.isDirectory(dir)) throw new NoSuchFileException(mediaId);
        try (Stream<Path> stream = Files.list(dir)) {
            Path match = stream
                .filter(p -> {
                    String name = p.getFileName().toString();
                    return name.equals(mediaId) || name.startsWith(mediaId + ".");
                })
                .findFirst()
                .orElseThrow(() -> new NoSuchFileException(mediaId));
            return Files.newInputStream(match);
        }
    }

    private static String safe(String personId) {
        return personId.replaceAll("[^A-Za-z0-9_-]", "_");
    }

    private static String extensionOf(String name) {
        if (name == null) return "";
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return "";
        return name.substring(dot + 1).replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT);
    }

    private static MediaAsset.Kind kindFromExt(String ext) {
        return switch (ext) {
            case "jpg", "jpeg", "png", "gif", "webp", "bmp" -> MediaAsset.Kind.photo;
            case "mp3", "wav", "ogg", "m4a", "flac" -> MediaAsset.Kind.audio;
            case "mp4", "webm", "mov", "avi", "mkv" -> MediaAsset.Kind.video;
            default -> MediaAsset.Kind.document;
        };
    }
}
