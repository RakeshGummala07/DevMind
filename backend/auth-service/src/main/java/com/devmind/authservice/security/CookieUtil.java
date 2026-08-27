package com.devmind.authservice.security;

import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    public static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final long refreshTokenTtlDays;

    public CookieUtil(@Value("${devmind.jwt-refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this.refreshTokenTtlDays = refreshTokenTtlDays;
    }

    public Cookie buildRefreshCookie(String rawToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, rawToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) java.time.Duration.ofDays(refreshTokenTtlDays).toSeconds());
        cookie.setAttribute("SameSite", "Lax");
        return cookie;
    }

    public Cookie buildExpiredRefreshCookie() {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        return cookie;
    }
}
