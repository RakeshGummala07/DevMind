package com.devmind.notificationservice.web;

import com.devmind.notificationservice.domain.NotificationType;
import com.devmind.notificationservice.dto.NotificationDto;
import com.devmind.notificationservice.dto.NotificationPreferenceDto;
import com.devmind.notificationservice.exception.AppException;
import com.devmind.notificationservice.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationDto>> list(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly
    ) {
        List<NotificationDto> dtos = notificationService.list(userId, unreadOnly).stream()
                .map(NotificationDto::from)
                .toList();
        return ApiResponse.ok(dtos);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unreadCount(@RequestHeader("X-User-Id") String userId) {
        return ApiResponse.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationDto> markRead(@RequestHeader("X-User-Id") String userId, @PathVariable String id) {
        NotificationDto dto = NotificationDto.from(notificationService.markRead(userId, id));
        return ApiResponse.ok(dto);
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllRead(@RequestHeader("X-User-Id") String userId) {
        notificationService.markAllRead(userId);
        return ApiResponse.ok(null, "All notifications marked read");
    }

    @GetMapping("/preferences")
    public ApiResponse<NotificationPreferenceDto> getPreferences(@RequestHeader("X-User-Id") String userId) {
        Set<String> muted = notificationService.getMutedTypes(userId).stream().map(Enum::name).collect(Collectors.toSet());
        return ApiResponse.ok(new NotificationPreferenceDto(muted));
    }

    @PutMapping("/preferences")
    public ApiResponse<NotificationPreferenceDto> updatePreferences(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody NotificationPreferenceDto request
    ) {
        Set<NotificationType> parsed = (request.mutedTypes() == null ? Set.<String>of() : request.mutedTypes()).stream()
                .map(this::parseType)
                .collect(Collectors.toSet());

        Set<String> saved = notificationService.updateMutedTypes(userId, parsed).stream().map(Enum::name).collect(Collectors.toSet());
        return ApiResponse.ok(new NotificationPreferenceDto(saved), "Preferences updated");
    }

    private NotificationType parseType(String raw) {
        try {
            return NotificationType.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw AppException.badRequest("INVALID_NOTIFICATION_TYPE",
                    "'" + raw + "' is not a valid notification type");
        }
    }
}
