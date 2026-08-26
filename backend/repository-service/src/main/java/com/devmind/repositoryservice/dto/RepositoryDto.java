package com.devmind.repositoryservice.dto;

import com.devmind.repositoryservice.domain.IndexingStatus;
import com.devmind.repositoryservice.domain.Repository;

import java.time.Instant;

public record RepositoryDto(
        String id, String fullName, String name, String owner, String description,
        String htmlUrl, String defaultBranch, String primaryLanguage, boolean isPrivate,
        int starsCount, int forksCount, IndexingStatus indexingStatus, Instant createdAt
) {
    public static RepositoryDto from(Repository r) {
        return new RepositoryDto(
                r.getId(), r.getFullName(), r.getName(), r.getOwner(), r.getDescription(),
                r.getHtmlUrl(), r.getDefaultBranch(), r.getPrimaryLanguage(), r.isPrivate(),
                r.getStarsCount(), r.getForksCount(), r.getIndexingStatus(), r.getCreatedAt()
        );
    }
}
