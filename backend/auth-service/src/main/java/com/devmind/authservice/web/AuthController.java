package com.devmind.authservice.web;

import com.devmind.authservice.dto.*;
import com.devmind.authservice.security.CookieUtil;
import com.devmind.authservice.service.AuthService;
import com.devmind.authservice.service.AuthService.AuthResult;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieUtil cookieUtil;
    private final String githubClientId;
    private final String githubRedirectUri;

    public AuthController(
            AuthService authService,
            CookieUtil cookieUtil,
            @Value("${devmind.github-client-id}") String githubClientId,
            @Value("${devmind.github-redirect-uri}") String githubRedirectUri
    ) {
        this.authService = authService;
        this.cookieUtil = cookieUtil;
        this.githubClientId = githubClientId;
        this.githubRedirectUri = githubRedirectUri;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResult result = authService.register(request);
        return withRefreshCookie(result, response, HttpStatus.CREATED, "Account created successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResult result = authService.login(request);
        return withRefreshCookie(result, response, HttpStatus.OK, "Signed in successfully");
    }

    @GetMapping("/oauth/github")
    public ResponseEntity<Void> redirectToGithub() {
        String authorizeUrl = "https://github.com/login/oauth/authorize"
                + "?client_id=" + githubClientId
                + "&redirect_uri=" + githubRedirectUri
                + "&scope=read:user%20user:email";
        return ResponseEntity.status(HttpStatus.FOUND).header("Location", authorizeUrl).build();
    }

    @PostMapping("/oauth/github/callback")
    public ResponseEntity<ApiResponse<AuthResponse>> githubCallback(@Valid @RequestBody GithubCallbackRequest request, HttpServletResponse response) {
        AuthResult result = authService.loginWithGithub(request.code());
        return withRefreshCookie(result, response, HttpStatus.OK, "Signed in with GitHub");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@CookieValue(name = CookieUtil.REFRESH_COOKIE_NAME, required = false) String refreshToken,
                                                               HttpServletResponse response) {
        AuthResult result = authService.refresh(refreshToken);
        return withRefreshCookie(result, response, HttpStatus.OK, "Token refreshed");
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@CookieValue(name = CookieUtil.REFRESH_COOKIE_NAME, required = false) String refreshToken,
                                                      HttpServletResponse response) {
        authService.logout(refreshToken);
        response.addCookie(cookieUtil.buildExpiredRefreshCookie());
        return ResponseEntity.ok(ApiResponse.ok(null, "Signed out"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(org.springframework.security.core.Authentication authentication) {
        var user = authService.getById(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(UserDto.from(user)));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> withRefreshCookie(AuthResult result, HttpServletResponse response, HttpStatus status, String message) {
        Cookie cookie = cookieUtil.buildRefreshCookie(result.rawRefreshToken());
        response.addCookie(cookie);
        AuthResponse body = new AuthResponse(UserDto.from(result.user()), result.accessToken());
        return ResponseEntity.status(status).body(ApiResponse.ok(body, message));
    }
}
