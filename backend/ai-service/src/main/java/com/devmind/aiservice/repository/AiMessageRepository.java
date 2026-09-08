package com.devmind.aiservice.repository;

import com.devmind.aiservice.domain.AiMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AiMessageRepository extends MongoRepository<AiMessage, String> {
    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);
    List<AiMessage> findByConversationIdIn(List<String> conversationIds);
}
