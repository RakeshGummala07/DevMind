package com.devmind.aiservice.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Document(collection = "generated_documents")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GeneratedDocument {

    @Id
    private String id;

    @Indexed
    private String repositoryId;

    private DocType docType;
    private String content; // Markdown
    private List<String> sources; // "path:startLine-endLine", same shape as AiMessage.sources
    private boolean grounded;
    private String generatedByUserId;
    private Instant generatedAt;

    public static GeneratedDocument create(
            String repositoryId, DocType docType, String content,
            List<String> sources, boolean grounded, String generatedByUserId
    ) {
        GeneratedDocument doc = new GeneratedDocument();
        doc.id = UUID.randomUUID().toString();
        doc.repositoryId = repositoryId;
        doc.docType = docType;
        doc.content = content;
        doc.sources = sources;
        doc.grounded = grounded;
        doc.generatedByUserId = generatedByUserId;
        doc.generatedAt = Instant.now();
        return doc;
    }
}
