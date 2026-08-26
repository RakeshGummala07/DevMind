package com.devmind.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Validates the JWT access token at the edge, once, so downstream services
 * don't each need their own copy of the validation logic. On success, the
 * raw token is left in place (services may still want it) and the resolved
 * identity is added as X-User-Id / X-User-Role headers, which downstream
 * services can trust because nothing outside the gateway can set them —
 * this filter strips any client-supplied values for those headers first.
 *
 * Public routes (registration, login, GitHub OAuth, refresh, actuator
 * health) skip validation entirely; everything else requires a valid token.
 */
@Component
public class JwtValidationFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/auth/register", "/api/auth/login", "/api/auth/refresh",
            "/api/auth/logout", "/api/auth/oauth", "/actuator"
    );

    private final SecretKey key;

    public JwtValidationFilter(@Value("${devmind.jwt-secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        if (PUBLIC_PREFIXES.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        ServerHttpRequest request = exchange.getRequest();
        String header = request.getHeaders().getFirst("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            return reject(exchange, "MISSING_TOKEN", "Authorization header is required");
        }

        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(header.substring(7))
                    .getPayload();

            ServerHttpRequest mutatedRequest = request.mutate()
                    // Strip any client-supplied identity headers before trusting our own —
                    // otherwise a caller could just set X-User-Role: ADMIN themselves.
                    .headers(headers -> {
                        headers.remove("X-User-Id");
                        headers.remove("X-User-Role");
                    })
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Role", claims.get("role", String.class))
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (JwtException | IllegalArgumentException e) {
            return reject(exchange, "INVALID_TOKEN", "Access token is invalid or expired");
        }
    }

    private Mono<Void> reject(ServerWebExchange exchange, String code, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
        String body = String.format(
                "{\"success\":false,\"error\":{\"code\":\"%s\",\"message\":\"%s\"}}", code, message);
        var buffer = exchange.getResponse().bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return 0; // after CorrelationIdFilter (-1), before routing
    }
}
