package com.devmind.authservice.service;

import com.devmind.authservice.domain.Role;
import com.devmind.authservice.domain.User;
import com.devmind.authservice.dto.UserSummaryDto;
import com.devmind.authservice.exception.AppException;
import com.devmind.authservice.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class UserManagementService {

    private static final Set<Role> CAN_MANAGE_USERS = Set.of(Role.ADMIN, Role.TEAM_ADMIN);

    private final UserRepository userRepository;

    public UserManagementService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserSummaryDto> listUsers(String actingUserId) {
        requireManager(actingUserId);
        return userRepository.findAll().stream().map(UserSummaryDto::from).toList();
    }

    public UserSummaryDto updateRole(String actingUserId, String targetUserId, String requestedRole) {
        User actingUser = requireManager(actingUserId);

        Role newRole;
        try {
            newRole = Role.valueOf(requestedRole.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw AppException.badRequest("INVALID_ROLE", "role must be one of USER, DEVELOPER, TEAM_ADMIN, ADMIN");
        }

        if (actingUserId.equals(targetUserId)) {
            throw AppException.badRequest("CANNOT_CHANGE_OWN_ROLE", "You can't change your own role — ask another admin.");
        }

        // Only a full ADMIN can grant or revoke ADMIN — a TEAM_ADMIN managing
        // day-to-day roles shouldn't be able to escalate themselves or anyone
        // else to full admin.
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> AppException.badRequest("USER_NOT_FOUND", "User was not found"));

        if ((newRole == Role.ADMIN || targetUser.getRole() == Role.ADMIN) && actingUser.getRole() != Role.ADMIN) {
            throw AppException.forbidden("ADMIN_ROLE_RESTRICTED", "Only an admin can grant or change an admin's role");
        }

        targetUser.setRole(newRole);
        return UserSummaryDto.from(userRepository.save(targetUser));
    }

    private User requireManager(String actingUserId) {
        User actingUser = userRepository.findById(actingUserId)
                .orElseThrow(() -> AppException.forbidden("FORBIDDEN", "Not authorized"));
        if (!CAN_MANAGE_USERS.contains(actingUser.getRole())) {
            throw AppException.forbidden("FORBIDDEN", "Only team admins and admins can manage users");
        }
        return actingUser;
    }
}
