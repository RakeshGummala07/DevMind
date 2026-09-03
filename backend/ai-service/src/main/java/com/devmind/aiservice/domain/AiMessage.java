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

@Document(collection = "ai_messages")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiMessage {

    public enum Role { USER, ASSISTANT }

    @Id
    private String id;

    @Indexed
    private String conversationId;

    private Role role;
    private String content;
    private List<String> sources;
    private boolean grounded;
    private Instant createdAt;

    public static AiMessage user(String conversationId, String content) {
        AiMessage message = new AiMessage();
        message.id = UUID.randomUUID().toString();
        message.conversationId = conversationId;
        message.role = Role.USER;
        message.content = content;
        message.sources = List.of();
        message.grounded = true;
        message.createdAt = Instant.now();
        return message;
    }

    public static AiMessage assistant(String conversationId, String content, List<String> sources, boolean grounded) {
        AiMessage message = new AiMessage();
        message.id = UUID.randomUUID().toString();
        message.conversationId = conversationId;
        message.role = Role.ASSISTANT;
        message.content = content;
        message.sources = sources;
        message.grounded = grounded;
        message.createdAt = Instant.now();
        return message;
    }
}
