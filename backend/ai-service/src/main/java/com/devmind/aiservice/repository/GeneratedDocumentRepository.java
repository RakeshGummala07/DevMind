package com.devmind.aiservice.repository;

import com.devmind.aiservice.domain.DocType;
import com.devmind.aiservice.domain.GeneratedDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GeneratedDocumentRepository extends MongoRepository<GeneratedDocument, String> {

    Optional<GeneratedDocument> findFirstByRepositoryIdAndDocTypeOrderByGeneratedAtDesc(String repositoryId, DocType docType);

    List<GeneratedDocument> findByRepositoryIdOrderByGeneratedAtDesc(String repositoryId);
}
