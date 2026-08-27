package com.devmind.ingestionservice.service;

import com.devmind.ingestionservice.service.FileDiscoveryService.DiscoveredFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;


@Service
public class ChunkingService {

    private final int chunkLines;
    private final int overlapLines;

    public ChunkingService(
            @Value("${devmind.chunk-lines}") int chunkLines,
            @Value("${devmind.chunk-overlap-lines}") int overlapLines
    ) {
        this.chunkLines = chunkLines;
        this.overlapLines = overlapLines;
    }

    public record CodeChunk(String content, String filePath, String language, int chunkIndex, int startLine, int endLine) {}

    public List<CodeChunk> chunk(DiscoveredFile file) throws IOException {
        List<String> lines = Files.readAllLines(file.absolutePath(), StandardCharsets.UTF_8);
        List<CodeChunk> chunks = new ArrayList<>();

        if (lines.isEmpty()) return chunks;

        int index = 0;
        int start = 0;
        int step = Math.max(1, chunkLines - overlapLines);

        while (start < lines.size()) {
            int end = Math.min(start + chunkLines, lines.size());
            String content = String.join("\n", lines.subList(start, end));

            if (!content.isBlank()) {
                chunks.add(new CodeChunk(content, file.relativePath(), file.language(), index, start + 1, end));
                index++;
            }

            if (end == lines.size()) break;
            start += step;
        }

        return chunks;
    }
}
