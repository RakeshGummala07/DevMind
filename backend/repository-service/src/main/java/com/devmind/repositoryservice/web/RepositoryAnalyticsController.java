package com.devmind.repositoryservice.web;

import com.devmind.repositoryservice.dto.CommitActivityDto;
import com.devmind.repositoryservice.dto.PullRequestSummaryDto;
import com.devmind.repositoryservice.service.RepoAnalyticsSyncService;
import com.devmind.repositoryservice.service.RepoAnalyticsSyncService.SyncResult;
import com.devmind.repositoryservice.service.RepositoryAnalyticsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/repositories/{repositoryId}/analytics")
public class RepositoryAnalyticsController {

    private final RepoAnalyticsSyncService syncService;
    private final RepositoryAnalyticsService analyticsService;

    public RepositoryAnalyticsController(RepoAnalyticsSyncService syncService, RepositoryAnalyticsService analyticsService) {
        this.syncService = syncService;
        this.analyticsService = analyticsService;
    }

    /** Pulls fresh commit + PR data from GitHub. Call this before reading the endpoints below
     *  the first time, or whenever you want up-to-date numbers — nothing auto-refreshes yet. */
    @PostMapping("/sync")
    public ApiResponse<SyncResult> sync(@PathVariable String repositoryId) {
        return ApiResponse.ok(syncService.sync(repositoryId), "Analytics synced from GitHub");
    }

    @GetMapping("/commits")
    public ApiResponse<CommitActivityDto> commits(
            @PathVariable String repositoryId,
            @RequestParam(name = "days", defaultValue = "30") int days
    ) {
        return ApiResponse.ok(analyticsService.commitActivity(repositoryId, days));
    }

    @GetMapping("/pull-requests")
    public ApiResponse<PullRequestSummaryDto> pullRequests(@PathVariable String repositoryId) {
        return ApiResponse.ok(analyticsService.pullRequestSummary(repositoryId));
    }
}
