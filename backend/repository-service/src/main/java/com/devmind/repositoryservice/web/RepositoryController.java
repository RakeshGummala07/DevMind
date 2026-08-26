package com.devmind.repositoryservice.web;

import com.devmind.repositoryservice.dto.AvailableRepoDto;
import com.devmind.repositoryservice.dto.ConnectRepositoryRequest;
import com.devmind.repositoryservice.dto.RepositoryDto;
import com.devmind.repositoryservice.exception.AppException;
import com.devmind.repositoryservice.service.RepositoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repositories")
public class RepositoryController {

    private final RepositoryService repositoryService;

    public RepositoryController(RepositoryService repositoryService) {
        this.repositoryService = repositoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RepositoryDto>>> listConnected(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.ok(repositoryService.listConnected(userId)));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<AvailableRepoDto>>> listAvailable(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(ApiResponse.ok(repositoryService.listAvailable(userId)));
    }

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<RepositoryDto>> connect(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody ConnectRepositoryRequest request
    ) {
        RepositoryDto connected = repositoryService.connect(userId, request.fullName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(connected, "Repository connected"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RepositoryDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(repositoryService.getById(id)));
    }

    @PostMapping("/{id}/index")
    public ResponseEntity<ApiResponse<RepositoryDto>> requestIndexing(@PathVariable String id) {
        RepositoryDto repo = repositoryService.requestIndexing(id);
        return ResponseEntity.accepted().body(ApiResponse.ok(repo, "Indexing started"));
    }
}
