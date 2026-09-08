package com.devmind.aiservice.service;

import com.devmind.aiservice.domain.AiConversation;
import com.devmind.aiservice.domain.AiMessage;
import com.devmind.aiservice.dto.AiUsageSummaryDto;
import com.devmind.aiservice.repository.AiConversationRepository;
import com.devmind.aiservice.repository.AiMessageRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiUsageAnalyticsService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    public AiUsageAnalyticsService(AiConversationRepository conversationRepository, AiMessageRepository messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    public AiUsageSummaryDto summary(String repositoryId) {
        List<AiConversation> conversations = conversationRepository.findByRepositoryId(repositoryId);
        List<String> conversationIds = conversations.stream().map(AiConversation::getId).toList();

        List<AiMessage> messages = conversationIds.isEmpty() ? List.of() : messageRepository.findByConversationIdIn(conversationIds);

        long assistantGrounded = messages.stream()
                .filter(m -> m.getRole() == AiMessage.Role.ASSISTANT && m.isGrounded())
                .count();
        long assistantUngrounded = messages.stream()
                .filter(m -> m.getRole() == AiMessage.Role.ASSISTANT && !m.isGrounded())
                .count();

        return new AiUsageSummaryDto(conversations.size(), messages.size(), assistantGrounded, assistantUngrounded);
    }
}
