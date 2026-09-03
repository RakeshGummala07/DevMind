package com.devmind.aiservice.web;

import com.devmind.aiservice.dto.ChatMessageDto;
import com.devmind.aiservice.dto.ChatRequest;
import com.devmind.aiservice.dto.ChatResponseDto;
import com.devmind.aiservice.dto.SearchResultDto;
import com.devmind.aiservice.service.ChatService;
import com.devmind.aiservice.service.SearchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories/{repositoryId}")
public class AiController {

    private final ChatService chatService;
    private final SearchService searchService;

    public AiController(ChatService chatService, SearchService searchService) {
        this.chatService = chatService;
        this.searchService = searchService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<ChatResponseDto>> ask(
            @PathVariable String repositoryId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ChatRequest request
    ) {
        ChatResponseDto response = chatService.ask(repositoryId, userId, request.message());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/chat")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> history(
            @PathVariable String repositoryId,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(chatService.history(repositoryId, userId)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<SearchResultDto>>> search(
            @PathVariable String repositoryId,
            @RequestParam("q") String query
    ) {
        return ResponseEntity.ok(ApiResponse.ok(searchService.search(repositoryId, query)));
    }
}
