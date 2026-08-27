package com.devmind.authservice.web;

import com.devmind.authservice.exception.AppException;
import com.devmind.authservice.repository.UserRepository;
import com.devmind.authservice.security.CryptoUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/users")
public class InternalUserController {

    private final UserRepository userRepository;
    private final CryptoUtil cryptoUtil;
    private final String internalApiKey;

    public InternalUserController(
            UserRepository userRepository,
            CryptoUtil cryptoUtil,
            @Value("${devmind.internal-api-key}") String internalApiKey
    ) {
        this.userRepository = userRepository;
        this.cryptoUtil = cryptoUtil;
        this.internalApiKey = internalApiKey;
    }

    public record GithubTokenResponse(String githubAccessToken, String githubUsername) {}

    @GetMapping("/{userId}/github-token")
    public ResponseEntity<GithubTokenResponse> getGithubToken(
            @PathVariable String userId,
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String providedKey
    ) {
        if (internalApiKey == null || internalApiKey.isBlank() || !internalApiKey.equals(providedKey)) {
            throw AppException.unauthorized("INVALID_INTERNAL_KEY", "Missing or invalid internal API key");
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("USER_NOT_FOUND", "User does not exist"));

        if (user.getGithubAccessTokenEncrypted() == null) {
            throw AppException.badRequest("GITHUB_NOT_CONNECTED", "User has not connected a GitHub account");
        }

        String rawToken = cryptoUtil.decrypt(user.getGithubAccessTokenEncrypted());
        return ResponseEntity.ok(new GithubTokenResponse(rawToken, user.getGithubUsername()));
    }
}
