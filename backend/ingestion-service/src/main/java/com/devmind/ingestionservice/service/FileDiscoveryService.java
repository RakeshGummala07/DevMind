package com.devmind.ingestionservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class FileDiscoveryService {

    private static final Set<String> IGNORED_DIR_NAMES = Set.of(
            ".git", "node_modules", "target", "build", "dist", "coverage",
            ".idea", ".vscode", "__pycache__", ".venv", "venv", ".next", "vendor"
    );

    private static final Set<String> IGNORED_FILE_NAMES = Set.of(
            "package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml",
            "composer.lock", "Gemfile.lock", "poetry.lock", "Pipfile.lock",
            "Cargo.lock", "go.sum", "mix.lock"
    );

    // Extension -> language label stored in each chunk's metadata (see ChunkingService).
    private static final Map<String, String> LANGUAGE_BY_EXTENSION = Map.ofEntries(
            Map.entry("java", "Java"), Map.entry("js", "JavaScript"), Map.entry("jsx", "JavaScript"),
            Map.entry("ts", "TypeScript"), Map.entry("tsx", "TypeScript"), Map.entry("py", "Python"),
            Map.entry("cpp", "C++"), Map.entry("cc", "C++"), Map.entry("h", "C++"), Map.entry("hpp", "C++"),
            Map.entry("go", "Go"), Map.entry("sql", "SQL"), Map.entry("html", "HTML"), Map.entry("css", "CSS"),
            Map.entry("json", "JSON"), Map.entry("yml", "YAML"), Map.entry("yaml", "YAML"), Map.entry("md", "Markdown")
    );

    private final long maxFileSizeBytes;

    public FileDiscoveryService(@Value("${devmind.max-file-size-bytes}") long maxFileSizeBytes) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public record DiscoveredFile(Path absolutePath, String relativePath, String language) {}

    public List<DiscoveredFile> discover(Path repoRoot) throws IOException {
        try (Stream<Path> walk = Files.walk(repoRoot)) {
            return walk
                    .filter(Files::isRegularFile)
                    .filter(path -> !isInIgnoredDirectory(repoRoot, path))
                    .map(path -> toDiscoveredFile(repoRoot, path))
                    .filter(f -> f != null)
                    .filter(f -> isWithinSizeLimit(f.absolutePath()))
                    .toList();
        }
    }

    private boolean isInIgnoredDirectory(Path root, Path path) {
        Path relative = root.relativize(path);
        for (int i = 0; i < relative.getNameCount() - 1; i++) {
            if (IGNORED_DIR_NAMES.contains(relative.getName(i).toString())) {
                return true;
            }
        }
        return false;
    }

    private DiscoveredFile toDiscoveredFile(Path root, Path path) {
        String fileName = path.getFileName().toString();
        if (IGNORED_FILE_NAMES.contains(fileName)) return null;

        int dot = fileName.lastIndexOf('.');
        if (dot < 0) return null;

        String extension = fileName.substring(dot + 1).toLowerCase();
        String language = LANGUAGE_BY_EXTENSION.get(extension);
        if (language == null) return null; // not a recognized source language — skip

        return new DiscoveredFile(path, root.relativize(path).toString(), language);
    }

    private boolean isWithinSizeLimit(Path path) {
        try {
            return Files.size(path) <= maxFileSizeBytes;
        } catch (IOException e) {
            return false;
        }
    }
}