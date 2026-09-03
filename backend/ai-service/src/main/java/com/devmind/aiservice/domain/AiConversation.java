package com.devmind.aiservice.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.UUID;

@Document(collection = "ai_conversations")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiConversation {

    @Id
    private String id;

    @Indexed
    private String repositoryId;

    @Indexed
    private String userId;

    private Instant createdAt;
    private Instant lastMessageAt;

    public static AiConversation start(String repositoryId, String userId) {
        AiConversation conversation = new AiConversation();
        conversation.id = UUID.randomUUID().toString();
        conversation.repositoryId = repositoryId;
        conversation.userId = userId;
        conversation.createdAt = Instant.now();
        conversation.lastMessageAt = conversation.createdAt;
        return conversation;
    }

    public void touch() {
        this.lastMessageAt = Instant.now();
    }
}
