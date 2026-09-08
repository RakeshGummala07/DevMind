package com.devmind.authservice.web;

import com.devmind.authservice.dto.UpdateRoleRequest;
import com.devmind.authservice.dto.UserSummaryDto;
import com.devmind.authservice.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth/users")
public class UserAdminController {

    private final UserManagementService userManagementService;

    public UserAdminController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public ApiResponse<List<UserSummaryDto>> list(Authentication authentication) {
        return ApiResponse.ok(userManagementService.listUsers(authentication.getName()));
    }

    @PatchMapping("/{userId}/role")
    public ApiResponse<UserSummaryDto> updateRole(
            Authentication authentication,
            @PathVariable String userId,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        UserSummaryDto dto = userManagementService.updateRole(authentication.getName(), userId, request.role());
        return ApiResponse.ok(dto, "Role updated");
    }
}
