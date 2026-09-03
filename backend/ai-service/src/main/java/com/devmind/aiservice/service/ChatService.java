package com.devmind.aiservice.service;

import com.devmind.aiservice.domain.AiConversation;
import com.devmind.aiservice.domain.AiMessage;
import com.devmind.aiservice.dto.ChatMessageDto;
import com.devmind.aiservice.dto.ChatResponseDto;
import com.devmind.aiservice.dto.SourceDto;
import com.devmind.aiservice.repository.AiConversationRepository;
import com.devmind.aiservice.repository.AiMessageRepository;
import com.devmind.aiservice.service.RagService.GroundedAnswer;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    private final RagService ragService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    public ChatService(RagService ragService, AiConversationRepository conversationRepository, AiMessageRepository messageRepository) {
        this.ragService = ragService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    public ChatResponseDto ask(String repositoryId, String userId, String question) {
        AiConversation conversation = conversationRepository.findByRepositoryIdAndUserId(repositoryId, userId)
                .orElseGet(() -> conversationRepository.save(AiConversation.start(repositoryId, userId)));

        messageRepository.save(AiMessage.user(conversation.getId(), question));

        GroundedAnswer answer = ragService.answer(repositoryId, question);

        List<String> sourcePaths = answer.usedChunks().stream()
                .map(chunk -> chunk.filePath() + ":" + chunk.startLine() + "-" + chunk.endLine())
                .distinct()
                .toList();

        messageRepository.save(AiMessage.assistant(conversation.getId(), answer.text(), sourcePaths, answer.grounded()));

        conversation.touch();
        conversationRepository.save(conversation);

        List<SourceDto> sources = answer.usedChunks().stream()
                .map(chunk -> new SourceDto(chunk.filePath(), chunk.githubFullName(), chunk.startLine(), chunk.endLine()))
                .distinct()
                .toList();

        return new ChatResponseDto(conversation.getId(), answer.text(), sources, answer.grounded());
    }

    public List<ChatMessageDto> history(String repositoryId, String userId) {
        return conversationRepository.findByRepositoryIdAndUserId(repositoryId, userId)
                .map(conversation -> messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                        .stream().map(ChatMessageDto::from).toList())
                .orElse(List.of());
    }
}
