package com.devmind.aiservice.dto;

import com.devmind.aiservice.domain.GeneratedDocument;

import java.time.Instant;

public record GeneratedDocumentDto(
        String id, String docType, String content, boolean grounded, Instant generatedAt
) {
    public static GeneratedDocumentDto from(GeneratedDocument doc) {
        return new GeneratedDocumentDto(
                doc.getId(), doc.getDocType().name(), doc.getContent(), doc.isGrounded(), doc.getGeneratedAt()
        );
    }
}
