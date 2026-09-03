package com.devmind.aiservice.web;

import com.devmind.aiservice.domain.DocType;
import com.devmind.aiservice.dto.GenerateDocumentRequest;
import com.devmind.aiservice.dto.GeneratedDocumentDto;
import com.devmind.aiservice.exception.AppException;
import com.devmind.aiservice.service.DocumentationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories/{repositoryId}/documentation")
public class DocumentationController {

    private final DocumentationService documentationService;

    public DocumentationController(DocumentationService documentationService) {
        this.documentationService = documentationService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<GeneratedDocumentDto>> generate(
            @PathVariable String repositoryId,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody GenerateDocumentRequest request
    ) {
        DocType docType = parseDocType(request.docType());
        GeneratedDocumentDto dto = documentationService.generate(repositoryId, docType, userId);
        return ResponseEntity.ok(ApiResponse.ok(dto, "Document generated"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GeneratedDocumentDto>>> list(@PathVariable String repositoryId) {
        return ResponseEntity.ok(ApiResponse.ok(documentationService.listLatestPerType(repositoryId)));
    }

    @GetMapping("/{docType}")
    public ResponseEntity<ApiResponse<GeneratedDocumentDto>> getLatest(
            @PathVariable String repositoryId,
            @PathVariable String docType
    ) {
        GeneratedDocumentDto dto = documentationService.getLatest(repositoryId, parseDocType(docType));
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    private DocType parseDocType(String raw) {
        try {
            return DocType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw AppException.badRequest("INVALID_DOC_TYPE",
                    "docType must be one of README, ARCHITECTURE, API, ONBOARDING");
        }
    }
}
