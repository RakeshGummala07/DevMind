package com.devmind.aiservice.web;

import com.devmind.aiservice.dto.AiConfigDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Read-only — the actual provider/model is set via AI_PROVIDER/AI_MODEL/EMBEDDING_MODEL
 * env vars at deploy time, not changeable at runtime. This just lets the Settings page
 * show what's actually configured instead of the frontend guessing or hardcoding it.
 */
@RestController
@RequestMapping("/api/config")
public class AiConfigController {

    private final String aiProvider;
    private final String aiModel;
    private final String embeddingModel;

    public AiConfigController(
            @Value("${devmind.ai-provider}") String aiProvider,
            @Value("${devmind.ai-model}") String aiModel,
            @Value("${devmind.embedding-model}") String embeddingModel
    ) {
        this.aiProvider = aiProvider;
        this.aiModel = aiModel;
        this.embeddingModel = embeddingModel;
    }

    @GetMapping
    public ApiResponse<AiConfigDto> get() {
        return ApiResponse.ok(new AiConfigDto(aiProvider, aiModel, embeddingModel));
    }
}
