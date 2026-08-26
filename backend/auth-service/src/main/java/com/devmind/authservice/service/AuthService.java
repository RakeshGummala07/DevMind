package com.devmind.authservice.service;

import com.devmind.authservice.domain.User;
import com.devmind.authservice.dto.*;
import com.devmind.authservice.exception.AppException;
import com.devmind.authservice.repository.UserRepository;
import com.devmind.authservice.security.CryptoUtil;
import com.devmind.authservice.security.GithubOAuthClient;
import com.devmind.authservice.security.GithubOAuthClient.GithubProfile;
import com.devmind.authservice.security.JwtService;
import com.devmind.authservice.security.RefreshTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final GithubOAuthClient githubOAuthClient;
    private final CryptoUtil cryptoUtil;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            GithubOAuthClient githubOAuthClient,
            CryptoUtil cryptoUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.githubOAuthClient = githubOAuthClient;
        this.cryptoUtil = cryptoUtil;
    }

    public record AuthResult(User user, String accessToken, String rawRefreshToken) {}

    @Transactional
    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw AppException.conflict("EMAIL_ALREADY_REGISTERED", "An account with this email already exists");
        }
        User user = User.newLocalUser(request.email(), passwordEncoder.encode(request.password()), request.name());
        userRepository.save(user);
        return issueTokens(user);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> AppException.unauthorized("INVALID_CREDENTIALS", "Email or password is incorrect"));

        if (user.getPasswordHash() == null) {
            throw AppException.unauthorized("GITHUB_ONLY_ACCOUNT", "This account signs in with GitHub only");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw AppException.unauthorized("INVALID_CREDENTIALS", "Email or password is incorrect");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResult loginWithGithub(String code) {
        GithubProfile profile = githubOAuthClient.exchangeCodeForProfile(code);
        String encryptedToken = cryptoUtil.encrypt(profile.accessToken());

        User user = userRepository.findByGithubId(profile.id())
                .orElseGet(() -> {
                    // If a local account already exists with this email, link the GitHub identity
                    // to it instead of creating a duplicate user.
                    if (profile.email() != null) {
                        var existing = userRepository.findByEmail(profile.email());
                        if (existing.isPresent()) {
                            User linked = existing.get();
                            linked.setGithubId(profile.id());
                            linked.setGithubUsername(profile.login());
                            if (linked.getAvatarUrl() == null) linked.setAvatarUrl(profile.avatarUrl());
                            return linked;
                        }
                    }
                    String email = profile.email() != null ? profile.email() : profile.login() + "@users.noreply.github.com";
                    return userRepository.save(
                            User.newGithubUser(profile.id(), profile.login(), email, profile.name(), profile.avatarUrl()));
                });

        // Refresh the stored token on every login — GitHub tokens issued via the
        // web flow don't expire, but re-storing keeps this correct if that ever changes.
        user.setGithubAccessTokenEncrypted(encryptedToken);
        userRepository.save(user);

        return issueTokens(user);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null) {
            throw new AppException("MISSING_REFRESH_TOKEN", "No refresh token cookie present", HttpStatus.UNAUTHORIZED);
        }
        String userId = refreshTokenService.validateAndGetUserId(rawRefreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("USER_NOT_FOUND", "User no longer exists"));

        String newAccessToken = jwtService.issueAccessToken(user);
        String rotatedRefreshToken = refreshTokenService.rotate(rawRefreshToken, user);
        return new AuthResult(user, newAccessToken, rotatedRefreshToken);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null) {
            refreshTokenService.revoke(rawRefreshToken);
        }
    }

    public User getById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("USER_NOT_FOUND", "User no longer exists"));
    }

    private AuthResult issueTokens(User user) {
        String accessToken = jwtService.issueAccessToken(user);
        String rawRefreshToken = refreshTokenService.issue(user);
        return new AuthResult(user, accessToken, rawRefreshToken);
    }
}
