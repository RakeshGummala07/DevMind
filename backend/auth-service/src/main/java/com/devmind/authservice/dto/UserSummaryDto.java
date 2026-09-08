package com.devmind.authservice.dto;

import com.devmind.authservice.domain.User;

import java.time.Instant;

public record UserSummaryDto(
        String id, String name, String email, String avatarUrl,
        String githubUsername, String role, Instant createdAt
) {
    public static UserSummaryDto from(User u) {
        return new UserSummaryDto(
                u.getId(), u.getName(), u.getEmail(), u.getAvatarUrl(),
                u.getGithubUsername(), u.getRole().name(), u.getCreatedAt()
        );
    }
}
