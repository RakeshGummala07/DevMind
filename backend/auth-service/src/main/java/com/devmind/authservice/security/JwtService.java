package com.devmind.authservice.security;

import com.devmind.authservice.domain.Role;
import com.devmind.authservice.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

/**
 * Issues and validates the short-lived JWT access token. This token is what
 * the frontend attaches as `Authorization: Bearer ...` and what the API
 * gateway validates on every request to a protected route (see
 * api-gateway's JwtValidationFilter, which uses the same secret and claim
 * shape so the two never drift apart).
 *
 * The refresh token is deliberately NOT a JWT — see RefreshTokenService.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final Duration accessTokenTtl;

    public JwtService(
            @Value("${devmind.jwt-secret}") String secret,
            @Value("${devmind.jwt-access-token-ttl-minutes}") long accessTokenTtlMinutes
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenTtl = Duration.ofMinutes(accessTokenTtlMinutes);
    }

    public String issueAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .signWith(key)
                .compact();
    }

    public Claims parseAndValidate(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseAndValidate(token).getSubject();
    }

    public Role extractRole(String token) {
        return Role.valueOf(parseAndValidate(token).get("role", String.class));
    }
}
