package com.devmind.authservice.security;

import com.devmind.authservice.domain.RefreshToken;
import com.devmind.authservice.domain.User;
import com.devmind.authservice.exception.AppException;
import com.devmind.authservice.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * The refresh token is a random opaque value, not a JWT — the client only
 * ever holds the raw value (in an httpOnly cookie); the server only ever
 * stores its SHA-256 hash. This means a leaked database dump can't be used
 * to forge sessions, and logout can actually revoke a specific token instead
 * of just relying on short expiry.
 */
@Service
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final Duration refreshTokenTtl;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            @Value("${devmind.jwt-refresh-token-ttl-days}") long refreshTokenTtlDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenTtl = Duration.ofDays(refreshTokenTtlDays);
    }

    /** Issues a new raw refresh token and persists only its hash. Returns the raw value for the cookie. */
    public String issue(User user) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken token = RefreshToken.issue(user.getId(), hash(rawToken), Instant.now().plus(refreshTokenTtl));
        refreshTokenRepository.save(token);
        return rawToken;
    }

    /** Validates a raw refresh token and returns the userId it belongs to. Throws if invalid/expired/revoked. */
    public String validateAndGetUserId(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> AppException.unauthorized("INVALID_REFRESH_TOKEN", "Refresh token is invalid"));

        if (!token.isValid()) {
            throw new AppException("INVALID_REFRESH_TOKEN", "Refresh token has expired or been revoked", HttpStatus.UNAUTHORIZED);
        }
        return token.getUserId();
    }

    /** Rotation: revoke the presented token and issue a fresh one, so a stolen token can only be replayed once. */
    public String rotate(String oldRawToken, User user) {
        refreshTokenRepository.revokeByTokenHash(hash(oldRawToken));
        return issue(user);
    }

    public void revoke(String rawToken) {
        refreshTokenRepository.revokeByTokenHash(hash(rawToken));
    }

    public void revokeAllForUser(String userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
