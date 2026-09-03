package com.devmind.notificationservice.web;

import com.devmind.notificationservice.dto.NotificationDto;
import com.devmind.notificationservice.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
}
