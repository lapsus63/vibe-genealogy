package com.family.tree.domain.port.out;

import com.family.tree.domain.model.MediaAsset;

import java.io.InputStream;
import java.util.List;

/** Port de stockage des fichiers média rattachés à une personne. */
public interface MediaRepository {
    List<MediaAsset> list(String personId) throws Exception;

    MediaAsset store(String personId, String originalFilename, MediaAsset.Kind kind, InputStream content)
        throws Exception;

    void delete(String personId, String mediaId) throws Exception;

    InputStream open(String personId, String mediaId) throws Exception;
}
