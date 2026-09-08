package com.devmind.notificationservice.dto;

import java.util.Set;

public record NotificationPreferenceDto(Set<String> mutedTypes) {}
