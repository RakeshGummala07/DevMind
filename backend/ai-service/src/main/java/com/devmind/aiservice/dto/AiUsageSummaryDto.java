package com.devmind.aiservice.dto;

public record AiUsageSummaryDto(
        long conversationCount, long messageCount,
        long groundedAnswerCount, long ungroundedAnswerCount
) {}
