package com.devmind.ingestionservice.service;

import com.devmind.ingestionservice.exception.AppException;
import org.eclipse.jgit.api.Git;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class GitCloneService {

    private static final Logger log = LoggerFactory.getLogger(GitCloneService.class);

    private final Path workspaceRoot;

    public GitCloneService(@Value("${devmind.workspace-dir}") String workspaceDir) {
        this.workspaceRoot = Path.of(workspaceDir);
    }

    public Path clone(String githubFullName, String defaultBranch, String githubAccessToken) {
        try {
            Files.createDirectories(workspaceRoot);
        } catch (IOException e) {
            throw new AppException("WORKSPACE_UNAVAILABLE", "Could not create ingestion workspace directory", org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }

        Path target = workspaceRoot.resolve(UUID.randomUUID().toString());
        String cloneUrl = "https://github.com/" + githubFullName + ".git";

        log.info("Cloning {} (branch {}) into {}", githubFullName, defaultBranch, target);

        try (Git ignored = Git.cloneRepository()
                .setURI(cloneUrl)
                .setDirectory(target.toFile())
                .setBranch(defaultBranch)
                .setDepth(1)
                .setCredentialsProvider(new UsernamePasswordCredentialsProvider(githubAccessToken, ""))
                .call()) {
            return target;
        } catch (Exception e) {
            log.error("Failed to clone {}: {}", githubFullName, e.getMessage());
            deleteQuietly(target);
            throw AppException.badRequest("GIT_CLONE_FAILED", "Could not clone " + githubFullName + ": " + e.getMessage());
        }
    }

    public void cleanup(Path checkoutDir) {
        deleteQuietly(checkoutDir);
    }

    private void deleteQuietly(Path dir) {
        if (dir == null || !Files.exists(dir)) return;
        try (var walk = Files.walk(dir)) {
            walk.sorted((a, b) -> b.compareTo(a))
                    .forEach(p -> {
                        try {
                            Files.deleteIfExists(p);
                        } catch (IOException ignored) {

                        }
                    });
        } catch (IOException e) {
            log.warn("Could not fully clean up {}: {}", dir, e.getMessage());
        }
    }
}
