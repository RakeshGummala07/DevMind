package com.devmind.aiservice.repository;

import com.devmind.aiservice.domain.AiConversation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AiConversationRepository extends MongoRepository<AiConversation, String> {
    Optional<AiConversation> findByRepositoryIdAndUserId(String repositoryId, String userId);
}
