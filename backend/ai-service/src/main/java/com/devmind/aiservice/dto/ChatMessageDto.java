package com.devmind.aiservice.dto;

import com.devmind.aiservice.domain.AiMessage;

import java.time.Instant;
import java.util.List;

public record ChatMessageDto(String role, String content, List<String> sources, boolean grounded, Instant createdAt) {
    public static ChatMessageDto from(AiMessage message) {
        return new ChatMessageDto(
                message.getRole().name().toLowerCase(),
                message.getContent(),
                message.getSources(),
                message.isGrounded(),
                message.getCreatedAt()
        );
    }
}
