package com.devmind.authservice.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "github_id", unique = true)
    private Long githubId;

    @Column(name = "github_username")
    private String githubUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role = Role.USER;

    @Column(name = "github_access_token_encrypted", columnDefinition = "TEXT")
    private String githubAccessTokenEncrypted;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static User newLocalUser(String email, String passwordHash, String name) {
        User user = new User();
        user.id = UUID.randomUUID().toString();
        user.email = email;
        user.passwordHash = passwordHash;
        user.name = name;
        user.role = Role.USER;
        Instant now = Instant.now();
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }

    public static User newGithubUser(Long githubId, String githubUsername, String email, String name, String avatarUrl) {
        User user = new User();
        user.id = UUID.randomUUID().toString();
        user.githubId = githubId;
        user.githubUsername = githubUsername;
        user.email = email;
        user.name = name;
        user.avatarUrl = avatarUrl;
        user.role = Role.USER;
        Instant now = Instant.now();
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
