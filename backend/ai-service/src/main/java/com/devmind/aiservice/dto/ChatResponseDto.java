package com.devmind.aiservice.dto;

import java.util.List;

public record ChatResponseDto(
        String conversationId,
        String answer,
        List<SourceDto> sources,
        boolean grounded
) {}
