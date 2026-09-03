package com.devmind.notificationservice.service;

import com.devmind.notificationservice.domain.Notification;
import com.devmind.notificationservice.domain.NotificationType;
import com.devmind.notificationservice.exception.AppException;
import com.devmind.notificationservice.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createIndexNotification(String userId, boolean succeeded, String repositoryId, String githubFullName) {
        NotificationType type = succeeded ? NotificationType.INDEX_COMPLETED : NotificationType.INDEX_FAILED;
        String title = succeeded ? "Indexing complete" : "Indexing failed";
        String message = succeeded
                ? githubFullName + " has been indexed and is ready to search and chat with."
                : githubFullName + " could not be indexed. Check the ingestion-service logs for details.";

        Notification notification = Notification.create(userId, type, title, message, repositoryId);
        return notificationRepository.save(notification);
    }

    public Notification createReviewNotification(String userId, boolean succeeded, String repositoryId, int prNumber, int findingsCount) {
        NotificationType type = succeeded ? NotificationType.REVIEW_COMPLETED : NotificationType.REVIEW_FAILED;
        String title = succeeded ? "PR review complete" : "PR review failed";
        String message = succeeded
                ? "Review of PR #" + prNumber + " finished with " + findingsCount + " finding(s)."
                : "Review of PR #" + prNumber + " failed. Try again from the Pull requests tab.";

        Notification notification = Notification.create(userId, type, title, message, repositoryId);
        return notificationRepository.save(notification);
    }

    public List<Notification> list(String userId, boolean unreadOnly) {
        return unreadOnly
                ? notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public Notification markRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> AppException.notFound("NOTIFICATION_NOT_FOUND", "Notification was not found"));

        if (!notification.getUserId().equals(userId)) {
            throw AppException.notFound("NOTIFICATION_NOT_FOUND", "Notification was not found");
        }

        notification.markRead();
        return notificationRepository.save(notification);
    }

    public void markAllRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(Notification::markRead);
        notificationRepository.saveAll(unread);
    }
}
